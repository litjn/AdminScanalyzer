
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RawLogEntry, LogEntry } from '@/types/logs';
import { transformLog, formatDate, classificationColor } from '@/lib/logUtils';
import { 
  ArrowLeft, 
  Trash2, 
  AlertTriangle, 
  Zap,
  CheckCircle,
  XCircle 
} from 'lucide-react';

const LogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [log, setLog] = useState<LogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchLogDetail(id);
    }
  }, [id]);

  const fetchLogDetail = (logId: string) => {
    setIsLoading(true);
    api.get<RawLogEntry>(`/logs/${logId}`)
      .then(response => {
        setLog(transformLog(response.data));
        setError(null);
      })
      .catch(error => {
        console.error('Failed to fetch log detail:', error);
        setError(error);
        toast({
          title: "Error",
          description: "Failed to fetch log details. The log may have been deleted or doesn't exist.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleUpdateLog = (data: Partial<LogEntry>) => {
    if (!id) return;
    
    api.put(`/logs/${id}`, data)
      .then(() => {
        setLog(prev => prev ? { ...prev, ...data } : null);
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

  const handleDeleteLog = () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this log?')) {
      api.delete(`/logs/${id}`)
        .then(() => {
          toast({
            title: "Success",
            description: "Log deleted successfully.",
          });
          navigate('/logs');
        })
        .catch(error => {
          console.error('Failed to delete log:', error);
          toast({
            title: "Error",
            description: "Failed to delete log. Please try again.",
            variant: "destructive",
          });
        });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="text-lg">Loading log details...</div>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-lg text-red-800">
          <h2 className="text-lg font-medium mb-2">Error</h2>
          <p>Failed to load log details. The log may have been deleted or doesn't exist.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/logs">Back to Logs</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/logs" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Log Collection
          </Link>
        </Button>
        <Button variant="destructive" onClick={handleDeleteLog}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Log
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Log Detail</CardTitle>
                  <CardDescription>
                    {formatDate(log.timestamp)}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Badge variant="outline" className={`bg-${classificationColor(log.level)}-100 text-${classificationColor(log.level)}-800 border-${classificationColor(log.level)}-200`}>
                    {log.level}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Message</h3>
                  <div className="mt-1 bg-softGray p-4 rounded-md">
                    {log.message.map((msg, idx) => (
                      <p key={idx} className="text-sm whitespace-pre-wrap">{msg}</p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Raw Log Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                {JSON.stringify(log, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Log Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">ID</h3>
                <p className="mt-1">{log.id}</p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Agent ID</h3>
                <p className="mt-1">{log.agent_id}</p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Event Details</h3>
                <div className="mt-1 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Event ID:</span>
                    <span>{log.event_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Channel:</span>
                    <span>{log.channel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Provider:</span>
                    <span>{log.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Host:</span>
                    <span>{log.event_host}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Record ID:</span>
                    <span>{log.record_id}</span>
                  </div>
                  {log.user_sid && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">User SID:</span>
                      <span>{log.user_sid}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Classification</h3>
                <div className="mt-2">
                  <select 
                    value={log.ai_classification || 'unclassified'} 
                    onChange={(e) => handleUpdateLog({ ai_classification: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-md border bg-${classificationColor(log.ai_classification)}-100 border-${classificationColor(log.ai_classification)}-200 text-${classificationColor(log.ai_classification)}-800`}
                  >
                    <option value="unclassified">Unclassified</option>
                    <option value="normal">Normal</option>
                    <option value="suspicious">Suspicious</option>
                    <option value="anomaly">Anomaly</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                className="w-full" 
                variant={log.alert ? "destructive" : "outline"} 
                onClick={() => handleUpdateLog({ alert: !log.alert })}
              >
                {log.alert ? <XCircle className="mr-2 h-4 w-4" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                {log.alert ? "Remove Alert" : "Mark as Alert"}
              </Button>
              
              <Button 
                className="w-full" 
                variant={log.trigger ? "secondary" : "outline"} 
                onClick={() => handleUpdateLog({ trigger: !log.trigger })}
              >
                {log.trigger ? <XCircle className="mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
                {log.trigger ? "Remove Trigger" : "Mark as Trigger"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LogDetail;
