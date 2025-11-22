import React, { useState, useRef } from 'react';

interface ShotgridInfo {
  assetName: string;
  versionName: string;
  imageUrl: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  shotgridInfo?: ShotgridInfo;
}

const ShotGridUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assetName, setAssetName] = useState<string>('');
  const [assetType, setAssetType] = useState<string>('Prop'); // 默认资产类型
  const [versionName, setVersionName] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 下拉框的资产类型选项
  const assetTypes = [
    { value: 'Prop', label: '道具 (Prop)' },
    { value: 'Character', label: '角色 (Character)' },
    { value: 'Environment', label: '环境 (Environment)' },
    { value: 'Vehicle', label: '载具 (Vehicle)' },
    { value: 'Weapon', label: '武器 (Weapon)' },
    { value: 'Other', label: '其他 (Other)' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择有效的图片文件');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('请选择图片文件');
      return;
    }

    if (!assetName.trim()) {
      setError('请输入资产名称');
      return;
    }

    if (!versionName.trim()) {
      setError('请输入版本名称');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile); // 从'file'改为'image'以匹配Multer配置
      formData.append('assetName', assetName);
      formData.append('assetType', assetType);
      formData.append('versionName', versionName);

      // 修复端点URL以匹配后端
      const response = await fetch('http://localhost:3000/api/upload-to-shotgrid', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: '图片上传成功并已添加到ShotGrid！',
          shotgridInfo: data.shotgridInfo
        });
        // 重置表单
        setSelectedFile(null);
        setAssetName('');
        setAssetType('Prop'); // 重置为默认值
        setVersionName('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setResult({ success: false, message: data.message || '上传失败' });
      }
    } catch (err) {
      console.error('上传错误:', err);
      setResult({ success: false, message: '上传过程中发生错误' });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setAssetName('');
    setAssetType('Prop'); // 重置为默认值
    setVersionName('');
    setError('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-uploader">
      <h2>ShotGrid上传工具</h2>
      
      <div className="form-group">
        <label htmlFor="assetName">资产名称：</label>
        <input
          type="text"
          id="assetName"
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          placeholder="请输入ShotGrid资产名称"
          disabled={uploading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="assetType">资产类型：</label>
        <select
          id="assetType"
          value={assetType}
          onChange={(e) => setAssetType(e.target.value)}
          disabled={uploading}
          className="asset-type-select"
        >
          {assetTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="versionName">版本名称：</label>
        <input
          type="text"
          id="versionName"
          value={versionName}
          onChange={(e) => setVersionName(e.target.value)}
          placeholder="请输入版本名称"
          disabled={uploading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="fileUpload">选择图片：</label>
        <input
          type="file"
          id="fileUpload"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          disabled={uploading}
        />
      </div>

      {selectedFile && (
        <div className="file-info">
          <p>已选择文件：{selectedFile.name}</p>
          <p>文件大小：{(selectedFile.size / 1024).toFixed(2)} KB</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className={`result-message ${result.success ? 'success' : 'error'}`}>
          <p>{result.message}</p>
          {result.success && result.shotgridInfo && (
            <div className="shotgrid-info">
              <p>✅ 资产名称：{result.shotgridInfo.assetName}</p>
              <p>✅ 版本名称：{result.shotgridInfo.versionName}</p>
            </div>
          )}
        </div>
      )}

      <div className="button-group">
        <button 
          onClick={handleUpload} 
          disabled={uploading}
          className="upload-button"
        >
          {uploading ? '上传中...' : '上传到ShotGrid'}
        </button>
        <button 
          onClick={handleCancel} 
          disabled={uploading}
          className="cancel-button"
        >
          取消
        </button>
      </div>

      <style jsx>{`
        .image-uploader {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        input, select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #4a90e2;
          box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
        }

        input:disabled, select:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .file-info {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          margin-top: 0.5rem;
        }

        .file-info p {
          margin: 0.25rem 0;
          color: #666;
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          border: 1px solid #fcc;
        }

        .result-message {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .result-message.success {
          background-color: #efe;
          border: 1px solid #cfc;
          color: #363;
        }

        .result-message.error {
          background-color: #fee;
          border: 1px solid #fcc;
          color: #c33;
        }

        .shotgrid-info p {
          margin: 0.25rem 0;
          font-weight: 500;
        }

        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        button {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .upload-button {
          background-color: #4a90e2;
          color: white;
        }

        .upload-button:hover:not(:disabled) {
          background-color: #3a80d2;
        }

        .upload-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .cancel-button {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }

        .cancel-button:hover:not(:disabled) {
          background-color: #e5e5e5;
        }

        .cancel-button:disabled {
          background-color: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }

        .asset-type-select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1rem;
          padding-right: 2.5rem;
        }

        @media (max-width: 768px) {
          .image-uploader {
            padding: 1rem;
          }

          .button-group {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ShotGridUploader;