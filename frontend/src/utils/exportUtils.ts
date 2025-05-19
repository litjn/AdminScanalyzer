
import { LogEntry } from "@/types/logs";

export const exportLogsToCSV = (logs: LogEntry[], fileName?: string) => {
  try {
    if (!logs || logs.length === 0) {
      return {
        success: false,
        message: "No logs to export."
      };
    }
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "ID,Timestamp,Level,Channel,Event ID,Provider,Message,Alert,Trigger,Classification\n";
    
    // Add log data - with better timestamp handling
    logs.forEach(log => {
      const timestamp = typeof log.timestamp === 'string' 
        ? log.timestamp 
        : (log.timestamp instanceof Date ? log.timestamp.toISOString() : new Date(log.timestamp).toISOString());
      
      // Handle cases where message might not be an array
      const messageText = Array.isArray(log.message) 
        ? log.message.join(' ').replace(/"/g, '""') 
        : String(log.message).replace(/"/g, '""');
        
      const row = [
        log.id,
        timestamp,
        log.level,
        log.channel,
        log.event_id,
        log.provider,
        `"${messageText}"`,
        log.alert ? 'Yes' : 'No',
        log.trigger ? 'Yes' : 'No',
        log.ai_classification || 'Unclassified'
      ];
      csvContent += row.join(',') + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName || `scanalyzer_logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    
    // Download CSV file
    link.click();
    document.body.removeChild(link);
    
    return {
      success: true,
      message: `${logs.length} logs exported to CSV.`
    };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      message: "Failed to export logs. Please try again.",
      error
    };
  }
};
