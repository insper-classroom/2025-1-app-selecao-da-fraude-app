import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService, LogEntry, LogsFilters } from '@/services/api';
import { Files, ChevronLeft, ChevronRight, Search, Filter, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const Logs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState<LogsFilters>({
    page: 1,
    page_size: 50
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pageInput, setPageInput] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await apiService.getLogs(filters);
      setLogs(response.logs);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
      setTotal(response.total);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const size = parseInt(newPageSize);
    setPageSize(size);
    setFilters(prev => ({ ...prev, page_size: size, page: 1 }));
  };

  const handleFilterChange = (key: keyof LogsFilters, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value || undefined,
      page: 1 
    }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, page_size: pageSize });
    setShowFilters(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getRiskBadge = (probability: number, isFraud: boolean) => {
    if (isFraud) {
      return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">Fraude</Badge>;
    }
    
    if (probability >= 0.8) {
      return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">Alto Risco</Badge>;
    } else if (probability >= 0.5) {
      return <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">Médio</Badge>;
    } else {
      return <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">Baixo</Badge>;
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push(-1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push(-1);
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page);
      setPageInput('');
    } else {
      toast.error(`Página deve estar entre 1 e ${totalPages}`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
          <BarChart3 className="w-4 h-4" />
          <span>Histórico de Análises</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Logs de Análise
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Acompanhe o histórico completo de todas as análises de fraude realizadas
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-2 hover:bg-blue-50 hover:border-blue-300"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
          <Button
            onClick={fetchLogs}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total de Análises', value: total.toLocaleString('pt-BR') },
          { title: 'Total de Páginas', value: totalPages.toLocaleString('pt-BR') },
          { title: 'Página Atual', value: currentPage.toString() },
          { title: 'Itens por Página', value: pageSize.toString() }
        ].map((stat, index) => (
          <Card key={index} className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm font-semibold">Data Inicial</Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="border-2 focus:border-blue-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm font-semibold">Data Final</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={filters.end_date || ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="border-2 focus:border-blue-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Itens por Página</Label>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="border-2 focus:border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={clearFilters} variant="outline" className="border-2">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Table */}
      <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg">
              <Files className="w-5 h-5 text-white" />
            </div>
            Registros de Análise
          </CardTitle>
          <CardDescription className="text-base">
            Mostrando {logs.length} de {total.toLocaleString('pt-BR')} registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">ID da Transação</TableHead>
                  <TableHead className="font-semibold">Probabilidade</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Data da Análise</TableHead>
                  <TableHead className="font-semibold">Data da Transação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="text-slate-500">
                        <Files className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-lg font-medium">Nenhum log encontrado</p>
                        <p>Tente ajustar os filtros ou verifique se há dados disponíveis</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-mono text-sm font-medium">{log.id}</TableCell>
                      <TableCell className="font-mono text-sm">{log.transaction_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium min-w-[3rem]">
                            {(log.probability * 100).toFixed(1)}%
                          </span>
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                log.probability >= 0.8 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                log.probability >= 0.5 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-green-500 to-green-600'
                              }`}
                              style={{ width: `${log.probability * 100}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRiskBadge(log.probability, log.is_fraud)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.is_batch ? "secondary" : "outline"} className="border-2">
                          {log.is_batch ? 'Lote' : 'Individual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(log.transaction_date)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                Página {currentPage} de {totalPages} 
                ({total.toLocaleString('pt-BR')} registros no total)
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="border-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {generatePageNumbers().map((page, index) => (
                    page === -1 ? (
                      <span key={index} className="px-2 text-slate-400">...</span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className={`w-10 border-2 ${currentPage === page ? 'bg-gradient-to-r from-blue-500 to-blue-600' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    )
                  ))}
                </div>

                <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Página"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    className="w-20 h-8 text-sm border-2"
                    min="1"
                    max={totalPages}
                  />
                  <Button type="submit" size="sm" variant="outline" className="border-2">
                    Ir
                  </Button>
                </form>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="border-2"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;
