export declare class OutboxError extends Error {
    readonly httpCode: number;
    readonly errorCode: string;
    readonly stack?: string | undefined;
    readonly externalError?: any | undefined;
    constructor(httpCode: number, errorCode: string, message: string, stack?: string | undefined, externalError?: any | undefined);
    throwAsHttpException(context?: string): never;
}
export interface WithError<T> {
    data: T | null;
    _error: OutboxError | null;
}
export type PromiseWithError<T> = Promise<WithError<T>>;
export declare enum OutboxErrorCode {
    DATABASE_ERROR = "DB_ERROR",
    VALIDATION_ERROR = "VLD_ERROR",
    KAFKA_ERROR = "KAFKA_ERROR",
    PROCESSING_ERROR = "PROC_ERROR"
}
//# sourceMappingURL=result.type.d.ts.map