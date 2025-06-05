
const API_BASE_URL = 'https://meli.joaocitino.tech';

export interface SinglePredictionResponse {
  transaction_id: string;
  prediction: number;
  probability: number;
  is_fraud: boolean;
}

export interface BatchPredictionResponse {
  message: string;
  total_transactions: number;
}

export interface LogEntry {
  id: number;
  transaction_id: string;
  prediction: number;
  probability: number;
  is_fraud: boolean;
  is_batch: boolean;
  created_at: string;
  transaction_date: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface LogsFilters {
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

class ApiService {
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, API_BASE_URL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    return url.toString();
  }

  async predictSingle(file: File, generateLogs: boolean = true): Promise<SinglePredictionResponse> {
    const formData = new FormData();
    formData.append('transactions', file);
    formData.append('generate_logs', generateLogs.toString());

    const response = await fetch(this.buildUrl('/predict/single'), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async predictBatch(file: File, generateLogs: boolean = true): Promise<BatchPredictionResponse> {
    const formData = new FormData();
    formData.append('transactions', file);
    formData.append('generate_logs', generateLogs.toString());

    const response = await fetch(this.buildUrl('/predict/batch'), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getLogs(filters: LogsFilters = {}): Promise<LogsResponse> {
    const response = await fetch(this.buildUrl('/logs', filters));

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getStats(): Promise<{ total_transactions: number }> {
    try {
      const response = await this.getLogs({ page: 1, page_size: 1 });
      return { total_transactions: response.total };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { total_transactions: 0 };
    }
  }
}

export const apiService = new ApiService();
