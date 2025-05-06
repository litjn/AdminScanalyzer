
import { subHours, subMinutes, subSeconds, format } from 'date-fns';

// Types for our log data
export type LogSeverity = 'normal' | 'suspicious' | 'anomaly' | 'critical';

export interface Log {
  id: string;
  timestamp: string;
  device_name: string;
  ip_address: string;
  opcode: string;
  message: string;
  severity: LogSeverity;
}

// Generate a random date within the last 24 hours
const randomRecentDate = () => {
  const now = new Date();
  const hourOffset = Math.floor(Math.random() * 24);
  const minuteOffset = Math.floor(Math.random() * 60);
  const secondOffset = Math.floor(Math.random() * 60);
  
  return subSeconds(subMinutes(subHours(now, hourOffset), minuteOffset), secondOffset);
};

// Format date for display
export const formatDate = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm:ss');
};

// Generate mock log data
export const generateMockLogs = (count: number = 20): Log[] => {
  const severities: LogSeverity[] = ['normal', 'suspicious', 'anomaly', 'critical'];
  const opcodes = ['READ', 'WRITE', 'DELETE', 'UPDATE', 'CONNECT', 'DISCONNECT', 'AUTH'];
  const deviceNames = ['server-001', 'workstation-045', 'router-edge-1', 'firewall-main', 'db-cluster-3'];
  const ipRanges = ['192.168.1', '10.0.0', '172.16.0', '8.8.8'];
  
  const messages = [
    'User authentication successful',
    'Failed login attempt',
    'Database connection established',
    'File access denied',
    'System shutdown initiated',
    'Unusual traffic pattern detected',
    'Configuration file modified',
    'Service stopped unexpectedly',
    'Memory usage exceeded threshold',
    'Port scan detected',
    'Backup process completed'
  ];

  return Array.from({ length: count }, (_, i) => {
    const timestamp = randomRecentDate();
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const ipBase = ipRanges[Math.floor(Math.random() * ipRanges.length)];
    const ipEnd = Math.floor(Math.random() * 255);
    
    return {
      id: `log-${Date.now()}-${i}`,
      timestamp: timestamp.toISOString(),
      device_name: deviceNames[Math.floor(Math.random() * deviceNames.length)],
      ip_address: `${ipBase}.${ipEnd}`,
      opcode: opcodes[Math.floor(Math.random() * opcodes.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      severity,
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Stream simulation
let streamCallbacks: ((log: Log) => void)[] = [];

export const simulateLogStream = (callback: (log: Log) => void) => {
  streamCallbacks.push(callback);
  return () => {
    streamCallbacks = streamCallbacks.filter(cb => cb !== callback);
  };
};

// For analytics
export const generateMockAnalytics = () => {
  return {
    totalLogs: 15783,
    todayLogs: 1247,
    alerts: {
      critical: 17,
      anomaly: 48,
      suspicious: 132,
      normal: 1050
    },
    recentTrends: [
      { time: '00:00', value: 42 },
      { time: '04:00', value: 28 },
      { time: '08:00', value: 76 },
      { time: '12:00', value: 118 },
      { time: '16:00', value: 92 },
      { time: '20:00', value: 60 },
      { time: '24:00', value: 49 }
    ]
  };
};

// Start the mock streamer if needed
let streamInterval: ReturnType<typeof setInterval> | null = null;

export const startMockStream = () => {
  if (streamInterval) return;
  
  streamInterval = setInterval(() => {
    if (streamCallbacks.length === 0) return;
    
    const log = generateMockLogs(1)[0];
    streamCallbacks.forEach(callback => callback(log));
  }, 2000);
  
  return () => {
    if (streamInterval) {
      clearInterval(streamInterval);
      streamInterval = null;
    }
  };
};

export const stopMockStream = () => {
  if (streamInterval) {
    clearInterval(streamInterval);
    streamInterval = null;
  }
};
