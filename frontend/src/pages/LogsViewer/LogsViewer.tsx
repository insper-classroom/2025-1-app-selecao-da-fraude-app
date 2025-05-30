import React, { useState, useEffect } from 'react';
import { ClipboardList, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import PageTitle from '../../components/UI/PageTitle';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import DateRangePicker from '../../components/Logs/DateRangePicker';
import LogsTable, { LogEntry } from '../../components/Logs/LogsTable';
import { getLogs } from '../../services/apiService';

const LogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit, setLimit] = useState<number>(100);
  
  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getLogs({
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        limit,
        page: currentPage
      });
      
      setLogs(response.logs);
      setTotalPages(response.totalPages);
      
      if (response.logs.length === 0) {
        toast.info('Nenhum log encontrado para o período selecionado.');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Ocorreu um erro ao buscar os logs. Por favor, tente novamente.');
      toast.error('Erro ao carregar logs');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLogs();
  }, [currentPage, limit]);
  
  const handleDateChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };
  
  const handleApplyFilter = () => {
    setCurrentPage(1);
    fetchLogs();
  };
  
  const handleResetFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
    fetchLogs();
  };
  
  const handleExport = () => {
    toast.info('Exportando logs...');
    
    // In a real implementation, this would trigger an export
    // For demo purposes, we'll just show a toast
    setTimeout(() => {
      toast.success('Logs exportados com sucesso!');
    }, 1500);
  };
  
  const handleRefresh = () => {
    fetchLogs();
    toast.info('Atualizando logs...');
  };
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <Link to="/" className="text-ml-blue hover:text-ml-dark-blue mr-4">
          <ArrowLeft size={20} />
        </Link>
        <PageTitle 
          title="Visualizador de Logs" 
          subtitle="Visualize e filtre o histórico de predições realizadas."
          icon={<ClipboardList size={24} />}
        />
      </div>
      
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-lg font-semibold text-ml-black mb-2 md:mb-0">
            Filtros
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            icon={<RefreshCw size={16} />}
          >
            Atualizar
          </Button>
        </div>
        
        <DateRangePicker 
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
          onApply={handleApplyFilter}
          onReset={handleResetFilter}
        />
      </Card>
      
      <Card>
        <h2 className="text-lg font-semibold text-ml-black mb-4">
          Histórico de Predições
        </h2>
        
        <LogsTable 
          logs={logs} 
          isLoading={isLoading} 
          onExport={handleExport}
        />
        
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoading}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || isLoading}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LogsViewer;