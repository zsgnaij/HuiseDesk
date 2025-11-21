from shotgun_api3 import Shotgun
import requests
import os
import json
import sys
from datetime import datetime

# -----------------------------# 配置
# -----------------------------
SERVER_URL = "https://huise.shotgrid.autodesk.com/"
SCRIPT_NAME = "project_manager"
API_KEY = "dgdmusirarQtzfo2&wqwqjaav"
PROJECT_NAME = "huise"
DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "../", "downloads")  # 下载保存目录
UPLOAD_TEMP_DIR = os.path.join(os.path.dirname(__file__), "../", "temp")  # 临时上传目录
# -----------------------------

# 创建必要的目录
os.makedirs(DOWNLOAD_DIR, exist_ok=True)
os.makedirs(UPLOAD_TEMP_DIR, exist_ok=True)

# 连接 ShotGrid
sg = Shotgun(SERVER_URL, script_name=SCRIPT_NAME, api_key=API_KEY)

# 查询项目 ID
project = sg.find_one("Project", [["name", "is", PROJECT_NAME]], ["id"])
if not project:
    raise ValueError(f"未找到项目: {PROJECT_NAME}")
project_id = project["id"]
print(f"找到项目: ID={project_id}, Name={PROJECT_NAME}")


def upload_image_to_shotgrid(image_path, asset_name, version_name=None, asset_type="Prop"):
    """
    上传图片到 ShotGrid
    
    Args:
        image_path: 图片本地路径
        asset_name: 资产名称
        version_name: 版本名称，如果不提供则自动生成
        asset_type: 资产类型，默认为"Prop"
    
    Returns:
        dict: 包含成功状态和信息的字典
    """
    try:
        # 检查文件是否存在
        if not os.path.exists(image_path):
            return {
                "success": False,
                "error": f"文件不存在: {image_path}"
            }
        
        # 检查文件类型
        allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".tiff", ".bmp"]
        file_ext = os.path.splitext(image_path)[-1].lower()
        if file_ext not in allowed_extensions:
            return {
                "success": False,
                "error": f"不支持的文件类型: {file_ext}，支持的类型: {allowed_extensions}"
            }
        
        # 查找资产
        asset = sg.find_one(
            "Asset",
            [["project", "is", {"type": "Project", "id": project_id}],
             ["code", "is", asset_name]],
            ["id"]
        )
        
        if not asset:
            # 如果资产不存在，创建新资产
            asset = sg.create(
                "Asset",
                {
                    "project": {"type": "Project", "id": project_id},
                    "code": asset_name,
                    "sg_asset_type": asset_type  # 使用传入的资产类型
                }
            )
            if not asset or "id" not in asset:
                return {
                    "success": False,
                    "error": f"创建资产失败: {asset_name}"
                }
            print(f"创建新资产: {asset_name} (ID: {asset['id']})")
        else:
            print(f"找到已存在资产: {asset_name} (ID: {asset['id']})")
        
        # 如果没有提供版本名称，自动生成
        if not version_name:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            version_name = f"v{timestamp}"
        
        # 创建 Version 实体
        version = sg.create(
            "Version",
            {
                "project": {"type": "Project", "id": project_id},
                "code": version_name,
                "entity": {"type": "Asset", "id": asset["id"]},
                "description": f"自动上传的图片版本: {version_name}"
            }
        )
        
        # 上传图片到 Version 的 image 字段
        # ShotGrid API: upload(entity_type, entity_id, path, field_name, **kwargs)
        uploaded_file = sg.upload(
            "Version",
            version["id"],
            image_path,
            field_name="image"
        )
        
        if not uploaded_file:
            return {
                "success": False,
                "error": f"上传文件失败: {image_path}"
            }
        
        # 获取上传后的版本详情
        version_detail = sg.find_one(
            "Version",
            [["id", "is", version["id"]]],
            ["id", "code", "image"]
        )
        
        # 安全地提取图片 URL
        image_url = ""
        if version_detail and "image" in version_detail:
            image_data = version_detail["image"]
            if isinstance(image_data, dict) and "url" in image_data:
                image_url = image_data["url"]
        
        return {
            "success": True,
            "data": {
                "asset_name": asset_name,
                "asset_id": asset["id"],
                "asset_type": asset_type,
                "version_name": version_name,
                "version_id": version["id"],
                "image_url": image_url,
                "uploaded_file": uploaded_file
            },
            "message": f"成功上传图片到资产 {asset_name} 的版本 {version_name}"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def download_assets():
    """
    下载项目下所有资产的 Version 附件（原有的下载功能）
    """
    # 查询项目下所有资产
    assets = sg.find(
        "Asset",
        [["project", "is", {"type": "Project", "id": project_id}]],
        ["id", "code", "sg_asset_type"]
    )

    if not assets:
        print("该项目下没有资产")
        return

    # 下载每个资产的 Version 附件
    for asset in assets:
        asset_id = asset["id"]
        asset_name = asset["code"]
        print(f"\n处理资产: {asset_name} (ID: {asset_id})")

        versions = sg.find(
            "Version",
            [["entity", "is", {"type": "Asset", "id": asset_id}]],
            ["id", "code", "sg_uploaded_movie", "image"]
        )

        if not versions:
            print("  无关联 Version")
            continue

        for version in versions:
            version_name = version["code"]
            # 优先取 image 字段，其次 sg_uploaded_movie
            file_info = version.get("image") or version.get("sg_uploaded_movie")
            if not file_info:
                print(f"  Version {version_name} 无附件")
                continue
            file_url = None
            if isinstance(file_info, dict):
                file_url = file_info.get("url")
            elif isinstance(file_info, str):
                file_url = file_info
            if not file_url or not isinstance(file_url, str):
                print(f"  Version {version_name} 附件 URL 无效，跳过")
                continue
            # 从 URL 中提取文件名和扩展名（移除查询参数）
            from urllib.parse import urlparse, unquote
            parsed_url = urlparse(file_url)
            url_path = unquote(parsed_url.path)  # 解码 URL 编码
            file_ext = os.path.splitext(url_path)[-1]
            # 如果没有扩展名，尝试从 content-type 推断
            if not file_ext:
                file_ext = ".jpg"  # 默认扩展名
            safe_name = f"{asset_name}_{version_name}{file_ext}"
            local_path = os.path.join(DOWNLOAD_DIR, safe_name)

            # 下载文件
            try:
                r = requests.get(file_url, headers={"Shotgun-Session-Token": API_KEY}, stream=True)
                r.raise_for_status()
                with open(local_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
                print(f"  下载完成: {local_path}")
            except Exception as e:
                print(f"  下载失败: {e}")


# 命令行接口
if __name__ == "__main__":
    # 检查命令行参数
    if len(sys.argv) > 1:
        # 如果是 upload 命令
        if sys.argv[1] == "upload" and len(sys.argv) >= 4:
            image_path = sys.argv[2]
            asset_name = sys.argv[3]
            version_name = sys.argv[4] if len(sys.argv) > 4 else None
            asset_type = sys.argv[5] if len(sys.argv) > 5 else "Prop"  # 新增资产类型参数
            
            # 执行上传
            result = upload_image_to_shotgrid(image_path, asset_name, version_name, asset_type)
            # 输出 JSON 格式结果
            print(json.dumps(result, ensure_ascii=False))
        else:
            # 显示帮助信息
            print("用法:")
            print("  上传图片: python sg.py upload <图片路径> <资产名称> [版本名称] [资产类型]")
            print("  下载资产: python sg.py")
    else:
        # 默认执行下载功能
        download_assets()
