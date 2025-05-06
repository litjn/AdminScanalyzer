import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { LogEntry, RawLogEntry } from '@/types/logs';
import { transformLog } from '@/lib/logUtils';
import LogTable from '@/components/LogTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, ZapOff, AlertTriangle } from 'lucide-react';

const Triggers = () => {
  const [triggerLogs, setTriggerLogs] = useState<LogEntry[]>([]);
  const [filteredTriggers, setFilteredTriggers] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTriggerLogs();
  }, []);

  useEffect(() => {
    filterTriggers();
  }, [searchQuery, triggerLogs]);

  const fetchTriggerLogs = () => {
    setIsLoading(true);
    api.get<RawLogEntry[]>('/logs')
      .then(response => {
        const logsData = Array.isArray(response.data) 
          ? response.data.map(transformLog).filter(log => log.trigger) 
          : [];
        setTriggerLogs(logsData);
        setFilteredTriggers(logsData);
      })
      .catch(error => {
        console.error('Failed to fetch trigger logs:', error);
        toast({
          title: "Error",
          description: "Failed to load triggers. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const filterTriggers = () => {
    if (!searchQuery.trim()) {
      setFilteredTriggers(triggerLogs);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = triggerLogs.filter(log => {
      const messageText = log.message.join(' ').toLowerCase();
      return messageText.includes(query) || 
             log.provider.toLowerCase().includes(query) ||
             log.channel.toLowerCase().includes(query) ||
             log.event_host.toLowerCase().includes(query);
    });
    
    setFilteredTriggers(filtered);
  };

  const handleUpdateLog = (id: string, data: Partial<LogEntry>) => {
    api.put(`/logs/${id}`, data)
      .then(() => {
        if (data.trigger === false) {
          // If trigger is being turned off, remove from the list
          setTriggerLogs(prev => prev.filter(log => log.id !== id));
          setFilteredTriggers(prev => prev.filter(log => log.id !== id));
          toast({
            title: "Trigger Removed",
            description: "The log has been removed from triggers.",
          });
        } else {
          // Otherwise update the log in place
          setTriggerLogs(prev => prev.map(log => 
            log.id === id ? { ...log, ...data } : log
          ));
          setFilteredTriggers(prev => prev.map(log => 
            log.id === id ? { ...log, ...data } : log
          ));
          toast({
            title: "Trigger Updated",
            description: "The trigger has been updated successfully.",
          });
        }
      })
      .catch(error => {
        console.error('Failed to update trigger log:', error);
        toast({
          title: "Error",
          description: "Failed to update the trigger. Please try again.",
          variant: "destructive",
        });
      });
  };

  const handleRemoveAllTriggers = () => {
    if (!filteredTriggers.length || !window.confirm('Are you sure you want to remove all displayed triggers?')) {
      return;
    }
    
    const updatePromises = filteredTriggers.map(log => 
      api.put(`/logs/${log.id}`, { trigger: false })
    );
    
    Promise.all(updatePromises)
      .then(() => {
        const removedIds = new Set(filteredTriggers.map(log => log.id));
        setTriggerLogs(prev => prev.filter(log => !removedIds.has(log.id)));
        setFilteredTriggers([]);
        toast({
          title: "All Triggers Removed",
          description: `${filteredTriggers.length} logs have been removed from triggers.`,
        });
      })
      .catch(error => {
        console.error('Failed to remove all triggers:', error);
        toast({
          title: "Error",
          description: "Failed to remove all triggers. Some may have been updated.",
          variant: "destructive",
        });
        fetchTriggerLogs();
      });
  };

  const handleMarkAllAsAlerts = () => {
    if (!filteredTriggers.length || !window.confirm('Are you sure you want to mark all displayed triggers as alerts?')) {
      return;
    }
    
    const updatePromises = filteredTriggers.map(log => 
      api.put(`/logs/${log.id}`, { alert: true })
    );
    
    Promise.all(updatePromises)
      .then(() => {
        setTriggerLogs(prev => prev.map(log => 
          filteredTriggers.some(filtered => filtered.id === log.id)
            ? { ...log, alert: true }
            : log
        ));
        setFilteredTriggers(prev => prev.map(log => ({ ...log, alert: true })));
        toast({
          title: "Alerts Created",
          description: `${filteredTriggers.length} triggers have been marked as alerts.`,
        });
      })
      .catch(error => {
        console.error('Failed to mark triggers as alerts:', error);
        toast({
          title: "Error",
          description: "Failed to create alerts from triggers. Some may have been updated.",
          variant: "destructive",
        });
        fetchTriggerLogs();
      });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Log Triggers</h1>
        <p className="text-gray-600">
          Manage logs that have been marked as triggers and convert them to alerts.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What are Triggers?</CardTitle>
          <CardDescription>
            Triggers are logs that have been identified for further analysis or alert generation.
            Use this page to review and manage triggered logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              className="flex-1" 
              variant="default" 
              onClick={handleMarkAllAsAlerts}
              disabled={filteredTriggers.length === 0}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Mark All as Alerts
            </Button>
            <Button 
              className="flex-1" 
              variant="outline" 
              onClick={handleRemoveAllTriggers}
              disabled={filteredTriggers.length === 0}
            >
              <ZapOff className="mr-2 h-4 w-4" />
              Remove All Triggers
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <div className="relative">
          <Input
            placeholder="Search triggers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium flex items-center">
            <Zap className="text-purple-500 mr-2 h-5 w-5" />
            Triggered Logs ({filteredTriggers.length})
          </h2>
          <p className="text-sm text-gray-500">
            Logs that have been marked for analysis or alert generation
          </p>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <p>Loading triggers...</p>
          </div>
        ) : triggerLogs.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-xl font-medium mb-2">No Active Triggers</h3>
            <p className="text-gray-500 mb-4">There are currently no log entries marked as triggers.</p>
            <Button asChild>
              <Link to="/logs">Browse All Logs</Link>
            </Button>
          </div>
        ) : filteredTriggers.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No Matching Triggers</h3>
            <p className="text-gray-500">No triggers match your search criteria.</p>
          </div>
        ) : (
          <LogTable 
            logs={filteredTriggers} 
            onUpdateLog={handleUpdateLog}
          />
        )}
      </div>
    </div>
  );
};

export default Triggers;
