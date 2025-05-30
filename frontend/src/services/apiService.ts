import axios from 'axios';
import { PredictionResultData } from '../components/Prediction/PredictionResult';
import { LogEntry } from '../components/Logs/LogsTable';

// For demo purposes, we'll simulate API calls
// In a real implementation, these would make actual API requests

// Mock data for single prediction
const mockPredictionResult: PredictionResultData = {
  transaction_id: 'TX123456789',
  prediction: Math.random() > 0.5 ? 1 : 0, // Randomly generate fraud (1) or not fraud (0)
  probability: Math.random() // Random probability between 0 and 1
};

// Mock data for logs
const generateMockLogs = (count: number): LogEntry[] => {
  return Array(count).fill(0).map((_, index) => ({
    _id: `log_${Date.now()}_${index}`,
    transaction_id: `TX${Math.floor(10000000 + Math.random() * 90000000)}`,
    prediction: Math.random() > 0.7 ? 1 : 0,
    probability: Math.random(),
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    model_version: `v${Math.floor(1 + Math.random() * 3)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`
  }));
};

// Single prediction API
export const predictSingle = async (files: { [key: string]: File }): Promise<PredictionResultData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // In a real implementation, we would create a FormData and send the files
  // const formData = new FormData();
  // Object.entries(files).forEach(([key, file]) => {
  //   formData.append(key, file);
  // });
  // return axios.post('/api/predict/single', formData);
  
  return mockPredictionResult;
};

// Batch prediction API
export const predictBatch = async (
  files: { [key: string]: File }, 
  onProgress?: (progress: number) => void
): Promise<{ resultUrl: string }> => {
  // Simulate a longer processing time with progress updates
  let progress = 0;
  const totalSteps = 20;
  
  for (let i = 1; i <= totalSteps; i++) {
    await new Promise(resolve => setTimeout(resolve, 300));
    progress = (i / totalSteps) * 100;
    if (onProgress) {
      onProgress(progress);
    }
  }
  
  // In a real implementation, we would create a FormData and send the files
  // const formData = new FormData();
  // Object.entries(files).forEach(([key, file]) => {
  //   formData.append(key, file);
  // });
  // return axios.post('/api/predict/batch', formData);
  
  return { resultUrl: 'https://api.example.com/results/batch_1234567890.feather' };
};

// Logs API
interface LogsParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

export const getLogs = async (params: LogsParams): Promise<{ logs: LogEntry[], totalPages: number }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In a real implementation, we would call the API with query parameters
  // return axios.get('/api/logs', { params });
  
  const mockLogsCount = params.limit || 100;
  const mockTotalPages = 5;
  
  return {
    logs: generateMockLogs(mockLogsCount),
    totalPages: mockTotalPages
  };
};