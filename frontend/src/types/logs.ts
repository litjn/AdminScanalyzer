
export interface RawLogEntry {
  _id?: string;
  id?: string;
  agent_id: string;
  record_id: number;
  timestamp: string;
  event_id: number;
  channel: string;
  provider: string;
  event_host: string;
  user_sid?: string;
  level: string;
  level_code: number;
  message: string[];
  alert?: boolean;
  ai_classification?: "normal" | "suspicious" | "anomaly" | "critical" | null;
  trigger?: boolean;
}

export interface LogEntry extends Omit<RawLogEntry, 'timestamp'> {
  timestamp: Date;
  id: string;
}

export type LogClassification = "normal" | "suspicious" | "anomaly" | "critical" | "all";

export interface LogFilter {
  id?: string;
  agent_id?: string;
  event_id?: number;
  channel?: string;
  provider?: string;
  event_host?: string;
  level?: string;
  date?: Date;
  classification?: LogClassification | undefined;
  alert?: boolean;
  trigger?: boolean;
  searchText?: string;
}
