import React from 'react';

interface CardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, className = '', children }) => {
  return (
    <div className={`bg-white rounded-lg shadow-ml overflow-hidden ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-ml-black">{title}</h2>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;