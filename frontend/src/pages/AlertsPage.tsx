
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, CalendarDays, Filter, Search, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import SeverityBadge from '@/components/SeverityBadge';
import { generateMockLogs, formatDate, Log, LogSeverity } from '@/utils/mockData';
import { useNavigate } from 'react-router-dom';

const AlertsPage = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Log[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Log[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    severity: 'all' as 'all' | LogSeverity,
    timeRange: 'all',
    status: 'all'
  });
  
  // Generate mock alerts
  useEffect(() => {
    // For this demo, we'll consider critical and anomaly logs as alerts
    const mockLogs = generateMockLogs(50);
    const criticalLogs = mockLogs.filter(log => 
      log.severity === 'critical' || log.severity === 'anomaly'
    );
    setAlerts(criticalLogs);
    setFilteredAlerts(criticalLogs);
  }, []);
  
  // Apply filters
  useEffect(() => {
    let result = alerts;
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(alert => 
        alert.message.toLowerCase().includes(term) ||
        alert.device_name.toLowerCase().includes(term) ||
        alert.ip_address.includes(term)
      );
    }
    
    // Apply severity filter
    if (filters.severity !== 'all') {
      result = result.filter(alert => alert.severity === filters.severity);
    }
    
    // Apply time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date();
      let cutoff = new Date();
      
      switch (filters.timeRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case '24h':
          cutoff.setHours(now.getHours() - 24);
          break;
        case '7d':
          cutoff.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoff.setDate(now.getDate() - 30);
          break;
      }
      
      result = result.filter(alert => new Date(alert.timestamp) >= cutoff);
    }
    
    setFilteredAlerts(result);
  }, [alerts, searchTerm, filters]);
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      severity: 'all',
      timeRange: 'all',
      status: 'all'
    });
    setSearchTerm('');
  };
  
  // Count alerts by severity
  const criticalCount = filteredAlerts.filter(a => a.severity === 'critical').length;
  const anomalyCount = filteredAlerts.filter(a => a.severity === 'anomaly').length;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Alerts</h1>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-3">
          <TabsTrigger value="all">All Alerts ({filteredAlerts.length})</TabsTrigger>
          <TabsTrigger value="critical">Critical ({criticalCount})</TabsTrigger>
          <TabsTrigger value="anomaly">Anomaly ({anomalyCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          {/* Filter bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setFilterOpen(!filterOpen)}
                className={filterOpen ? 'bg-secondary' : ''}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredAlerts.length} of {alerts.length} alerts
            </div>
          </div>
          
          {/* Filter panel */}
          {filterOpen && (
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Filter Alerts</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Reset
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setFilterOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Severity</label>
                    <Select 
                      value={filters.severity} 
                      onValueChange={(value) => setFilters({...filters, severity: value as 'all' | LogSeverity})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All severities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="anomaly">Anomaly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Time Range</label>
                    <Select 
                      value={filters.timeRange} 
                      onValueChange={(value) => setFilters({...filters, timeRange: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="24h">Last 24 hours</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Status</label>
                    <Select 
                      value={filters.status} 
                      onValueChange={(value) => setFilters({...filters, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All status</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in-progress">In progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Alerts list */}
          <div className="space-y-3">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map(alert => (
                <Card key={alert.id} className={`transition-colors ${alert.severity === 'critical' ? 'border-scanalyzer-severity-critical/40' : ''}`}>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base flex items-center">
                        {alert.severity === 'critical' ? (
                          <AlertTriangle className="h-4 w-4 text-scanalyzer-severity-critical mr-2" />
                        ) : (
                          <Bell className="h-4 w-4 text-scanalyzer-severity-anomaly mr-2" />
                        )}
                        {alert.message}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <CalendarDays className="h-3.5 w-3.5 mr-1" />
                        {formatDate(alert.timestamp)}
                      </CardDescription>
                    </div>
                    <SeverityBadge type={alert.severity} />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Device</div>
                        <div>{alert.device_name}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">IP Address</div>
                        <div>{alert.ip_address}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Operation</div>
                        <div>{alert.opcode}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center"
                        onClick={() => navigate('/logs')}
                      >
                        View Details <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 border rounded-md bg-muted/30">
                <p className="text-muted-foreground">No alerts match your criteria</p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="critical">
          {/* Critical Alerts Content */}
          <div className="space-y-3">
            {filteredAlerts
              .filter(alert => alert.severity === 'critical')
              .map(alert => (
                <Card key={alert.id} className="border-scanalyzer-severity-critical/40">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base flex items-center">
                        <AlertTriangle className="h-4 w-4 text-scanalyzer-severity-critical mr-2" />
                        {alert.message}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <CalendarDays className="h-3.5 w-3.5 mr-1" />
                        {formatDate(alert.timestamp)}
                      </CardDescription>
                    </div>
                    <SeverityBadge type={alert.severity} />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Device</div>
                        <div>{alert.device_name}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">IP Address</div>
                        <div>{alert.ip_address}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Operation</div>
                        <div>{alert.opcode}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center"
                        onClick={() => navigate('/logs')}
                      >
                        View Details <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="anomaly">
          {/* Anomaly Alerts Content */}
          <div className="space-y-3">
            {filteredAlerts
              .filter(alert => alert.severity === 'anomaly')
              .map(alert => (
                <Card key={alert.id}>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base flex items-center">
                        <Bell className="h-4 w-4 text-scanalyzer-severity-anomaly mr-2" />
                        {alert.message}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <CalendarDays className="h-3.5 w-3.5 mr-1" />
                        {formatDate(alert.timestamp)}
                      </CardDescription>
                    </div>
                    <SeverityBadge type={alert.severity} />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Device</div>
                        <div>{alert.device_name}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">IP Address</div>
                        <div>{alert.ip_address}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Operation</div>
                        <div>{alert.opcode}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center"
                        onClick={() => navigate('/logs')}
                      >
                        View Details <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertsPage;
