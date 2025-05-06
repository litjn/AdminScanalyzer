import { useEffect, useState } from 'react';
import api from '../lib/axios';

export interface RawLogEntry {
  id: string;
  agent_id: string;
  record_id: number;
  timestamp: string;
  event_id: number;
  channel: string;
  provider: string;
  event_host: string;
  user_sid: string;
  level: string;
  level_code: number;
  message: string[];
  alert: boolean;
  ai_classification: string | null;
  trigger: boolean;
}

export interface LogEntry {
  _id: string;
  record_id: number;
  timestamp: string;
  computer: string;
  channel: string;
  source_name: string;
  msg: string[];
  level: string;
  alert: boolean;
  trigger: boolean;
}

function transformLog(raw: RawLogEntry): LogEntry {
  return {
    _id: raw.id,
    record_id: raw.record_id,
    timestamp: raw.timestamp,
    computer: raw.event_host,
    channel: raw.channel,
    source_name: raw.provider,
    msg: raw.message,
    level: raw.level,
    alert: raw.alert,
    trigger: raw.trigger,
  };
}

export function useLogs(filters?: {
  device_id?: string;
  channel?: string;
  level?: string;
}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let queryParams = '';

    if (filters) {
      const params = new URLSearchParams();
      if (filters.device_id && filters.device_id !== 'all') params.append('device_id', filters.device_id);
      if (filters.channel && filters.channel !== 'all') params.append('channel', filters.channel);
      if (filters.level && filters.level !== 'all') params.append('level', filters.level);
      queryParams = `?${params.toString()}`;
    }

    api.get<RawLogEntry[]>(`/logs${queryParams}`)
      .then(response => {
        const logsData = Array.isArray(response.data) ? response.data.map(transformLog) : [];
        setLogs(logsData);
        setError(null);
      })
      .catch(error => {
        console.error('Failed to fetch logs:', error);
        setLogs([]);
        setError(error);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  return { logs, loading, error };
}

export const updateLog = async (id: string, updateData: { [key: string]: any }) => {
  try {
    const response = await api.put(`/logs/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update log ${id}:`, error);
    throw error;
  }
};

export function useLogStream() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startStreaming = () => {
    setIsStreaming(true);

    api.get<RawLogEntry[]>('/logs')
      .then(response => {
        const logsData = Array.isArray(response.data) ? response.data.map(transformLog).slice(0, 100) : [];
        setLogs(logsData);
        setError(null);
      })
      .catch(error => {
        console.error('Failed to fetch initial logs:', error);
        setLogs([]);
        setError(error);
      });

    const intervalId = setInterval(() => {
      if (!isStreaming) return;

      api.get<RawLogEntry[]>('/logs')
        .then(response => {
          const newRaw = Array.isArray(response.data) ? response.data : [];
          const newLogs = newRaw.map(transformLog);

          setLogs(prev => {
            const existingIds = new Set(prev.map(log => log._id));
            const filteredNew = newLogs.filter(log => !existingIds.has(log._id));
            return [...filteredNew, ...prev].slice(0, 100);
          });
        })
        .catch(error => {
          console.error('Stream fetch error:', error);
          setError(error);
        });
    }, 2000);

    return () => {
      clearInterval(intervalId);
      setIsStreaming(false);
    };
  };

  const stopStreaming = () => {
    setIsStreaming(false);
  };

  return { logs, isStreaming, startStreaming, stopStreaming, error };
}
