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
  const [assetType, setAssetType] = useState<string>('Prop'); // Default asset type
  const [versionName, setVersionName] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Asset types for the dropdown
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
      formData.append('image', selectedFile); // Changed from 'file' to 'image' to match Multer config
      formData.append('assetName', assetName);
      formData.append('assetType', assetType);
      formData.append('versionName', versionName);

      // Fixed the endpoint URL to match the backend
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
        setAssetType('Prop'); // Reset to default
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
    setAssetType('Prop'); // Reset to default
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
        >
          {uploading ? '上传中...' : '上传图片'}
        </button>
        <button 
          onClick={handleCancel} 
          disabled={uploading}
        >
          取消
        </button>
      </div>

      <style jsx>{`
        .image-uploader {
          padding: 20px;
          max-width: 500px;
          margin: 0 auto;
          background: #f5f5f5;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        h2 {
          text-align: center;
          color: #333;
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #555;
        }
        
        input[type="text"] {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .asset-type-select {
          width: 100%;
          padding: 8px 30px 8px 12px;
          border: 1px solid #ddd;
          border-radius: 20px;
          font-size: 14px;
          background-color: #f8f9fa;
          color: #333;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .asset-type-select:hover:not(:disabled) {
          border-color: #3498db;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .asset-type-select:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .asset-type-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        input[type="file"] {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
        }
        
        .file-info {
          margin: 10px 0;
          padding: 10px;
          background: #e8f4f8;
          border-radius: 4px;
          border-left: 3px solid #3498db;
        }
        
        .file-info p {
          margin: 5px 0;
          font-size: 14px;
          color: #333;
        }
        
        .error-message {
          color: #e74c3c;
          font-size: 14px;
          margin: 10px 0;
          padding: 10px;
          background: #fdedec;
          border-radius: 4px;
          border-left: 3px solid #e74c3c;
        }
        
        .result-message {
          margin: 10px 0;
          padding: 15px;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .result-message.success {
          background: #eafaf1;
          color: #2ecc71;
          border-left: 3px solid #2ecc71;
        }
        
        .result-message.error {
          background: #fdedec;
          color: #e74c3c;
          border-left: 3px solid #e74c3c;
        }
        
        .shotgrid-info {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        
        .shotgrid-info p {
          margin: 5px 0;
          color: #27ae60;
          font-size: 13px;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        
        button {
          flex: 1;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        button:first-child {
          background: #3498db;
          color: white;
        }
        
        button:first-child:hover:not(:disabled) {
          background: #2980b9;
        }
        
        button:last-child {
          background: #95a5a6;
          color: white;
        }
        
        button:last-child:hover:not(:disabled) {
          background: #7f8c8d;
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ShotGridUploader;