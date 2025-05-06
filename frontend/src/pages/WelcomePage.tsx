
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, BarChart3, Clock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WelcomePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      {/* Hero Section */}
      <section className="w-full px-4 py-12 sm:py-20 flex flex-col items-center text-center">
        <div className="mb-6 h-16 w-16 rounded-xl gradient-purple flex items-center justify-center">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-scanalyzer-black">
          Scanalyzer
        </h1>
        <p className="text-xl md:text-2xl text-scanalyzer-black/80 mb-8 max-w-2xl">
          Real-time Threat Visibility & Log Intelligence
        </p>
        <Button 
          className="text-lg px-8 py-6 rounded-md bg-scanalyzer-purple hover:bg-scanalyzer-purple-dark"
          size="lg"
          onClick={() => navigate('/dashboard')}
        >
          Get Started
        </Button>
      </section>

      {/* Features Section */}
      <section className="w-full px-4 py-12 bg-scanalyzer-gray-light">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-scanalyzer-black">
            Powerful Monitoring & Analysis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm card-hover">
              <div className="h-12 w-12 rounded-lg bg-scanalyzer-purple/10 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-scanalyzer-purple" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Streaming</h3>
              <p className="text-scanalyzer-gray">
                Monitor logs as they occur with instant visibility into potential threats
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm card-hover">
              <div className="h-12 w-12 rounded-lg bg-scanalyzer-purple/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-scanalyzer-purple" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-scanalyzer-gray">
                Gain insights through comprehensive dashboards and visual metrics
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm card-hover">
              <div className="h-12 w-12 rounded-lg bg-scanalyzer-purple/10 flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-scanalyzer-purple" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Classification</h3>
              <p className="text-scanalyzer-gray">
                AI-powered log classification to identify anomalies and critical events
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="w-full px-4 py-16 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Ready to enhance your security monitoring?
        </h2>
        <Button 
          className="rounded-md bg-scanalyzer-purple hover:bg-scanalyzer-purple-dark"
          onClick={() => navigate('/dashboard')}
        >
          Get Started
        </Button>
      </section>
    </div>
  );
};

export default WelcomePage;
