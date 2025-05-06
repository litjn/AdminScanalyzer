
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BarChart, BookOpen, AlertTriangle, Zap, Home, Database } from 'lucide-react';
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Log Collection', href: '/logs', icon: Database },
    { name: 'Log Streamer', href: '/streamer', icon: BookOpen },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart },
    { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
    { name: 'Triggers', href: '/triggers', icon: Zap },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Global">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold">S</div>
              <span className="text-xl font-semibold text-gray-900">Scanalyzer</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-colors flex items-center space-x-1",
                  location.pathname === item.href
                    ? "text-primary"
                    : "text-gray-600 hover:text-primary"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-primary focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white pb-3 px-2 pt-2 shadow-lg">
          <div className="space-y-1 px-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "block rounded-md py-2 px-3 text-base font-medium flex items-center space-x-2",
                  location.pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-primary/5 hover:text-primary"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;
