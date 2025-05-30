import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Menu, X } from 'lucide-react';
import MLLogo from '../UI/MLLogo';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="bg-ml-yellow shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <MLLogo className="h-8 w-auto" />
              <div className="ml-3 hidden md:block">
                <h1 className="text-lg font-semibold text-ml-black">
                  Sistema de Detecção de Fraude
                </h1>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-4">
              <ShieldAlert size={20} className="text-ml-blue" />
              <span className="text-ml-black font-medium">
                Proteção Anti-Fraude
              </span>
            </div>
          </div>
          
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-ml-black hover:bg-ml-gray focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ml-blue"
            >
              <span className="sr-only">Abrir menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white">
          <div className="pt-2 pb-3 space-y-1">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-ml-black hover:bg-ml-gray"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/single-prediction" 
              className="block px-3 py-2 rounded-md text-base font-medium text-ml-black hover:bg-ml-gray"
              onClick={() => setMobileMenuOpen(false)}
            >
              Predição Individual
            </Link>
            <Link 
              to="/batch-prediction" 
              className="block px-3 py-2 rounded-md text-base font-medium text-ml-black hover:bg-ml-gray"
              onClick={() => setMobileMenuOpen(false)}
            >
              Predição em Lote
            </Link>
            <Link 
              to="/logs" 
              className="block px-3 py-2 rounded-md text-base font-medium text-ml-black hover:bg-ml-gray"
              onClick={() => setMobileMenuOpen(false)}
            >
              Logs
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;