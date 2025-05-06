
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { LogEntry, RawLogEntry } from '@/types/logs';
import { transformLog, classificationColor } from '@/lib/logUtils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, AlertTriangle, Zap, BarChart4, BookOpen } from 'lucide-react';
import { 
  BarChart,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  Cell
} from 'recharts';

const Dashboard = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = () => {
    setIsLoading(true);
    api.get<RawLogEntry[]>('/logs')
      .then(response => {
        const logsData = Array.isArray(response.data) 
          ? response.data.map(transformLog) 
          : [];
        setLogs(logsData);
      })
      .catch(error => {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Calculate statistics
  const totalLogs = logs.length;
  const alertCount = logs.filter(log => log.alert).length;
  const triggerCount = logs.filter(log => log.trigger).length;
  const criticalCount = logs.filter(log => log.ai_classification === 'critical').length;

  // Prepare chart data
  const classificationData = [
    { name: 'Normal', value: logs.filter(log => log.ai_classification === 'normal').length },
    { name: 'Suspicious', value: logs.filter(log => log.ai_classification === 'suspicious').length },
    { name: 'Anomaly', value: logs.filter(log => log.ai_classification === 'anomaly').length },
    { name: 'Critical', value: logs.filter(log => log.ai_classification === 'critical').length },
    { name: 'Unclassified', value: logs.filter(log => !log.ai_classification).length },
  ];

  const levelData = Array.from(
    logs.reduce((acc, log) => {
      const level = log.level || 'Unknown';
      acc.set(level, (acc.get(level) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value }));

  const channelData = Array.from(
    logs.reduce((acc, log) => {
      const channel = log.channel || 'Unknown';
      acc.set(channel, (acc.get(channel) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const COLORS = ['#4c00b0', '#6d28d9', '#8b5cf6', '#a78bfa', '#c4b5fd'];

  // Recent logs for display
  const recentLogs = [...logs]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  // Alert logs for display
  const alertLogs = logs
    .filter(log => log.alert)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Dashboard</h1>
        <p className="text-gray-600">
          Real-time overview of security logs and system health.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-white to-softGray">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLogs}</div>
            <p className="text-xs text-gray-500 mt-1">Collected logs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-softGray">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{alertCount}</div>
            <p className="text-xs text-gray-500 mt-1">Log events marked as alerts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-softGray">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Triggers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{triggerCount}</div>
            <p className="text-xs text-gray-500 mt-1">Log events set as triggers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-softGray">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Critical Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{criticalCount}</div>
            <p className="text-xs text-gray-500 mt-1">High severity events</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-white to-softGray">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart4 className="h-5 w-5 mr-2 text-primary" />
              Log Classification Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classificationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {classificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-softGray">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart4 className="h-5 w-5 mr-2 text-primary" />
              Top Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={channelData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4c00b0" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent and Alert Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white to-softGray">
          <CardHeader className="flex flex-row justify-between items-center">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              <CardTitle>Recent Logs</CardTitle>
            </div>
            <Button variant="link" asChild>
              <Link to="/logs">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p>Loading recent logs...</p>
              ) : recentLogs.length === 0 ? (
                <p className="text-gray-500">No recent logs available.</p>
              ) : (
                recentLogs.map(log => (
                  <div key={log.id} className="border-b pb-2">
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="outline" className={`bg-${classificationColor(log.level)}-100 text-${classificationColor(log.level)}-800 border-${classificationColor(log.level)}-200`}>
                        {log.level}
                      </Badge>
                      <span className="text-xs text-gray-500">{log.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm truncate">{log.message[0]}</p>
                    <div className="flex justify-end mt-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/logs/${log.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-softGray">
          <CardHeader className="flex flex-row justify-between items-center">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              <CardTitle>Active Alerts</CardTitle>
            </div>
            <Button variant="link" asChild>
              <Link to="/alerts">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p>Loading alerts...</p>
              ) : alertLogs.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No active alerts at this time.</p>
                </div>
              ) : (
                alertLogs.map(log => (
                  <div key={log.id} className="border-b pb-2 border-red-100">
                    <div className="flex justify-between items-start mb-1">
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        {log.ai_classification || 'Unclassified'}
                      </Badge>
                      <span className="text-xs text-gray-500">{log.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm truncate">{log.message[0]}</p>
                    <div className="flex justify-end mt-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/logs/${log.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
