import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Upload, UploadCloud, ClipboardList, Home } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { 
      icon: <Home size={20} />, 
      label: 'Dashboard', 
      path: '/',
      active: location.pathname === '/'
    },
    { 
      icon: <Upload size={20} />, 
      label: 'Predição Individual', 
      path: '/single-prediction',
      active: location.pathname === '/single-prediction'
    },
    { 
      icon: <UploadCloud size={20} />, 
      label: 'Predição em Lote', 
      path: '/batch-prediction',
      active: location.pathname === '/batch-prediction'
    },
    { 
      icon: <ClipboardList size={20} />, 
      label: 'Logs', 
      path: '/logs',
      active: location.pathname === '/logs'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-ml-light-gray">
      <Header />
      <div className="flex flex-1">
        <Sidebar items={navigationItems} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <footer className="bg-white py-4 px-6 border-t border-gray-200 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} Mercado Livre - Sistema de Detecção de Fraude
      </footer>
    </div>
  );
};

export default Layout;