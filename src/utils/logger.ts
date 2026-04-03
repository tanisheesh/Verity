type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data })
    };
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      this.formatLog('info', message, data);
      // In production, send to logging service
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      this.formatLog('warn', message, data);
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      this.formatLog('error', message, {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      });
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      this.formatLog('debug', message, data);
    }
  }
}

export const logger = new Logger();
