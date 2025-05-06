
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { RawLogEntry, LogEntry, LogFilter as LogFilterType } from '@/types/logs';
import { transformLog, filterLogs } from '@/lib/logUtils';
import LogTable from '@/components/LogTable';
import LogFilter from '@/components/LogFilter';

const LogCollection = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    setIsLoading(true);
    api.get<RawLogEntry[]>('/logs')
      .then(response => {
        const logsData = Array.isArray(response.data) 
          ? response.data.map(transformLog)
          : [];
        setLogs(logsData);
        setFilteredLogs(logsData);
        setError(null);
      })
      .catch(error => {
        console.error('Failed to fetch logs:', error);
        setError(error);
        toast({
          title: "Error",
          description: "Failed to fetch logs. Please try again.",
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
        setLogs(prev => prev.map(log => 
          log.id === id ? { ...log, ...data } : log
        ));
        setFilteredLogs(prev => prev.map(log => 
          log.id === id ? { ...log, ...data } : log
        ));
        toast({
          title: "Success",
          description: "Log updated successfully.",
        });
      })
      .catch(error => {
        console.error('Failed to update log:', error);
        toast({
          title: "Error",
          description: "Failed to update log. Please try again.",
          variant: "destructive",
        });
      });
  };

  const handleFilterChange = (filters: LogFilterType) => {
    const filtered = filterLogs(logs, filters);
    setFilteredLogs(filtered);
  };

  const handleExport = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "ID,Timestamp,Level,Channel,Event ID,Provider,Message,Alert,Trigger,Classification\n";
    
    // Add log data
    filteredLogs.forEach(log => {
      const row = [
        log.id,
        log.timestamp.toISOString(),
        log.level,
        log.channel,
        log.event_id,
        log.provider,
        `"${log.message.join(' ').replace(/"/g, '""')}"`,
        log.alert ? 'Yes' : 'No',
        log.trigger ? 'Yes' : 'No',
        log.ai_classification || 'Unclassified'
      ];
      csvContent += row.join(',') + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `scanalyzer_logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    
    // Download CSV file
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: `${filteredLogs.length} logs exported to CSV.`
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Log Collection</h1>
        <p className="text-gray-600">
          Browse, filter, and analyze security logs from across your environment.
        </p>
      </div>
      
      <LogFilter 
        onFilterChange={handleFilterChange} 
        onExport={handleExport} 
        className="mb-6" 
      />
      
      {error ? (
        <div className="p-4 bg-red-50 text-red-800 rounded-md">
          Failed to load logs. Please try again later.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium">Logs ({filteredLogs.length})</h2>
          </div>
          <LogTable 
            logs={filteredLogs} 
            isLoading={isLoading} 
            onUpdateLog={handleUpdateLog}
          />
        </div>
      )}
    </div>
  );
};

export default LogCollection;
