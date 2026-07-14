export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
    file?: string;
    method?: string;
    line?: number;
    stack?: string;
  };
}

export interface ErrorResponseProduction {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
  };
}

export interface DatabaseError extends Error {
  code?: string;
  details?: any;
  file?: string;
  method?: string;
  line?: number;
  stack?: string;
}

export interface HttpErrorResponse {
  message: string;
  error?: string;
  details?: any;
  file?: string;
  method?: string;
  line?: number;
  stack?: string;
}
