
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import LogTable from '@/components/LogTable';
import LogFilter from '@/components/LogFilter';
import { RawLogEntry, LogEntry, LogFilter as LogFilterType } from '@/types/logs';
import { transformLog, filterLogs } from '@/lib/logUtils';
import api from '@/lib/api';
import { Play, Pause, StopCircle } from 'lucide-react';

// Simulated streaming for now - would connect to a real streaming endpoint in production
const LogStreamer = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [streamedLogs, setStreamedLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState<LogFilterType>({});
  const { toast } = useToast();
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastIdRef = useRef<string | null>(null);

  // Simulated polling mechanism - would use WebSockets in production
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setFilteredLogs(filterLogs(streamedLogs, filters));
  }, [streamedLogs, filters]);

  const startStreaming = () => {
    if (isStreaming && !isPaused) return;
    
    if (isPaused) {
      setIsPaused(false);
      return;
    }
    
    setIsStreaming(true);
    setIsPaused(false);
    
    // Simulated streaming - in production this would connect to a WebSocket or SSE
    toast({
      title: "Streaming Started",
      description: "Log streaming has been initiated",
    });
    
    // For demo, we'll poll the API every 3 seconds
    fetchInitialLogs();
    pollingRef.current = setInterval(fetchNewLogs, 3000);
  };

  const pauseStreaming = () => {
    setIsPaused(true);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    toast({
      title: "Streaming Paused",
      description: "Log streaming has been paused",
    });
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    setIsPaused(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setStreamedLogs([]);
    lastIdRef.current = null;
    toast({
      title: "Streaming Stopped",
      description: "Log streaming has been terminated",
    });
  };

  const fetchInitialLogs = () => {
    api.get<RawLogEntry[]>('/logs')
      .then(response => {
        const logsData = Array.isArray(response.data) 
          ? response.data.map(transformLog).slice(0, 20) 
          : [];
          
        // Sort by timestamp, newest first
        logsData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        setStreamedLogs(logsData);
        
        // Store the newest log id for subsequent fetches
        if (logsData.length > 0) {
          lastIdRef.current = logsData[0].id;
        }
      })
      .catch(error => {
        console.error('Failed to fetch initial logs:', error);
        toast({
          title: "Error",
          description: "Failed to start log streaming. Please try again.",
          variant: "destructive",
        });
        stopStreaming();
      });
  };

  // In a real app, this would be implemented with server-side logic to get only new logs
  const fetchNewLogs = () => {
    // Simulate getting only newer logs than lastIdRef
    api.get<RawLogEntry[]>('/logs')
      .then(response => {
        if (!Array.isArray(response.data)) return;
        
        // In a real implementation, the backend would handle this filtering
        // For the demo, we'll simulate new logs appearing
        const allLogs = response.data.map(transformLog);
        
        // Randomly select 1-3 logs and prepend them to our state as "new" logs
        const randomCount = Math.floor(Math.random() * 3) + 1;
        const newLogs = allLogs.slice(0, randomCount).map(log => ({
          ...log,
          timestamp: new Date(), // Update timestamp to now to simulate new logs
          id: `log-${Date.now()}-${Math.random()}`  // Ensure unique ID
        }));
        
        if (newLogs.length > 0) {
          setStreamedLogs(prev => [...newLogs, ...prev]);
          // Store the newest log id
          lastIdRef.current = newLogs[0].id;
        }
      })
      .catch(error => {
        console.error('Failed to fetch new logs:', error);
        // Don't stop streaming on temporary errors
      });
  };

  const handleUpdateLog = (id: string, data: Partial<LogEntry>) => {
    api.put(`/logs/${id}`, data)
      .then(() => {
        setStreamedLogs(prev => prev.map(log => 
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

  const handleFilterChange = (newFilters: LogFilterType) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Log Streamer</h1>
        <p className="text-gray-600">
          Monitor logs in real-time as they are generated across your environment.
        </p>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Button 
              size="lg"
              disabled={isStreaming && !isPaused} 
              onClick={startStreaming}
              className="bg-primary"
            >
              <Play className="mr-2 h-5 w-5" />
              {isPaused ? "Resume" : "Start"} Streaming
            </Button>
            
            <Button 
              size="lg"
              variant="outline" 
              disabled={!isStreaming || isPaused} 
              onClick={pauseStreaming}
            >
              <Pause className="mr-2 h-5 w-5" />
              Pause
            </Button>
            
            <Button 
              size="lg"
              variant="outline" 
              disabled={!isStreaming} 
              onClick={stopStreaming}
            >
              <StopCircle className="mr-2 h-5 w-5" />
              Stop
            </Button>
          </div>

          <div className="text-right">
            {isStreaming ? (
              <div>
                <div className="text-sm font-medium">Status: 
                  <span className={isPaused ? "text-yellow-600" : "text-green-600"}>
                    {isPaused ? " Paused" : " Active"}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Logs received: {streamedLogs.length}
                </div>
              </div>
            ) : (
              <div className="text-sm font-medium">Status: <span className="text-gray-600">Inactive</span></div>
            )}
          </div>
        </div>
      </div>
      
      <LogFilter 
        onFilterChange={handleFilterChange} 
        className="mb-6" 
      />
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Real-time Log Stream</h2>
          <span className="text-sm text-gray-500">
            Showing {filteredLogs.length} of {streamedLogs.length} logs
          </span>
        </div>
        
        {!isStreaming ? (
          <div className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-600 mb-2">Streaming is not active</h3>
            <p className="text-gray-500 mb-6">Click the Start button above to begin streaming logs in real-time.</p>
            <Button onClick={startStreaming} className="bg-primary">
              <Play className="mr-2 h-4 w-4" />
              Start Streaming
            </Button>
          </div>
        ) : (
          <LogTable 
            logs={filteredLogs} 
            onUpdateLog={handleUpdateLog}
          />
        )}
      </div>
    </div>
  );
};

export default LogStreamer;
