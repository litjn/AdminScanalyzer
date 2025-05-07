
import { useState } from 'react';
import { LogEntry } from '@/types/logs';
import { useNavigate } from 'react-router-dom';
import { formatDate, truncateMessage, classificationColor, levelColor } from '@/lib/logUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Bell, Zap, Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

interface LogTableProps {
  logs: LogEntry[];
  isLoading?: boolean;
  onUpdateLog?: (id: string, data: Partial<LogEntry>) => void;
  onSelectLog?: (log: LogEntry | null) => void;
  selectedLogId?: string | null;
  showActions?: boolean;
  customActions?: (log: LogEntry) => React.ReactNode;
}

const LogTable = ({ 
  logs, 
  isLoading, 
  onUpdateLog, 
  onSelectLog,
  selectedLogId,
  showActions = true
}: LogTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleUpdateAlert = (id: string, alertValue: boolean) => {
    if (!id || id === 'undefined') {
      toast({
        title: "Error",
        description: "Cannot update log: Invalid log ID",
        variant: "destructive"
      });
      return;
    }
    
    if (onUpdateLog) {
      onUpdateLog(id, { alert: alertValue });
    }
  };

  const handleUpdateTrigger = (id: string, triggerValue: boolean) => {
    if (!id || id === 'undefined') {
      toast({
        title: "Error",
        description: "Cannot update log: Invalid log ID",
        variant: "destructive"
      });
      return;
    }
    
    if (onUpdateLog) {
      onUpdateLog(id, { trigger: triggerValue });
    }
  };
  
  const handleUpdateClassification = (id: string, classification: "normal" | "suspicious" | "anomaly" | "critical") => {
    if (!id || id === 'undefined') {
      toast({
        title: "Error",
        description: "Cannot update log: Invalid log ID",
        variant: "destructive"
      });
      return;
    }
    
    if (onUpdateLog) {
      onUpdateLog(id, { ai_classification: classification });
    }
  };

  const handleExportSingleLog = (log: LogEntry) => {
    try {
      if (!log || !log.id) {
        toast({
          title: "Export Error",
          description: "Cannot export log: Invalid log data",
          variant: "destructive"
        });
        return;
      }
      
      // Create CSV content for a single log
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Add headers
      csvContent += "ID,Timestamp,Level,Channel,Event ID,Provider,Message,Alert,Trigger,Classification\n";
      
      // Add log data - ensuring timestamp is properly handled
      const timestamp = typeof log.timestamp === 'string' 
        ? log.timestamp 
        : (log.timestamp instanceof Date ? log.timestamp.toISOString() : new Date(log.timestamp).toISOString());
      
      const row = [
        log.id,
        timestamp,
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
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `log_${log.record_id || log.id}.csv`);
      document.body.appendChild(link);
      
      // Download CSV file
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Complete",
        description: `Log #${log.record_id || log.id} exported to CSV.`
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Error",
        description: "Failed to export log. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (log: LogEntry) => {
    if (!log || !log.id) {
      toast({
        title: "Navigation Error",
        description: "Cannot navigate to log details: log ID is missing.",
        variant: "destructive"
      });
      return;
    }
    navigate(`/logs/${log.id}`);
  };

  // Helper function to get correct classification styling based on classification value
  const getClassificationStyle = (classification?: string | null) => {
    const color = classificationColor(classification);
    
    switch(color) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'orange':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Similar function for level styling
  const getLevelStyle = (level: string) => {
    const color = levelColor(level);
    
    switch(color) {
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading logs...</div>;
  }

  if (!logs.length) {
    return <div className="text-center p-8 text-gray-500">No logs found</div>;
  }

  return (
    <div className="w-full">
      <table className="scanalyzer-table w-full min-w-[800px]">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Level</th>
            <th>Record ID</th>
            <th>Channel</th>
            <th>Event ID</th>
            <th>Provider</th>
            <th>Message</th>
            <th>Classification</th>
            {showActions && <th className="sticky right-0 bg-white shadow-[-8px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr 
              key={log.id || `log-${log.record_id}`} 
              className={`${log.alert ? "bg-red-50" : ""} hover:bg-gray-50`}
            >
              <td className="whitespace-nowrap">{formatDate(log.timestamp)}</td>
              <td className="whitespace-nowrap">
                <Badge 
                  variant="outline" 
                  className={getLevelStyle(log.level)}
                >
                  {log.level}
                </Badge>
              </td>
              <td>{log.record_id}</td>
              <td>{log.channel}</td>
              <td>{log.event_id}</td>
              <td className="max-w-[150px] truncate">{log.provider}</td>
              <td>
                <div className="max-w-[200px] md:max-w-[300px]">
                  <div 
                    className="cursor-pointer hover:text-primary truncate" 
                    onClick={() => toggleRow(log.id)}
                  >
                    {expandedRows[log.id] ? 
                      log.message.map((msg, idx) => <p key={idx}>{msg}</p>) : 
                      truncateMessage(log.message)
                    }
                  </div>
                </div>
              </td>
              <td>
                {onUpdateLog ? (
                  <select 
                    value={log.ai_classification || 'unclassified'} 
                    onChange={(e) => handleUpdateClassification(log.id, e.target.value as any)}
                    className={`px-2 py-1 rounded-md ${getClassificationStyle(log.ai_classification)}`}
                  >
                    <option value="unclassified">Unclassified</option>
                    <option value="normal">Normal</option>
                    <option value="suspicious">Suspicious</option>
                    <option value="anomaly">Anomaly</option>
                    <option value="critical">Critical</option>
                  </select>
                ) : (
                  <Badge 
                    variant="outline" 
                    className={getClassificationStyle(log.ai_classification)}
                  >
                    {log.ai_classification || 'unclassified'}
                  </Badge>
                )}
              </td>
              {showActions && (
                <td className="whitespace-nowrap sticky right-0 bg-white shadow-[-8px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">
                  <div className="flex space-x-1">
                    {/* CSV Export Button */}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExportSingleLog(log)}
                      title="Export as CSV"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    
                    {/* Alert Toggle Button */}
                    {onUpdateLog && (
                      <Button 
                        size="sm" 
                        variant={log.alert ? "destructive" : "outline"} 
                        onClick={() => handleUpdateAlert(log.id, !log.alert)}
                        title={log.alert ? "Remove alert flag" : "Mark as alert"}
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Trigger Toggle Button */}
                    {onUpdateLog && (
                      <Button 
                        size="sm" 
                        variant={log.trigger ? "secondary" : "outline"} 
                        onClick={() => handleUpdateTrigger(log.id, !log.trigger)}
                        title={log.trigger ? "Remove trigger flag" : "Mark as trigger"}
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Details Button */}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDetails(log)}
                      title="View details"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogTable;
