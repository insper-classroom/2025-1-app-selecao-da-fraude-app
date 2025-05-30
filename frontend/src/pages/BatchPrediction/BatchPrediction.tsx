import React, { useState } from 'react';
import { UploadCloud, ArrowLeft, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import PageTitle from '../../components/UI/PageTitle';
import FileUpload from '../../components/FileUpload/FileUpload';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import Alert from '../../components/UI/Alert';
import { predictBatch } from '../../services/apiService';

const BatchPrediction: React.FC = () => {
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  const requiredFiles = ['payers', 'sellers', 'transactions'];
  const hasAllFiles = requiredFiles.every(fileType => !!files[fileType]);
  
  const handleFileSelect = (selectedFiles: { [key: string]: File }) => {
    setFiles(selectedFiles);
    setError(null);
    setResultUrl(null);
    setProcessingProgress(0);
  };
  
  const handleSubmit = async () => {
    if (!hasAllFiles) {
      setError('É necessário fazer upload de todos os arquivos necessários.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setProcessingProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 500);
      
      // In a real implementation, we would call the API
      // For demo purposes, let's simulate an API call with a delay
      const response = await predictBatch(files, (progress) => {
        setProcessingProgress(progress);
      });
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      setResultUrl(response.resultUrl);
      
      toast.success('Processamento em lote concluído com sucesso!');
    } catch (err) {
      console.error('Error making batch prediction:', err);
      setError('Ocorreu um erro ao processar o lote. Por favor, tente novamente.');
      toast.error('Erro ao processar lote');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (resultUrl) {
      // In a real implementation, this would trigger the download
      // For demo purposes, we'll just show a toast
      toast.info('Download iniciado!');
    }
  };
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <Link to="/" className="text-ml-blue hover:text-ml-dark-blue mr-4">
          <ArrowLeft size={20} />
        </Link>
        <PageTitle 
          title="Predição em Lote" 
          subtitle="Processe múltiplas transações de uma só vez para análise em massa."
          icon={<UploadCloud size={24} />}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold text-ml-black mb-4">
              Upload de Arquivos para Processamento em Lote
            </h2>
            <FileUpload 
              onFileSelect={handleFileSelect} 
              requiredFiles={requiredFiles}
            />
            
            {error && (
              <Alert 
                type="error" 
                message={error} 
                className="mt-4"
              />
            )}
            
            <div className="mt-6">
              <Button
                onClick={handleSubmit}
                disabled={!hasAllFiles || isLoading}
                isLoading={isLoading}
              >
                Iniciar Processamento em Lote
              </Button>
            </div>
          </Card>
          
          {(isLoading || processingProgress > 0) && (
            <Card className="mt-6">
              <h2 className="text-lg font-semibold text-ml-black mb-4">
                Status do Processamento
              </h2>
              <div className="space-y-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-ml-blue h-4 rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {isLoading 
                    ? `Processando lote: ${Math.round(processingProgress)}% concluído` 
                    : 'Processamento concluído!'}
                </p>
              </div>
            </Card>
          )}
          
          {resultUrl && (
            <Card className="mt-6 border-l-4 border-ml-success">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ml-success mb-2">
                    Processamento Concluído
                  </h2>
                  <p className="text-sm text-gray-600 mb-4 md:mb-0">
                    O arquivo com os resultados está pronto para download.
                  </p>
                </div>
                <Button
                  onClick={handleDownload}
                  icon={<Download size={16} />}
                >
                  Baixar Resultados
                </Button>
              </div>
            </Card>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <Card className="h-full">
            <h2 className="text-lg font-semibold text-ml-black mb-4">
              Instruções
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Para realizar processamento em lote, siga os passos abaixo:
              </p>
              
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                <li>Faça upload dos três arquivos necessários: <span className="font-medium">payers.feather</span>, <span className="font-medium">sellers.feather</span> e <span className="font-medium">transactions.feather</span>.</li>
                <li>Certifique-se de que os arquivos estão no formato correto (.feather).</li>
                <li>Clique no botão "Iniciar Processamento em Lote".</li>
                <li>Aguarde o processamento ser concluído.</li>
                <li>Faça o download do arquivo de resultados.</li>
              </ol>
              
              <div className="flex items-start bg-yellow-50 p-3 rounded-md">
                <AlertTriangle size={20} className="text-ml-warning mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  O processamento em lote pode levar alguns minutos dependendo do tamanho dos arquivos.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BatchPrediction;