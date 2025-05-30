import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  active: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const navigate = useNavigate();

  return (
    <aside className="hidden md:block w-64 bg-white shadow-md">
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => navigate(item.path)}
                className={`flex items-center p-3 w-full text-base font-medium rounded-lg transition-colors duration-200 ${
                  item.active 
                    ? 'bg-ml-blue text-white' 
                    : 'text-ml-black hover:bg-ml-gray'
                }`}
              >
                <span className={`${item.active ? 'text-white' : 'text-ml-blue'}`}>
                  {item.icon}
                </span>
                <span className="ml-3">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;