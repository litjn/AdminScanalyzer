
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { LogFilter as LogFilterType } from '@/types/logs';
import { format } from 'date-fns';
import { CalendarIcon, Filter as FilterIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogFilterProps {
  onFilterChange: (filters: LogFilterType) => void;
  onExport?: () => void;
  className?: string;
}

const LogFilter = ({ onFilterChange, onExport, className }: LogFilterProps) => {
  const [filters, setFilters] = useState<LogFilterType>({
    searchText: '',
    level: undefined,
    channel: '',
    startDate: undefined,
    endDate: undefined,
    classification: undefined,
    alert: undefined,
    trigger: undefined,
  });

  const handleFilterChange = (key: keyof LogFilterType, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      return newFilters;
    });
  };

  const applyFilters = () => {
    onFilterChange(filters);
  };

  const resetFilters = () => {
    setFilters({
      searchText: '',
      level: undefined,
      channel: '',
      startDate: undefined,
      endDate: undefined,
      classification: undefined,
      alert: undefined,
      trigger: undefined,
    });
    onFilterChange({});
  };

  return (
    <div className={cn("bg-white p-4 rounded-lg shadow-sm border", className)}>
      <div className="flex flex-col space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div>
            <Label htmlFor="search">Search logs</Label>
            <Input
              id="search"
              placeholder="Search messages, providers..."
              value={filters.searchText || ''}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Level Filter */}
          <div>
            <Label>Log Level</Label>
            <Select 
              value={filters.level} 
              onValueChange={(value) => handleFilterChange('level', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Information">Information</SelectItem>
                <SelectItem value="Warning">Warning</SelectItem>
                <SelectItem value="Error">Error</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Channel Filter */}
          <div>
            <Label>Channel</Label>
            <Select 
              value={filters.channel} 
              onValueChange={(value) => handleFilterChange('channel', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {/* Fixed: Changed empty string to "all" */}
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="System">System</SelectItem>
                <SelectItem value="Application">Application</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Classification Filter */}
          <div>
            <Label>Classification</Label>
            <Select 
              value={filters.classification} 
              onValueChange={(value) => handleFilterChange('classification', value as any || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classifications</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="suspicious">Suspicious</SelectItem>
                <SelectItem value="anomaly">Anomaly</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Filters */}
          <div>
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? (
                    format(filters.startDate, "PPP")
                  ) : (
                    <span>Start date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => handleFilterChange('startDate', date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? (
                    format(filters.endDate, "PPP")
                  ) : (
                    <span>End date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => handleFilterChange('endDate', date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Flag Filters */}
          <div>
            <Label>Status Flags</Label>
            <div className="flex space-x-2 mt-2">
              <Button 
                variant={filters.alert ? "destructive" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('alert', filters.alert === undefined ? true : undefined)}
              >
                Alert
              </Button>
              <Button 
                variant={filters.trigger ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('trigger', filters.trigger === undefined ? true : undefined)}
              >
                Trigger
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <Button variant="ghost" onClick={resetFilters}>
            Reset Filters
          </Button>
          
          <div className="flex space-x-2">
            {onExport && (
              <Button variant="outline" onClick={onExport}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            )}
            
            <Button onClick={applyFilters}>
              <FilterIcon className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogFilter;
