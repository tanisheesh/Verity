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
      const log = this.formatLog('info', message, data);
      console.log(JSON.stringify(log));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      const log = this.formatLog('warn', message, data);
      console.warn(JSON.stringify(log));
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      const log = this.formatLog('error', message, {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      });
      console.error(JSON.stringify(log));
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      const log = this.formatLog('debug', message, data);
      console.debug(JSON.stringify(log));
    }
  }
}

export const logger = new Logger();
