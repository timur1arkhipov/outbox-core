"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxErrorCode = exports.OutboxError = void 0;
class OutboxError extends Error {
    constructor(httpCode, errorCode, message, stack, externalError) {
        super(message);
        this.httpCode = httpCode;
        this.errorCode = errorCode;
        this.stack = stack;
        this.externalError = externalError;
        this.name = 'OutboxError';
    }
    throwAsHttpException(context) {
        const errorMessage = context ? `${context}: ${this.message}` : this.message;
        throw new Error(errorMessage);
    }
}
exports.OutboxError = OutboxError;
var OutboxErrorCode;
(function (OutboxErrorCode) {
    OutboxErrorCode["DATABASE_ERROR"] = "DB_ERROR";
    OutboxErrorCode["VALIDATION_ERROR"] = "VLD_ERROR";
    OutboxErrorCode["KAFKA_ERROR"] = "KAFKA_ERROR";
    OutboxErrorCode["PROCESSING_ERROR"] = "PROC_ERROR";
})(OutboxErrorCode || (exports.OutboxErrorCode = OutboxErrorCode = {}));
//# sourceMappingURL=result.type.js.map