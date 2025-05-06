
import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, AlertCircle, ArrowUpRight } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import SeverityBadge from '@/components/SeverityBadge';
import { 
  generateMockLogs, 
  formatDate, 
  Log, 
  LogSeverity,
  simulateLogStream,
  startMockStream,
  stopMockStream,
  generateMockAnalytics
} from '@/utils/mockData';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<Log[]>([]);
  const [streamLogs, setStreamLogs] = useState<Log[]>([]);
  const [analytics, setAnalytics] = useState(generateMockAnalytics());
  
  // Load initial logs
  useEffect(() => {
    // Simulate API fetch
    const fetchedLogs = generateMockLogs(10);
    setLogs(fetchedLogs);
    
    // Start the stream for dashboard widget
    startMockStream();
    
    // Subscribe to stream for widget
    const unsubscribe = simulateLogStream((log) => {
      setStreamLogs(prev => [log, ...prev].slice(0, 5));
    });
    
    return () => {
      stopMockStream();
      unsubscribe();
    };
  }, []);

  // Prepare data for charts
  const severityChartData = [
    { name: 'Critical', value: analytics.alerts.critical, color: '#EF4444' },
    { name: 'Anomaly', value: analytics.alerts.anomaly, color: '#FB923C' },
    { name: 'Suspicious', value: analytics.alerts.suspicious, color: '#FBBF24' },
    { name: 'Normal', value: analytics.alerts.normal, color: '#4ADE80' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Logs</CardDescription>
            <CardTitle className="text-3xl">{analytics.totalLogs.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {analytics.todayLogs.toLocaleString()} logs today
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical Alerts</CardDescription>
            <CardTitle className="text-3xl text-scanalyzer-severity-critical">
              {analytics.alerts.critical}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+2 in the last hour</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Anomaly Alerts</CardDescription>
            <CardTitle className="text-3xl text-scanalyzer-severity-anomaly">
              {analytics.alerts.anomaly}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+5 in the last hour</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Suspicious Activity</CardDescription>
            <CardTitle className="text-3xl text-scanalyzer-severity-suspicious">
              {analytics.alerts.suspicious}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+12 in the last hour</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Log Volume</CardTitle>
                <CardDescription>Logs received over time</CardDescription>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.recentTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      background: "#FFF", 
                      border: "1px solid #E2E8F0", 
                      borderRadius: "4px" 
                    }}
                    formatter={(value) => [`${value} logs`, "Volume"]}
                  />
                  <Bar dataKey="value" fill="#7E69AB" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Severity Distribution</CardTitle>
                <CardDescription>Logs by classification</CardDescription>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      background: "#FFF", 
                      border: "1px solid #E2E8F0", 
                      borderRadius: "4px" 
                    }}
                    formatter={(value) => [value, "Count"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Log sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Streamed Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Streamed Logs</CardTitle>
                <CardDescription>Recent events in real-time</CardDescription>
              </div>
              <Button 
                variant="link" 
                className="text-scanalyzer-purple"
                onClick={() => navigate('/streamer')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {streamLogs.length > 0 ? (
                streamLogs.map(log => (
                  <div 
                    key={log.id} 
                    className="text-sm p-3 border rounded-md flex flex-col space-y-1 hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{log.device_name}</div>
                      <SeverityBadge type={log.severity} />
                    </div>
                    <div className="text-muted-foreground">
                      {log.message}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  <p>Waiting for logs...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Saved Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Critical Events</CardTitle>
                <CardDescription>Alerts that require attention</CardDescription>
              </div>
              <Button 
                variant="link" 
                className="text-scanalyzer-purple"
                onClick={() => navigate('/alerts')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs
                .filter(log => log.severity === 'critical' || log.severity === 'anomaly')
                .slice(0, 5)
                .map(log => (
                  <div 
                    key={log.id} 
                    className="text-sm p-3 border rounded-md flex flex-col space-y-1 hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium flex items-center">
                        {log.severity === 'critical' && (
                          <AlertCircle className="h-3.5 w-3.5 text-scanalyzer-severity-critical mr-1" />
                        )}
                        {log.device_name}
                      </div>
                      <SeverityBadge type={log.severity} />
                    </div>
                    <div className="text-muted-foreground">
                      {log.message}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatDate(log.timestamp)}</span>
                      <span>{log.ip_address}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
