export class OutboxError extends Error {
  constructor(
    public readonly httpCode: number,
    public readonly errorCode: string,
    message: string,
    public readonly stack?: string,
    public readonly externalError?: any,
  ) {
    super(message);
    this.name = 'OutboxError';
  }

  throwAsHttpException(context?: string): never {
    const errorMessage = context ? `${context}: ${this.message}` : this.message;
    throw new Error(errorMessage);
  }
}

export interface WithError<T> {
  data: T | null;
  _error: OutboxError | null;
}

export type PromiseWithError<T> = Promise<WithError<T>>;

export enum OutboxErrorCode {
  DATABASE_ERROR = 'DB_ERROR',
  VALIDATION_ERROR = 'VLD_ERROR',
  KAFKA_ERROR = 'KAFKA_ERROR',
  PROCESSING_ERROR = 'PROC_ERROR',
}
