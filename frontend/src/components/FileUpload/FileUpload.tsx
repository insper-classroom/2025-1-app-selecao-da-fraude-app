import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileCheck, AlertCircle, X } from 'lucide-react';
import Button from '../UI/Button';

interface FileUploadProps {
  onFileSelect: (files: { [key: string]: File }) => void;
  requiredFiles: string[];
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  requiredFiles,
  className = '' 
}) => {
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    const newFiles = { ...files };
    let hasInvalidFile = false;
    
    acceptedFiles.forEach(file => {
      const fileName = file.name.toLowerCase();
      
      if (!fileName.endsWith('.feather')) {
        hasInvalidFile = true;
        return;
      }
      
      // Map the file to the appropriate category
      if (fileName.includes('payers')) {
        newFiles['payers'] = file;
      } else if (fileName.includes('sellers')) {
        newFiles['sellers'] = file;
      } else if (fileName.includes('transactions')) {
        newFiles['transactions'] = file;
      }
    });
    
    if (hasInvalidFile) {
      setError('Somente arquivos .feather são permitidos');
      return;
    }
    
    setFiles(newFiles);
    onFileSelect(newFiles);
  }, [files, onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/octet-stream': ['.feather']
    }
  });
  
  const removeFile = (key: string) => {
    const newFiles = { ...files };
    delete newFiles[key];
    setFiles(newFiles);
    onFileSelect(newFiles);
  };
  
  const getFileStatus = () => {
    return requiredFiles.map(fileType => ({
      type: fileType,
      uploaded: !!files[fileType],
      file: files[fileType]
    }));
  };
  
  const fileStatus = getFileStatus();
  const allFilesUploaded = requiredFiles.every(fileType => !!files[fileType]);

  return (
    <div className={className}>
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive 
            ? 'border-ml-blue bg-blue-50' 
            : 'border-gray-300 hover:border-ml-blue hover:bg-blue-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload 
          className="mx-auto h-12 w-12 text-ml-blue mb-4" 
          strokeWidth={1.5} 
        />
        <p className="text-lg font-medium text-gray-700">
          Arraste e solte arquivos aqui
        </p>
        <p className="text-sm text-gray-500 mt-1">
          ou clique para selecionar arquivos
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Somente arquivos .feather são aceitos
        </p>
        
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm"
            type="button"
          >
            Selecionar Arquivos
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 rounded-md bg-red-50 text-red-700 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="mt-4">
        <h3 className="font-medium text-gray-700 mb-2">
          Arquivos Necessários:
        </h3>
        <ul className="space-y-2">
          {fileStatus.map((status) => (
            <li 
              key={status.type} 
              className={`flex items-center justify-between p-3 rounded-md ${
                status.uploaded ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                {status.uploaded ? (
                  <FileCheck className="h-5 w-5 text-ml-success mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                )}
                <div>
                  <p className="font-medium">
                    {status.type.charAt(0).toUpperCase() + status.type.slice(1)}.feather
                  </p>
                  {status.uploaded && (
                    <p className="text-xs text-gray-500">
                      {status.file?.name} - {(status.file?.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </div>
              
              {status.uploaded && (
                <button 
                  onClick={() => removeFile(status.type)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      {allFilesUploaded && (
        <div className="mt-4 p-3 rounded-md bg-green-50 text-green-700 flex items-center">
          <FileCheck className="h-5 w-5 mr-2 text-ml-success" />
          <span>Todos os arquivos necessários foram carregados</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;