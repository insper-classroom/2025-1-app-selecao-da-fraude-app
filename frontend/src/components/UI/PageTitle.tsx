import React from 'react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, icon }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center">
        {icon && <div className="mr-3 text-ml-blue">{icon}</div>}
        <h1 className="text-2xl font-bold text-ml-black">{title}</h1>
      </div>
      {subtitle && (
        <p className="mt-2 text-gray-600">{subtitle}</p>
      )}
      <div className="mt-4 h-1 w-20 bg-ml-yellow rounded-full"></div>
    </div>
  );
};

export default PageTitle;