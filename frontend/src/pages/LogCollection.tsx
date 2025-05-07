
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { LogFilter as LogFilterType } from '@/types/logs';
import { useLogs } from '@/hooks/use-logs';
import LogFilter from '@/components/LogFilter';
import LogTable from '@/components/LogTable';
import { exportLogsToCSV } from '@/utils/exportUtils';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious
} from "@/components/ui/pagination";
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";

const LogCollection = () => {
  const [page, setPage] = useState(1);
  const pageSize = 100; // Default page size from API
  const [activeFilters, setActiveFilters] = useState<LogFilterType>({});
  const { toast } = useToast();

  // Use our custom hook to handle log fetching and filtering
  const {
    filteredLogs,
    isLoading,
    error,
    total,
    hasMore,
    updateLog
  } = useLogs(page, pageSize, activeFilters);

  const handleFilterChange = (filters: LogFilterType) => {
    // Store the new filters
    setActiveFilters(filters);
    
    // Reset to the first page when filters change
    if (page !== 1) {
      setPage(1);
    }
  };

  const handleExport = () => {
    const result = exportLogsToCSV(filteredLogs);
    
    if (result.success) {
      toast({
        title: "Export Complete",
        description: result.message
      });
    } else {
      toast({
        title: "Export Error",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const goToNextPage = () => {
    if (hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Log Collection</h1>
        <p className="text-muted-foreground">Browse, filter, and analyze security logs from across your environment.</p>
      </div>
      
      <LogFilter 
        onFilterChange={handleFilterChange} 
        onExport={handleExport} 
        className="mb-6" 
      />
      
      {error ? (
        <div className="p-4 bg-red-50 text-red-800 rounded-md">
          Failed to load logs. Please try again later.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h2 className="text-lg font-medium">Logs ({filteredLogs.length} of {total})</h2>
            
            {/* Pagination Controls - Top */}
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToPrevPage} 
                    disabled={page <= 1}
                    className="flex items-center gap-1"
                  >
                    Previous
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 py-1 rounded bg-muted min-w-[40px] text-center">{page}</span>
                </PaginationItem>
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToNextPage} 
                    disabled={!hasMore}
                    className="flex items-center gap-1"
                  >
                    Next
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
          
          {/* Table container with vertical and horizontal scroll */}
          <div className="relative">
            <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px]">
              {isLoading ? (
                <div className="flex justify-center items-center p-8 h-64">
                  Loading logs...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex justify-center items-center p-8 h-64 text-muted-foreground">
                  No logs found matching the current filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <LogTable 
                    logs={filteredLogs}
                    isLoading={isLoading}
                    onUpdateLog={updateLog}
                    showActions={true}
                  />
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Bottom pagination */}
          <div className="p-4 border-t flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToPrevPage} 
                    disabled={page <= 1}
                    className="flex items-center gap-1"
                  >
                    Previous
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 py-1 rounded bg-muted min-w-[40px] text-center">{page}</span>
                </PaginationItem>
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToNextPage} 
                    disabled={!hasMore}
                    className="flex items-center gap-1"
                  >
                    Next
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogCollection;
