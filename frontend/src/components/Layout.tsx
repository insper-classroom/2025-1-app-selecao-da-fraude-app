
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Upload, 
  Files,
  Menu,
  X,
  Shield
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Enviar Transação',
      href: '/single-transaction',
      icon: Upload,
    },
    {
      name: 'Enviar Múltiplas',
      href: '/batch-transactions',
      icon: Files,
    },
    {
      name: 'Logs',
      href: '/logs',
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-meli-yellow to-yellow-400 p-2 rounded-xl shadow-lg">
                  <Shield className="w-8 h-8 text-meli-blue" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-meli-blue to-blue-600 bg-clip-text text-transparent">
                    Seleção da Fraude
                  </h1>
                  <p className="text-sm text-slate-600 font-medium">Mercado Livre</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    location.pathname === item.href
                      ? 'bg-meli-blue text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-600 hover:text-meli-blue hover:bg-white/70 hover:shadow-md'
                  )}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/50 bg-white/95 backdrop-blur-sm">
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200',
                    location.pathname === item.href
                      ? 'bg-meli-blue text-white shadow-lg'
                      : 'text-slate-600 hover:text-meli-blue hover:bg-slate-50'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200/50 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="w-5 h-5 text-meli-blue" />
              <span className="text-lg font-semibold text-slate-800">Seleção da Fraude</span>
            </div>
            <p className="text-slate-600 text-sm">
              © 2024 Mercado Livre - Sistema de Análise de Fraudes
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
