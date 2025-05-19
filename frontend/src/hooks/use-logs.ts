
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logsApi } from '@/lib/api';
import { LogEntry, LogFilter } from '@/types/logs';
import { filterLogs } from '@/lib/logUtils';

export const useLogs = (page: number, pageSize: number, activeFilters: LogFilter) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      
      // Extract API-compatible filters from activeFilters object
      const apiFilters: Record<string, any> = {};
      
      // Only include filters that the API supports
      if (activeFilters.channel && activeFilters.channel !== 'all') {
        apiFilters.channel = activeFilters.channel;
      }
      
      if (activeFilters.level && activeFilters.level !== 'all') {
        apiFilters.level = activeFilters.level;
      }
      
      if (activeFilters.agent_id) {
        apiFilters.agent_id = activeFilters.agent_id;
      }
      
      // Convert date filter to API format if needed
      if (activeFilters.date) {
        const dateStr = activeFilters.date.toISOString().split('T')[0];
        apiFilters.date = dateStr;
      }
      
      try {
        // Use the logsApi methods to fetch logs with filters
        const response = await logsApi.getLogs(page, pageSize, apiFilters);
        
        // Handle both array response and paginated response format
        if (Array.isArray(response.data)) {
          const logsData = response.data.map(log => ({
            ...log,
            id: log.id || log._id || `log-${log.record_id || Math.random().toString(36).substring(2)}` // Ensure each log has a unique ID
          }));
          setLogs(logsData);
          setFilteredLogs(logsData);
          setTotal(logsData.length);
          setHasMore(logsData.length === pageSize);
        } else if (response.data && response.data.data) {
          const logsData = response.data.data.map(log => ({
            ...log,
            id: log.id || log._id || `log-${log.record_id || Math.random().toString(36).substring(2)}` // Ensure each log has a unique ID
          }));
          setLogs(logsData);
          setFilteredLogs(logsData);
          setTotal(response.data.total || logsData.length);
          setHasMore(logsData.length === pageSize);
        }
        setError(null);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        setError(error instanceof Error ? error : new Error('Failed to fetch logs'));
        toast({
          title: "Error",
          description: "Failed to fetch logs. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [page, pageSize, activeFilters, toast]);

  // Apply client-side filters (for fields not supported by API)
  useEffect(() => {
    const filtered = filterLogs(logs, activeFilters);
    setFilteredLogs(filtered);
  }, [logs, activeFilters]);

  const updateLog = async (id: string, data: Partial<LogEntry>) => {
    if (!id || id === 'undefined') {
      toast({
        title: "Error",
        description: "Cannot update log: invalid log ID",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await logsApi.updateLog(id, data);
      
      // Update logs in state
      const updatedLogs = logs.map(log => 
        log.id === id ? { ...log, ...data } : log
      );
      setLogs(updatedLogs);
      setFilteredLogs(prev => prev.map(log => 
        log.id === id ? { ...log, ...data } : log
      ));
      
      toast({
        title: "Success",
        description: "Log updated successfully.",
      });
    } catch (error) {
      console.error('Failed to update log:', error);
      toast({
        title: "Error",
        description: "Failed to update log. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    logs,
    filteredLogs,
    isLoading,
    error,
    total,
    hasMore,
    updateLog,
  };
};
