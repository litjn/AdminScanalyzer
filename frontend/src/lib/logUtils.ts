
import { LogEntry, RawLogEntry, LogFilter, LogClassification } from "@/types/logs";

export const transformLog = (log: RawLogEntry): LogEntry => {
  // Handle timestamp conversion safely
  let timestamp: Date;
  try {
    // Fix the instanceof check by ensuring log.timestamp is treated as a valid type for comparison
    timestamp = (typeof log.timestamp === 'object' && log.timestamp !== null) 
      ? log.timestamp as Date 
      : new Date(log.timestamp);
      
    // Check if the timestamp is valid
    if (isNaN(timestamp.getTime())) {
      console.warn(`Invalid timestamp: ${log.timestamp}, using current date`);
      timestamp = new Date();
    }
  } catch (error) {
    console.warn(`Error parsing timestamp: ${log.timestamp}, using current date`, error);
    timestamp = new Date();
  }

  return {
    ...log,
    id: log._id || log.id || `log-${Math.random().toString(36).substring(2, 9)}`,
    timestamp,
  };
};

export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const truncateMessage = (message: string[], maxLength: number = 100): string => {
  if (!Array.isArray(message)) {
    return 'No message';
  }
  const fullMessage = message.join(' ');
  if (fullMessage.length <= maxLength) return fullMessage;
  return `${fullMessage.substring(0, maxLength)}...`;
};

export const classificationColor = (classification?: string | null): string => {
  switch (classification?.toLowerCase()) {
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
    
    // Fix: Correct handling for classification filtering
    if (filters.classification && filters.classification !== 'all') {
      // Use type assertion to fix the TypeScript error
      if (log.ai_classification !== filters.classification) {
        return false;
      }
    }
    
    // Filter by date (single date filter)
    if (filters.date) {
      const logDate = new Date(log.timestamp);
      const filterDate = new Date(filters.date);
      
      if (logDate.getFullYear() !== filterDate.getFullYear() || 
          logDate.getMonth() !== filterDate.getMonth() || 
          logDate.getDate() !== filterDate.getDate()) {
        return false;
      }
    }
    
    // Filter by alert status
    if (filters.alert !== undefined && log.alert !== filters.alert) return false;
    
    // Filter by trigger status
    if (filters.trigger !== undefined && log.trigger !== filters.trigger) return false;
    
    return true;
  });
};
