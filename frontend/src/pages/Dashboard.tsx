
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { apiService } from '@/services/api';
import { Activity, Shield, TrendingUp, AlertCircle, Zap, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Stats {
  total_transactions: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      title: 'Análise Individual',
      description: 'Analise uma transação específica com precisão máxima',
      icon: Shield,
      color: 'from-blue-500 to-blue-600',
      href: '/single-transaction'
    },
    {
      title: 'Análise em Lote',
      description: 'Processe milhares de transações simultaneamente',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      href: '/batch-transactions'
    },
    {
      title: 'Logs Detalhados',
      description: 'Acompanhe todo o histórico com filtros avançados',
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600',
      href: '/logs'
    }
  ];

  const stats_items = [
    {
      title: 'Transações Analisadas',
      value: loading ? null : stats?.total_transactions.toLocaleString('pt-BR') || '0',
      icon: Activity,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Disponibilidade',
      value: '99.9%',
      icon: Zap,
      color: 'from-yellow-500 to-yellow-600'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 bg-meli-yellow/20 text-meli-blue px-4 py-2 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4" />
            <span>Sistema de Análise de Fraudes</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            Proteja seu negócio com
            <span className="block bg-gradient-to-r from-meli-blue to-blue-600 bg-clip-text text-transparent">
              inteligência artificial
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Detecte fraudes usando nossa tecnologia avançada 
            de machine learning, desenvolvida especificamente para o Mercado Livre.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats_items.map((item, index) => (
          <Card key={index} className="relative overflow-hidden border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{item.title}</p>
                  <div className="text-2xl font-bold text-slate-900">
                    {item.title === 'Transações Analisadas' && loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      item.value
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${item.color} shadow-lg`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="group relative overflow-hidden border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="space-y-4 flex-1">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
              <Link to={feature.href} className="mt-4">
                <Button className="w-full bg-gradient-to-r from-meli-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
                  Começar Agora
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* About Section */}
      <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-slate-900">Sobre o Seleção da Fraude</CardTitle>
          <CardDescription className="text-lg text-slate-600">
            Tecnologia de ponta para proteção completa contra fraudes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <p className="text-slate-700 leading-relaxed text-center max-w-4xl mx-auto">
            Nosso sistema utiliza algoritmos de machine learning de última geração para identificar 
            padrões suspeitos em transações do Mercado Livre. Com uma precisão excepcional de 98%, 
            oferecemos proteção robusta e confiável contra atividades fraudulentas.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-900 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-meli-blue" />
                Características Principais
              </h4>
              <div className="space-y-3">
                {[
                  'Análise em tempo real',
                  'Processamento em lote',
                  'Logs detalhados e filtráveis',
                  'Alta escalabilidade'
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-900 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-meli-blue" />
                Tecnologias Utilizadas
              </h4>
              <div className="space-y-3">
                {[
                  'Machine Learning Avançado',
                  'Análise de Padrões em Tempo Real',
                  'Processamento Assíncrono',
                  'API RESTful Robusta'
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
