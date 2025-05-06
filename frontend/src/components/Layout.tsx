
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Database, 
  Play, 
  BarChart3, 
  Bell, 
  Menu,
  X
} from 'lucide-react';

type NavItemProps = {
  to: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
};

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, onClick }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 rounded-md transition-all
        ${isActive 
          ? 'bg-scanalyzer-purple-dark text-white' 
          : 'text-white/80 hover:bg-scanalyzer-purple-dark/50 hover:text-white'}
      `}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
};

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-scanalyzer-gray-light">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-scanalyzer-purple transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0
        `}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-white flex items-center justify-center">
              <span className="text-scanalyzer-purple font-bold text-xl">S</span>
            </div>
            <h1 className="text-white font-heading font-bold text-xl">Scanalyzer</h1>
          </div>
          <button 
            className="text-white lg:hidden" 
            onClick={closeSidebar}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="mt-8 px-2 space-y-1">
          <NavItem to="/" icon={Home} label="Home" onClick={closeSidebar} />
          <NavItem to="/logs" icon={Database} label="Log Collection" onClick={closeSidebar} />
          <NavItem to="/streamer" icon={Play} label="Log Streamer" onClick={closeSidebar} />
          <NavItem to="/dashboard" icon={BarChart3} label="Dashboard" onClick={closeSidebar} />
          <NavItem to="/alerts" icon={Bell} label="Alerts" onClick={closeSidebar} />
        </nav>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button 
            className="text-scanalyzer-black lg:hidden" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="font-medium text-scanalyzer-black lg:hidden">
            Scanalyzer
          </div>
          <div className="flex items-center space-x-4">
            {/* Add user profile or other header items here */}
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
