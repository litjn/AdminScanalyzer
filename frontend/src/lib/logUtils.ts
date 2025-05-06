
import { LogEntry, RawLogEntry, LogFilter } from "@/types/logs";

export const transformLog = (log: RawLogEntry): LogEntry => {
  return {
    ...log,
    id: log._id || log.id || `log-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(log.timestamp),
  };
};

export const formatDate = (date: Date): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const truncateMessage = (message: string[], maxLength: number = 100): string => {
  const fullMessage = message.join(' ');
  if (fullMessage.length <= maxLength) return fullMessage;
  return `${fullMessage.substring(0, maxLength)}...`;
};

export const classificationColor = (classification?: string | null): string => {
  switch (classification) {
    case 'normal':
      return 'green';
    case 'suspicious':
      return 'yellow';
    case 'anomaly':
      return 'orange';
    case 'critical':
      return 'red';
    default:
      return 'gray';
  }
};

// Export the levelColor function so it can be used in other components
export const levelColor = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'information':
    case 'info':
      return 'blue';
    case 'warning':
      return 'yellow';
    case 'error':
      return 'red';
    case 'critical':
      return 'red';
    default:
      return 'gray';
  }
};

export const filterLogs = (logs: LogEntry[], filters: LogFilter): LogEntry[] => {
  return logs.filter(log => {
    // Filter by search text
    if (filters.searchText) {
      const searchText = filters.searchText.toLowerCase();
      const messageText = log.message.join(' ').toLowerCase();
      if (!messageText.includes(searchText) && 
          !log.provider.toLowerCase().includes(searchText) &&
          !log.channel.toLowerCase().includes(searchText) &&
          !log.event_host.toLowerCase().includes(searchText)) {
        return false;
      }
    }
    
    // Filter by level
    if (filters.level && filters.level !== 'all') {
      if (log.level !== filters.level) return false;
    }
    
    // Filter by channel - updated to handle "all" value
    if (filters.channel && filters.channel !== 'all') {
      if (log.channel !== filters.channel) return false;
    }
    
    // Filter by classification
    if (filters.classification && filters.classification !== 'all') {
      // Proper type handling for classification comparison
      const classification = filters.classification as string;
      if (classification !== 'all' && log.ai_classification !== classification) {
        return false;
      }
    }
    
    // Filter by start date
    if (filters.startDate && log.timestamp < filters.startDate) return false;
    
    // Filter by end date
    if (filters.endDate && log.timestamp > filters.endDate) return false;
    
    // Filter by alert status
    if (filters.alert !== undefined && log.alert !== filters.alert) return false;
    
    // Filter by trigger status
    if (filters.trigger !== undefined && log.trigger !== filters.trigger) return false;
    
    return true;
  });
};
