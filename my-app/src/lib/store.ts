import { Call, LogEntry } from '@/types';

class CallStore {
  private calls: Call[] = [];
  private logs: LogEntry[] = [];

  addCall(candidateName: string, phoneNumber: string): Call {
    const call: Call = {
      id: `call-${Date.now()}`,
      candidateName,
      phoneNumber,
      status: 'pending',
      startTime: new Date().toISOString()
    };
    
    this.calls.push(call);
    this.log('INFO', `Call created: ${call.id} for ${candidateName}`);
    return call;
  }

  updateCall(id: string, updates: Partial<Call>): Call | undefined {
    const call = this.calls.find(c => c.id === id);
    if (!call) {
      this.log('ERROR', `Call not found: ${id}`);
      return undefined;
    }

    Object.assign(call, updates);
    this.log('INFO', `Call updated: ${id} - ${updates.status || 'status changed'}`);
    return call;
  }

  getAllCalls(): Call[] {
    return [...this.calls].reverse();
  }

  private log(level: LogEntry['level'], message: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    this.logs.push(entry);
    console.log(`[${level}] ${message}`);
  }

  getLogs(): LogEntry[] {
    return [...this.logs].reverse();
  }
}

export const store = new CallStore(); 