
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, List, Activity, AlertTriangle } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-white to-softGray">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block p-3 rounded-full bg-primary/10 mb-6">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Real-time Threat Visibility & Log Intelligence
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Monitor, analyze, and respond to security events in real-time with Scanalyzer's
              powerful log analysis platform designed for modern security operations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link to="/logs">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/dashboard">View Dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="dashboard-card animate-slide-in" style={{animationDelay: '0.1s'}}>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <List className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Log Collection</h3>
              <p className="text-gray-600 mb-4">
                Collect and analyze security logs from across your environment with powerful filtering and search capabilities.
              </p>
              <Link to="/logs" className="text-primary font-medium hover:underline inline-flex items-center">
                Browse Logs <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="dashboard-card animate-slide-in" style={{animationDelay: '0.2s'}}>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Streaming</h3>
              <p className="text-gray-600 mb-4">
                Monitor logs as they happen with our real-time streaming interface. Never miss a critical security event.
              </p>
              <Link to="/streamer" className="text-primary font-medium hover:underline inline-flex items-center">
                Start Streaming <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="dashboard-card animate-slide-in" style={{animationDelay: '0.3s'}}>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Intelligent Alerts</h3>
              <p className="text-gray-600 mb-4">
                Leverage AI-powered classification to identify suspicious activities and potential threats in your logs.
              </p>
              <Link to="/alerts" className="text-primary font-medium hover:underline inline-flex items-center">
                View Alerts <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
