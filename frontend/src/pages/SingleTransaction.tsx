
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { apiService, SinglePredictionResponse } from '@/services/api';
import { Upload, FileUp, CheckCircle, AlertCircle, Clock, Shield, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const SingleTransaction = () => {
  const [file, setFile] = useState<File | null>(null);
  const [generateLogs, setGenerateLogs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SinglePredictionResponse | null>(null);
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
      const response = await apiService.predictSingle(file, generateLogs);
      setResult(response);
      toast.success('Análise concluída com sucesso!');
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Erro ao processar a transação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (probability: number) => {
    if (probability >= 0.8) return { level: 'Alto Risco', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-700' };
    if (probability >= 0.5) return { level: 'Médio Risco', color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' };
    return { level: 'Baixo Risco', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-700' };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-meli-blue px-4 py-2 rounded-full text-sm font-medium">
          <Shield className="w-4 h-4" />
          <span>Análise Individual</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Análise de Transação Individual
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Envie um arquivo .feather com dados de uma transação para análise detalhada de fraude
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <Upload className="w-5 h-5 text-white" />
              </div>
              Enviar Arquivo
            </CardTitle>
            <CardDescription className="text-base">
              Selecione ou arraste um arquivo .feather com os dados da transação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                dragActive 
                  ? 'border-meli-blue bg-blue-50 scale-105' 
                  : 'border-slate-300 hover:border-meli-blue hover:bg-slate-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className={`p-4 rounded-full mx-auto w-fit mb-4 ${dragActive ? 'bg-blue-100' : 'bg-slate-100'}`}>
                <FileUp className={`w-8 h-8 ${dragActive ? 'text-meli-blue' : 'text-slate-400'}`} />
              </div>
              <p className="text-slate-600 mb-4 text-lg">
                Arraste e solte seu arquivo .feather aqui
              </p>
              <p className="text-slate-500 mb-6">ou</p>
              <Label htmlFor="file-input">
                <Button variant="outline" className="cursor-pointer border-2 hover:bg-meli-blue hover:text-white transition-all duration-300" asChild>
                  <span className="px-6 py-2 text-base">Selecionar Arquivo</span>
                </Button>
              </Label>
              <Input
                id="file-input"
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
                  <strong>Tamanho:</strong> {(file.size / 1024).toFixed(1)} KB
                </AlertDescription>
              </Alert>
            )}

            {/* Options */}
            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
              <Checkbox 
                id="generate-logs" 
                checked={generateLogs}
                onCheckedChange={(checked) => setGenerateLogs(checked === true)}
              />
              <Label htmlFor="generate-logs" className="text-sm font-medium cursor-pointer">
                Gerar logs desta análise
              </Label>
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit} 
              disabled={!file || loading}
              className="w-full bg-gradient-to-r from-meli-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 text-base font-semibold shadow-lg"
            >
              {loading ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  Analisando Transação...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Analisar Transação
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              Resultado da Análise
            </CardTitle>
            <CardDescription className="text-base">
              Resultado detalhado da análise de fraude
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-12">
                <div className="p-6 bg-blue-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="w-12 h-12 text-meli-blue animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Processando Transação</h3>
                <p className="text-slate-600">Analisando padrões de fraude...</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Fraud Status */}
                <div className="text-center">
                  <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl text-base font-semibold ${
                    result.is_fraud 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  }`}>
                    {result.is_fraud ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {result.is_fraud ? 'Fraude Detectada' : 'Transação Legítima'}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">ID da Transação</Label>
                    <p className="text-lg font-mono font-bold text-slate-900 mt-1">{result.transaction_id}</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Probabilidade de Fraude</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-3 rounded-full transition-all duration-1000 bg-gradient-to-r ${
                              result.probability >= 0.8 ? 'from-red-500 to-red-600' :
                              result.probability >= 0.5 ? 'from-yellow-500 to-yellow-600' : 'from-green-500 to-green-600'
                            }`}
                            style={{ width: `${result.probability * 100}%` }}
                          />
                        </div>
                        <span className="text-xl font-bold text-slate-900 min-w-[4rem]">
                          {(result.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-center">
                        <Badge 
                          className={`${getRiskLevel(result.probability).bgColor} ${getRiskLevel(result.probability).textColor} border-0 px-4 py-2 text-sm font-semibold`}
                        >
                          {getRiskLevel(result.probability).level}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Classificação</Label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {result.prediction === 1 ? 'Fraudulenta' : 'Legítima'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="text-center py-12">
                <div className="p-6 bg-slate-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Aguardando Análise</h3>
                <p className="text-slate-600">Selecione um arquivo para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Formato do arquivo:</strong> O arquivo deve estar no formato .feather e conter 
          os campos obrigatórios: transaction_id, tx_datetime e demais campos necessários para o modelo.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SingleTransaction;
