
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Filter, Tags, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLogStream, updateLog } from '@/hooks/useLogs';
import { toast } from '@/components/ui/sonner';

const LogStreamerPage = () => {
  const { logs, isStreaming, startStreaming, stopStreaming, error } = useLogStream();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [showMarked, setShowMarked] = useState(false);
  const [markedLogs, setMarkedLogs] = useState<Record<string, boolean>>({});
  const [displayedLogs, setDisplayedLogs] = useState<any[]>([]);
  
  const streamEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Scroll to bottom when new logs arrive
  useEffect(() => {
    if (isStreaming) {
      streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedLogs, isStreaming]);
  
  // Handle streaming
  useEffect(() => {
    if (isStreaming) {
      const unsubscribe = startStreaming();
      unsubscribeRef.current = unsubscribe || null;
      
      toast.info('Stream started', {
        description: 'Real-time logs are now being displayed'
      });
    } else if (unsubscribeRef.current) {
      unsubscribeRef.current();
      stopStreaming();
    }
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isStreaming, startStreaming, stopStreaming]);

  // Filter logs when logs or filters change
  useEffect(() => {
    if (!Array.isArray(logs)) {
      setDisplayedLogs([]);
      return;
    }
    
    let filtered = [...logs];
    
    // Apply severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter(log => 
        log.level && log.level.toLowerCase() === severityFilter.toLowerCase()
      );
    }
    
    // Apply marked filter
    if (showMarked) {
      filtered = filtered.filter(log => markedLogs[log._id] || log.trigger);
    }
    
    setDisplayedLogs(filtered);
  }, [logs, severityFilter, showMarked, markedLogs]);
  
  // Toggle stream
  const toggleStream = () => {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  };
  
  // Stop stream
  const stopStream = () => {
    if (isStreaming) {
      stopStreaming();
      toast.info('Stream stopped');
    }
  };
  
  // Toggle marked status
  const toggleMarked = async (id: string, currentState: boolean) => {
    try {
      // Update the log in the backend
      await updateLog(id, { trigger: !currentState });
      
      // Update local state
      setMarkedLogs(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
      
      if (!currentState) {
        toast.success('Log marked successfully');
      }
    } catch (error) {
      toast.error('Failed to update log');
      console.error('Error updating log:', error);
    }
  };
  
  // Clear all logs
  const clearLogs = () => {
    setDisplayedLogs([]);
    toast.info('Logs cleared');
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Render level badge based on level
  const renderLevelBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'info':
        return <Badge className="bg-blue-500">Info</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Error</Badge>;
      case 'critical':
        return <Badge className="bg-red-700">Critical</Badge>;
      default:
        return <Badge>{level || 'Unknown'}</Badge>;
    }
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Error fetching logs', {
        description: error.message
      });
    }
  }, [error]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Log Streamer</h1>
        
        <div className="flex flex-wrap gap-2">
          {isStreaming ? (
            <>
              <Button 
                variant="outline" 
                className="flex items-center gap-1" 
                onClick={toggleStream}
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-1" 
                onClick={stopStream}
              >
                <Square className="h-4 w-4" />
                <span>Stop</span>
              </Button>
            </>
          ) : (
            <Button 
              className="flex items-center gap-1 bg-scanalyzer-severity-normal hover:bg-scanalyzer-severity-normal/90" 
              onClick={toggleStream}
            >
              <Play className="h-4 w-4" fill="white" />
              <span>Start Streaming</span>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="flex items-center gap-1" 
            onClick={clearLogs}
          >
            <span>Clear</span>
          </Button>
        </div>
      </div>
      
      <div className="p-4 border rounded-md bg-background shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="severity-filter">Filter by level:</Label>
          <Select 
            value={severityFilter} 
            onValueChange={(value) => setSeverityFilter(value)}
          >
            <SelectTrigger id="severity-filter" className="w-[140px]">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Tags className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="show-marked">Show only marked logs:</Label>
          <Switch 
            id="show-marked" 
            checked={showMarked}
            onCheckedChange={setShowMarked}
          />
        </div>
        
        <div className="ml-auto text-sm text-muted-foreground">
          {isStreaming ? (
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-scanalyzer-severity-normal animate-pulse-light mr-2"></span>
              Streaming live
            </span>
          ) : (
            <span>Stream inactive</span>
          )}
        </div>
      </div>
      
      {/* Stream counter */}
      <div className="text-sm text-muted-foreground flex justify-between">
        <div>
          Showing {displayedLogs.length} of {Array.isArray(logs) ? logs.length : 0} logs
        </div>
        <div>
          {Object.keys(markedLogs).filter(id => markedLogs[id]).length} logs marked
        </div>
      </div>
      
      {/* Log stream */}
      <div className="h-[60vh] overflow-y-auto border rounded-md bg-background shadow-sm p-1">
        {displayedLogs.length > 0 ? (
          <div className="space-y-1">
            {displayedLogs.map(log => (
              <div 
                key={log._id} 
                className={`p-3 border-l-4 rounded-r-md flex flex-col sm:flex-row sm:items-center gap-2 text-sm hover:bg-muted/30 ${
                  markedLogs[log._id] || log.trigger 
                    ? 'border-l-scanalyzer-purple-dark bg-scanalyzer-purple/5' 
                    : 'border-l-transparent'
                }`}
              >
                <div className="sm:w-36 font-mono text-xs text-muted-foreground">
                  {formatDate(log.timestamp)}
                </div>
                
                <div className="sm:w-28 flex items-center gap-1 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-scanalyzer-gray"></span>
                  {log.computer}
                </div>
                
                <div className="sm:w-20 text-xs font-mono">
                  {log.channel}
                </div>
                
                <div className="flex-1 truncate">
                  {log.msg && log.msg.join(' ')}
                </div>
                
                <div className="sm:w-28 flex flex-row sm:flex-col items-center gap-2">
                  {renderLevelBadge(log.level)}
                  
                  <Button
                    variant={(markedLogs[log._id] || log.trigger) ? "default" : "ghost"} 
                    size="sm"
                    className={
                      (markedLogs[log._id] || log.trigger) 
                        ? "h-7 text-xs sm:ml-auto" 
                        : "h-7 text-xs sm:ml-auto text-muted-foreground"
                    }
                    onClick={() => toggleMarked(log._id, markedLogs[log._id] || log.trigger)}
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    {(markedLogs[log._id] || log.trigger) ? 'Marked' : 'Mark'}
                  </Button>
                </div>
              </div>
            ))}
            <div ref={streamEndRef} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <p>No logs to display</p>
            {!isStreaming && (
              <Button 
                variant="link" 
                className="text-scanalyzer-purple"
                onClick={toggleStream}
              >
                Start streaming
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogStreamerPage;
