import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ type, title, message, className = '' }) => {
  const icons = {
    success: <CheckCircle size={20} className="text-ml-success" />,
    error: <XCircle size={20} className="text-ml-error" />,
    warning: <AlertCircle size={20} className="text-ml-warning" />,
    info: <Info size={20} className="text-ml-blue" />,
  };

  const styles = {
    success: 'bg-green-50 border-ml-success',
    error: 'bg-red-50 border-ml-error',
    warning: 'bg-yellow-50 border-ml-warning',
    info: 'bg-blue-50 border-ml-blue',
  };

  return (
    <div className={`rounded-md border-l-4 p-4 ${styles[type]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0 mr-3">
          {icons[type]}
        </div>
        <div>
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className="text-sm">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;