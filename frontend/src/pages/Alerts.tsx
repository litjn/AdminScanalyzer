
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { LogEntry, RawLogEntry } from '@/types/logs';
import { transformLog } from '@/lib/logUtils';
import LogTable from '@/components/LogTable';
import { Button } from '@/components/ui/button';

const Alerts = () => {
  const [alertLogs, setAlertLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = () => {
    setIsLoading(true);
    api.get<RawLogEntry[]>('/logs')
      .then(response => {
        const logsData = Array.isArray(response.data) 
          ? response.data
              .map(transformLog)
              .filter(log => log.alert === true)
          : [];
        setAlertLogs(logsData);
        setError(null);
      })
      .catch(error => {
        console.error('Failed to fetch alerts:', error);
        setError(error);
        toast({
          title: "Error",
          description: "Failed to fetch alerts. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleUpdateLog = (id: string, data: Partial<LogEntry>) => {
    api.put(`/logs/${id}`, data)
      .then(() => {
        setAlertLogs(prev => prev.map(log => 
          log.id === id ? { ...log, ...data } : log
        ));
        toast({
          title: "Success",
          description: "Alert updated successfully.",
        });
      })
      .catch(error => {
        console.error('Failed to update alert:', error);
        toast({
          title: "Error",
          description: "Failed to update alert. Please try again.",
          variant: "destructive",
        });
      });
  };

  const clearAlert = (id: string) => {
    handleUpdateLog(id, { alert: false });
    // After updating, we should remove it from the alerts view
    setAlertLogs(prev => prev.filter(log => log.id !== id));
  };

  const handleSearch = (searchText: string) => {
    if (!searchText) {
      fetchAlerts(); // Reset to all alerts if search is cleared
      return;
    }
    
    setIsLoading(true);
    const lowerSearchText = searchText.toLowerCase();
    
    // Filter locally since we have already fetched the alerts
    const filtered = alertLogs.filter(log => {
      const messageText = Array.isArray(log.message) 
        ? log.message.join(' ').toLowerCase() 
        : String(log.message).toLowerCase();
      
      return messageText.includes(lowerSearchText) ||
             log.provider.toLowerCase().includes(lowerSearchText) ||
             log.channel.toLowerCase().includes(lowerSearchText) ||
             log.event_host.toLowerCase().includes(lowerSearchText);
    });
    
    setAlertLogs(filtered);
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Alerts</h1>
        <p className="text-gray-600">
          View and manage security alerts triggered by suspicious activities.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Active Alerts ({alertLogs.length})</h2>
          <Button onClick={fetchAlerts} size="sm">
            Refresh
          </Button>
        </div>
        
        {error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            Failed to load alerts. Please try again later.
          </div>
        ) : (
          <LogTable 
            logs={alertLogs} 
            isLoading={isLoading} 
            onUpdateLog={handleUpdateLog}
            showActions
            customActions={(log) => (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => clearAlert(log.id)}
              >
                Clear Alert
              </Button>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default Alerts;
