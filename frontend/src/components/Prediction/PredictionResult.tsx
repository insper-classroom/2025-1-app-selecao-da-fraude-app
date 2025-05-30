import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import Card from '../UI/Card';

export interface PredictionResultData {
  transaction_id: string;
  prediction: number;
  probability: number;
}

interface PredictionResultProps {
  result: PredictionResultData | null;
  isLoading: boolean;
  error: string | null;
}

const PredictionResult: React.FC<PredictionResultProps> = ({ result, isLoading, error }) => {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="flex flex-col space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-ml-error">
        <div className="flex items-start">
          <AlertTriangle className="h-6 w-6 text-ml-error mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-ml-error">Erro na Predição</h3>
            <p className="mt-1 text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  const isFraud = result.prediction === 1;
  const probabilityPercentage = (result.probability * 100).toFixed(2);
  
  return (
    <Card className={`border-l-4 ${isFraud ? 'border-ml-error' : 'border-ml-success'}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center mb-4">
            {isFraud ? (
              <AlertTriangle className="h-6 w-6 text-ml-error mr-3" />
            ) : (
              <CheckCircle className="h-6 w-6 text-ml-success mr-3" />
            )}
            <h3 className="text-lg font-medium">
              {isFraud ? 'Possível Fraude Detectada' : 'Transação Segura'}
            </h3>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">ID da Transação:</span> {result.transaction_id}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Resultado:</span>{' '}
              <span className={isFraud ? 'text-ml-error font-medium' : 'text-ml-success font-medium'}>
                {isFraud ? 'Fraude' : 'Não Fraude'}
              </span>
            </p>
          </div>
        </div>
        
        <div className="mt-6 md:mt-0">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Probabilidade de Fraude</p>
            <div className="relative h-24 w-24 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#eee"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={isFraud ? '#FF0000' : '#00A650'}
                  strokeWidth="3"
                  strokeDasharray={`${result.probability * 100}, 100`}
                />
                <text x="18" y="20.5" className="text-lg font-bold" textAnchor="middle" fill={isFraud ? '#FF0000' : '#00A650'}>
                  {probabilityPercentage}%
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PredictionResult;