from shotgun_api3 import Shotgun
import os
import json
import sys
from datetime import datetime

# ----------------------------- 配置 -----------------------------
SERVER_URL = "https://huise.shotgrid.autodesk.com/"
SCRIPT_NAME = "project_manager"
API_KEY = "dgdmusirarQtzfo2&wqwqjaav"
PROJECT_NAME = "huise"

DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "../", "downloads")
UPLOAD_TEMP_DIR = os.path.join(os.path.dirname(__file__), "../", "temp")
# --------------------------------------------------------------

# 创建必要目录
os.makedirs(DOWNLOAD_DIR, exist_ok=True)
os.makedirs(UPLOAD_TEMP_DIR, exist_ok=True)


# 用 stderr 输出日志，不污染 stdout
def log(*msg):
    print(*msg, file=sys.stderr)


# --------------------- 初始化 ShotGrid（不会输出 stdout） ---------------------
sg = Shotgun(SERVER_URL, script_name=SCRIPT_NAME, api_key=API_KEY)

project = sg.find_one("Project", [["name", "is", PROJECT_NAME]], ["id"])
if not project:
    # 所有异常均输出 JSON 到 stdout
    print(json.dumps({"success": False, "error": f"未找到项目: {PROJECT_NAME}"}, ensure_ascii=False))
    sys.exit(0)

project_id = project["id"]
log(f"[SG] 项目已加载: {PROJECT_NAME} (ID: {project_id})")
# -------------------------------------------------------------------------


def upload_image_to_shotgrid(image_path, asset_name, version_name=None, asset_type="Prop"):
    try:
        if not os.path.exists(image_path):
            return {"success": False, "error": f"文件不存在: {image_path}"}

        allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".tiff", ".bmp"]
        ext = os.path.splitext(image_path)[-1].lower()
        if ext not in allowed_extensions:
            return {
                "success": False,
                "error": f"不支持的文件类型: {ext}，支持: {allowed_extensions}"
            }

        # 查找或创建资产
        asset = sg.find_one(
            "Asset",
            [
                ["project", "is", {"type": "Project", "id": project_id}],
                ["code", "is", asset_name]
            ],
            ["id"],
        )

        if not asset:
            log(f"[SG] 创建资产: {asset_name}")
            asset = sg.create(
                "Asset",
                {
                    "project": {"type": "Project", "id": project_id},
                    "code": asset_name,
                    "sg_asset_type": asset_type,
                },
            )
        else:
            log(f"[SG] 已找到资产: {asset_name} (ID: {asset['id']})")

        # 自动版本号
        if not version_name:
            version_name = datetime.now().strftime("v%Y%m%d_%H%M%S")

        version = sg.create(
            "Version",
            {
                "project": {"type": "Project", "id": project_id},
                "code": version_name,
                "entity": {"type": "Asset", "id": asset["id"]},
                "description": f"自动上传版本: {version_name}",
            },
        )
        log(f"[SG] 创建版本: {version_name}")

        uploaded = sg.upload("Version", version["id"], image_path, field_name="image")
        log(f"[SG] 上传图片成功: {image_path}")

        version_detail = sg.find_one(
            "Version", [["id", "is", version["id"]]], ["image"]
        )

        image_url = ""
        if version_detail and isinstance(version_detail.get("image"), dict):
            image_url = version_detail["image"].get("url", "")

        return {
            "success": True,
            "data": {
                "asset_id": asset["id"],
                "asset_name": asset_name,
                "asset_type": asset_type,
                "version_id": version["id"],
                "version_name": version_name,
                "image_url": image_url,
            },
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# ----------------------------- 主入口（只输出 JSON） -----------------------------
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "upload" and len(sys.argv) >= 4:
        image_path = sys.argv[2]
        asset_name = sys.argv[3]
        version_name = sys.argv[4] if len(sys.argv) > 4 else None
        asset_type = sys.argv[5] if len(sys.argv) > 5 else "Prop"

        result = upload_image_to_shotgrid(image_path, asset_name, version_name, asset_type)

        # ❗❗唯一输出到 stdout 的 JSON
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)

    # 其它情况输出帮助（也仅 JSON）
    print(json.dumps({
        "success": False,
        "error": "用法: python sg.py upload <图片路径> <资产名称> [版本] [资产类型]"
    }, ensure_ascii=False))
