// Types for AI Phone Screen application

export interface Call {
  id: string;
  candidateName: string;
  phoneNumber: string;
  status: 'pending' | 'initiating' | 'in-progress' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  transcript?: string;
  error?: string;
  vapiCallId?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN';
  message: string;
}
