
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Tags,
  AlertTriangle
} from 'lucide-react';
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { LogEntry, useLogs, updateLog } from '@/hooks/useLogs';

const LogCollectionPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [markedLogs, setMarkedLogs] = useState<Record<string, boolean>>({});
  const [showMarked, setShowMarked] = useState(false);
  const [filters, setFilters] = useState({
    level: 'all',
    channel: 'all',
    computer: 'all',
    fromDate: '',
    toDate: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'timestamp',
    direction: 'desc'
  });

  // Fetch logs from API with filters
  const { logs: apiLogs = [], loading } = useLogs({
    level: filters.level !== 'all' ? filters.level : undefined,
    channel: filters.channel !== 'all' ? filters.channel : undefined,
    device_id: filters.computer !== 'all' ? filters.computer : undefined
  });
  
  // Initialize marked logs from API data
  useEffect(() => {
    if (apiLogs && Array.isArray(apiLogs)) {
      const newMarkedLogs: Record<string, boolean> = {};
      apiLogs.forEach(log => {
        if (log.trigger) {
          newMarkedLogs[log._id] = true;
        }
      });
      setMarkedLogs(prevMarked => ({
        ...prevMarked,
        ...newMarkedLogs
      }));
    }
  }, [apiLogs]);
  
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  
  // Apply client-side filters and search
  useEffect(() => {
    if (!apiLogs || !Array.isArray(apiLogs)) {
      setFilteredLogs([]);
      return;
    }
    
    let result = [...apiLogs];
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        (log.msg && log.msg.some(m => m.toLowerCase().includes(term))) ||
        (log.computer && log.computer.toLowerCase().includes(term)) ||
        (log.channel && log.channel.toLowerCase().includes(term)) ||
        (log.source_name && log.source_name.toLowerCase().includes(term))
      );
    }
    
    // Apply date filters
    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate);
      result = result.filter(log => new Date(log.timestamp) >= fromDate);
    }
    
    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59); // End of day
      result = result.filter(log => new Date(log.timestamp) <= toDate);
    }
    
    // Apply marked logs filter
    if (showMarked) {
      result = result.filter(log => markedLogs[log._id] || log.trigger);
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      if (sortConfig.key === 'timestamp') {
        if (sortConfig.direction === 'asc') {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        } else {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
      }
      return 0;
    });
    
    setFilteredLogs(result);
  }, [apiLogs, searchTerm, filters, sortConfig, markedLogs, showMarked]);

  // Get unique values for filter dropdowns
  const channelOptions = Array.isArray(apiLogs) ? Array.from(new Set(apiLogs.map(log => log.channel).filter(Boolean))) : [];
  const computerOptions = Array.isArray(apiLogs) ? Array.from(new Set(apiLogs.map(log => log.computer).filter(Boolean))) : [];
  const levelOptions = Array.isArray(apiLogs) ? Array.from(new Set(apiLogs.map(log => log.level).filter(Boolean))) : [];

  // Reset filters
  const resetFilters = () => {
    setFilters({
      level: 'all',
      channel: 'all',
      computer: 'all',
      fromDate: '',
      toDate: ''
    });
    setSearchTerm('');
    setShowMarked(false);
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
        toast.success('Log marked for reference');
      }
    } catch (error) {
      toast.error('Failed to update log');
      console.error('Error updating log:', error);
    }
  };

  // Export logs as CSV
  const exportCSV = () => {
    if (!Array.isArray(filteredLogs) || filteredLogs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = ['ID', 'Record ID', 'Timestamp', 'Computer', 'Channel', 'Source', 'Level', 'Message', 'Alert', 'Marked'];
    
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log._id,
        log.record_id,
        log.timestamp,
        log.computer,
        log.channel,
        log.source_name,
        log.level,
        `"${log.msg ? log.msg.join(' ').replace(/"/g, '""') : ''}"`,
        log.alert ? 'Yes' : 'No',
        (markedLogs[log._id] || log.trigger) ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `scanalyzer-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Logs exported successfully');
  };

  // Toggle sort
  const handleSort = (key: string) => {
    if (sortConfig.key === key) {
      setSortConfig({
        ...sortConfig,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSortConfig({
        key,
        direction: 'desc'
      });
    }
  };

  // Render severity badge based on level
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
        return <Badge>{level}</Badge>;
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Log Collection</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
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
          
          <Button 
            variant="outline" 
            onClick={exportCSV}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
      
      {/* Filter panel */}
      {filterOpen && (
        <div className="p-4 border rounded-md bg-background shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Filter Logs</h3>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Level</label>
              <Select 
                value={filters.level} 
                onValueChange={(value) => setFilters({...filters, level: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  {levelOptions.map(level => (
                    <SelectItem key={level || 'unknown'} value={level || 'unknown'}>
                      {level || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Computer</label>
              <Select 
                value={filters.computer} 
                onValueChange={(value) => setFilters({...filters, computer: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All computers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All computers</SelectItem>
                  {computerOptions.map(computer => (
                    <SelectItem key={computer || 'unknown'} value={computer || 'unknown'}>
                      {computer || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Channel</label>
              <Select 
                value={filters.channel} 
                onValueChange={(value) => setFilters({...filters, channel: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  {channelOptions.map(channel => (
                    <SelectItem key={channel || 'unknown'} value={channel || 'unknown'}>
                      {channel || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                From Date
              </label>
              <Input 
                type="date" 
                value={filters.fromDate} 
                onChange={(e) => setFilters({...filters, fromDate: e.target.value})} 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                To Date
              </label>
              <Input 
                type="date" 
                value={filters.toDate}
                onChange={(e) => setFilters({...filters, toDate: e.target.value})} 
              />
            </div>
            
            <div className="space-y-1 flex items-center gap-2">
              <Tags className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="show-marked">Show only marked logs:</Label>
              <Switch 
                id="show-marked" 
                checked={showMarked}
                onCheckedChange={setShowMarked}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Results count */}
      <div className="text-sm text-muted-foreground flex justify-between">
        <div>
          {loading 
            ? "Loading logs..." 
            : `Showing ${filteredLogs.length} of ${Array.isArray(apiLogs) ? apiLogs.length : 0} logs`}
        </div>
        <div>
          {Object.keys(markedLogs).filter(id => markedLogs[id]).length} logs marked
        </div>
      </div>
      
      {/* Logs table */}
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center">
                  Timestamp
                  {sortConfig.key === 'timestamp' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Computer</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Alert</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Loading logs...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <TableRow 
                  key={log._id}
                  className={(markedLogs[log._id] || log.trigger) ? 'border-l-4 border-l-scanalyzer-purple-dark bg-scanalyzer-purple/5' : ''}
                >
                  <TableCell className="whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell>{log.computer}</TableCell>
                  <TableCell>{log.channel}</TableCell>
                  <TableCell>{log.source_name}</TableCell>
                  <TableCell>
                    {renderLevelBadge(log.level)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.msg && log.msg.join(' ')}
                  </TableCell>
                  <TableCell>
                    {log.alert && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={(markedLogs[log._id] || log.trigger) ? "default" : "ghost"} 
                      size="sm"
                      className={
                        (markedLogs[log._id] || log.trigger) 
                          ? "h-7 text-xs" 
                          : "h-7 text-xs text-muted-foreground"
                      }
                      onClick={() => toggleMarked(log._id, markedLogs[log._id] || log.trigger)}
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      {(markedLogs[log._id] || log.trigger) ? 'Marked' : 'Mark'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No logs found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LogCollectionPage;
