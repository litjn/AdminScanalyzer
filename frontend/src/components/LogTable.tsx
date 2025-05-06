
import { useState } from 'react';
import { LogEntry } from '@/types/logs';
import { Link } from 'react-router-dom';
import { formatDate, truncateMessage, classificationColor, levelColor } from '@/lib/logUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, Zap } from 'lucide-react';

interface LogTableProps {
  logs: LogEntry[];
  isLoading?: boolean;
  onUpdateLog?: (id: string, data: Partial<LogEntry>) => void;
  showActions?: boolean;
  customActions?: (log: LogEntry) => React.ReactNode;
}

const LogTable = ({ logs, isLoading, onUpdateLog, showActions = true, customActions }: LogTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleUpdateAlert = (id: string, alertValue: boolean) => {
    if (onUpdateLog) {
      onUpdateLog(id, { alert: alertValue });
    }
  };

  const handleUpdateTrigger = (id: string, triggerValue: boolean) => {
    if (onUpdateLog) {
      onUpdateLog(id, { trigger: triggerValue });
    }
  };
  
  const handleUpdateClassification = (id: string, classification: "normal" | "suspicious" | "anomaly" | "critical") => {
    if (onUpdateLog) {
      onUpdateLog(id, { ai_classification: classification });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading logs...</div>;
  }

  if (!logs.length) {
    return <div className="text-center p-8 text-gray-500">No logs found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="scanalyzer-table">
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
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className={log.alert ? "bg-red-50" : ""}>
              <td className="whitespace-nowrap">{formatDate(log.timestamp)}</td>
              <td>
                <Badge variant="outline" className={`bg-${levelColor(log.level)}-100 text-${levelColor(log.level)}-800 border-${levelColor(log.level)}-200`}>
                  {log.level}
                </Badge>
              </td>
              <td>{log.record_id}</td>
              <td>{log.channel}</td>
              <td>{log.event_id}</td>
              <td>{log.provider}</td>
              <td>
                <div className="max-w-md">
                  <div 
                    className="cursor-pointer hover:text-primary" 
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
                    className={`px-2 py-1 rounded-md bg-${classificationColor(log.ai_classification)}-100 border border-${classificationColor(log.ai_classification)}-200 text-${classificationColor(log.ai_classification)}-800`}
                  >
                    <option value="unclassified">Unclassified</option>
                    <option value="normal">Normal</option>
                    <option value="suspicious">Suspicious</option>
                    <option value="anomaly">Anomaly</option>
                    <option value="critical">Critical</option>
                  </select>
                ) : (
                  <Badge variant="outline" className={`bg-${classificationColor(log.ai_classification)}-100 text-${classificationColor(log.ai_classification)}-800 border-${classificationColor(log.ai_classification)}-200`}>
                    {log.ai_classification || 'unclassified'}
                  </Badge>
                )}
              </td>
              {showActions && (
                <td className="whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={`/logs/${log.id}`}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                    
                    {onUpdateLog && (
                      <>
                        <Button 
                          size="sm" 
                          variant={log.alert ? "destructive" : "outline"} 
                          onClick={() => handleUpdateAlert(log.id, !log.alert)}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant={log.trigger ? "secondary" : "outline"} 
                          onClick={() => handleUpdateTrigger(log.id, !log.trigger)}
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {customActions && customActions(log)}
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
