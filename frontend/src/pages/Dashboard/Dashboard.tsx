import React from 'react';
import { ShieldAlert, Upload, UploadCloud, ClipboardList, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageTitle from '../../components/UI/PageTitle';
import Card from '../../components/UI/Card';

const Dashboard: React.FC = () => {
  const features = [
    {
      title: 'Predição Individual',
      description: 'Faça upload de arquivos para analisar uma transação específica.',
      icon: <Upload size={36} className="text-ml-blue" />,
      path: '/single-prediction',
      color: 'bg-blue-50'
    },
    {
      title: 'Predição em Lote',
      description: 'Processe várias transações de uma só vez para análise em massa.',
      icon: <UploadCloud size={36} className="text-ml-blue" />,
      path: '/batch-prediction',
      color: 'bg-purple-50'
    },
    {
      title: 'Visualizador de Logs',
      description: 'Visualize e filtre o histórico de predições realizadas.',
      icon: <ClipboardList size={36} className="text-ml-blue" />,
      path: '/logs',
      color: 'bg-green-50'
    }
  ];

  return (
    <div>
      <PageTitle 
        title="Sistema de Detecção de Fraude" 
        subtitle="Bem-vindo ao sistema de detecção de fraude do Mercado Livre. Utilize as ferramentas abaixo para analisar transações e identificar possíveis fraudes."
        icon={<ShieldAlert size={28} />}
      />
      
      <div className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link 
              key={index}
              to={feature.path}
              className="block transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ml-blue focus:ring-opacity-50 rounded-lg"
            >
              <Card className="h-full">
                <div className="flex flex-col h-full">
                  <div className={`p-4 rounded-lg w-16 h-16 flex items-center justify-center mb-4 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-ml-black mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4 flex-grow">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-ml-blue font-medium">
                    <span>Acessar</span>
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="mt-10">
        <Card>
          <h2 className="text-xl font-semibold text-ml-black mb-4">
            Sobre o Sistema de Detecção de Fraude
          </h2>
          <p className="text-gray-600 mb-4">
            O Sistema de Detecção de Fraude do Mercado Livre utiliza algoritmos avançados de machine learning para identificar 
            padrões suspeitos em transações. Nosso sistema analisa diversos fatores para determinar a probabilidade de uma 
            transação ser fraudulenta.
          </p>
          <p className="text-gray-600">
            Para começar, selecione uma das opções acima. Você pode analisar transações individuais, processar lotes de 
            transações ou visualizar o histórico de análises anteriores.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;