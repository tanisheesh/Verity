import { AnalysisReport } from './AnalysisReport';

export interface AnalyzerInput {
  text: string;
  mode?: 'single' | 'conversation';
  options?: {
    includeExplanations?: boolean;
    highlightText?: boolean;
  };
}

export interface AnalyzerOutput {
  success: boolean;
  data?: AnalysisReport;
  error?: ErrorDetails;
}

export type ErrorCode =
  | 'TEXT_TOO_SHORT'
  | 'TEXT_TOO_LONG'
  | 'INVALID_INPUT'
  | 'PARSING_ERROR'
  | 'ANALYSIS_FAILED'
  | 'INTERNAL_ERROR';

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: {
    field?: string;
    value?: any;
    constraint?: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetails;
  timestamp: string;
  requestId: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: ErrorDetails;
}
