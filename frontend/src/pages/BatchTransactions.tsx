
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { apiService, BatchPredictionResponse } from '@/services/api';
import { Upload, FileUp, CheckCircle, AlertCircle, Clock, Files, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';

const BatchTransactions = () => {
  const [file, setFile] = useState<File | null>(null);
  const [generateLogs, setGenerateLogs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchPredictionResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.name.endsWith('.feather')) {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast.error('Por favor, selecione um arquivo .feather válido');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.predictBatch(file, generateLogs);
      setResult(response);
      toast.success('Processamento iniciado com sucesso!');
    } catch (error) {
      console.error('Erro no processamento:', error);
      toast.error('Erro ao processar as transações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
          <Files className="w-4 h-4" />
          <span>Processamento em Lote</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Análise de Múltiplas Transações
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Processe milhares de transações simultaneamente com nossa tecnologia de análise em lote
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <Files className="w-5 h-5 text-white" />
              </div>
              Enviar Arquivo em Lote
            </CardTitle>
            <CardDescription className="text-base">
              Selecione um arquivo .feather com múltiplas transações para análise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                dragActive 
                  ? 'border-green-500 bg-green-50 scale-105' 
                  : 'border-slate-300 hover:border-green-500 hover:bg-slate-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className={`p-4 rounded-full mx-auto w-fit mb-4 ${dragActive ? 'bg-green-100' : 'bg-slate-100'}`}>
                <FileUp className={`w-8 h-8 ${dragActive ? 'text-green-600' : 'text-slate-400'}`} />
              </div>
              <p className="text-slate-600 mb-4 text-lg">
                Arraste e solte seu arquivo .feather aqui
              </p>
              <p className="text-slate-500 mb-6">ou</p>
              <Label htmlFor="file-input-batch">
                <Button variant="outline" className="cursor-pointer border-2 hover:bg-green-500 hover:text-white transition-all duration-300" asChild>
                  <span className="px-6 py-2 text-base">Selecionar Arquivo</span>
                </Button>
              </Label>
              <Input
                id="file-input-batch"
                type="file"
                accept=".feather"
                className="hidden"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              />
            </div>

            {file && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Arquivo selecionado:</strong> {file.name}
                  <br />
                  <strong>Tamanho:</strong> {(file.size / (1024 * 1024)).toFixed(2)} MB
                </AlertDescription>
              </Alert>
            )}

            {/* Options */}
            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
              <Checkbox 
                id="generate-logs-batch" 
                checked={generateLogs}
                onCheckedChange={(checked) => setGenerateLogs(checked === true)}
              />
              <Label htmlFor="generate-logs-batch" className="text-sm font-medium cursor-pointer">
                Gerar logs desta análise
              </Label>
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit} 
              disabled={!file || loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-base font-semibold shadow-lg"
            >
              {loading ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  Iniciando Processamento...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Processar Transações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Status Section */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              Status do Processamento
            </CardTitle>
            <CardDescription className="text-base">
              Acompanhe o progresso da análise em lote
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-12">
                <div className="p-6 bg-purple-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="w-12 h-12 text-purple-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Iniciando Processamento</h3>
                <p className="text-slate-600 mb-2">Preparando análise em lote...</p>
                <p className="text-sm text-slate-500">
                  O processamento pode demorar mais de 1 hora dependendo do tamanho do arquivo
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl text-base font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
                    <CheckCircle className="w-5 h-5" />
                    Processamento Iniciado
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                    <Label className="text-sm font-semibold text-green-800 uppercase tracking-wide">Status</Label>
                    <p className="text-lg font-semibold text-green-900 mt-1">{result.message}</p>
                  </div>

                  <div className="text-center p-6 bg-slate-50 rounded-xl">
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {result.total_transactions.toLocaleString('pt-BR')}
                    </div>
                    <p className="text-slate-600 font-medium">Transações para Processar</p>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Processamento em Andamento:</strong> Os dados estão sendo processados em segundo plano. 
                    O tempo pode variar de acordo com o volume de transações. Acompanhe o progresso na página de logs.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {!loading && !result && (
              <div className="text-center py-12">
                <div className="p-6 bg-slate-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Files className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Pronto para Processar</h3>
                <p className="text-slate-600">Selecione um arquivo para começar a análise em lote</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info and Tips Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Formato do arquivo:</strong> O arquivo deve estar no formato .feather e conter 
            múltiplas transações com os campos: transaction_id, tx_datetime e demais campos necessários.
          </AlertDescription>
        </Alert>

        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Tempo de processamento:</strong> O processamento em lote pode demorar 
            mais de 1 hora dependendo da quantidade de transações.
          </AlertDescription>
        </Alert>
      </div>

      {/* Performance Tips */}
      <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            Dicas para Melhor Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: CheckCircle, text: 'Mantenha arquivos com menos de 100MB para melhor performance', color: 'text-green-600' },
              { icon: CheckCircle, text: 'Certifique-se de que todas as colunas obrigatórias estão presentes', color: 'text-green-600' },
              { icon: CheckCircle, text: 'Evite valores nulos nos campos críticos', color: 'text-green-600' },
              { icon: CheckCircle, text: 'Use IDs de transação únicos para facilitar o rastreamento', color: 'text-green-600' }
            ].map((tip, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                <tip.icon className={`w-5 h-5 mt-0.5 ${tip.color} flex-shrink-0`} />
                <span className="text-slate-700">{tip.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchTransactions;
