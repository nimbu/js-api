type EntityError = {
  resource: string;
  code: string;
  field: string;
  message: string;
};

export class ApiError extends Error {
  status: number;
  statusText: string;
  errors?: EntityError[];

  constructor(status: number, statusText: string, errors?: EntityError[]) {
    super(`${statusText} (${status})`);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }

    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.errors = errors;
  }
}
