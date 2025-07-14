import { ModuleMetadata } from '@nestjs/common';
export interface DatabaseConfig {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    schema?: string;
    tableName?: string;
}
export interface SaslConfig {
    mechanism: string;
    username: string;
    password: string;
}
export interface SslConfig {
    rejectUnauthorized?: boolean;
    ca?: string;
    key?: string;
    cert?: string;
    passphrase?: string;
}
export interface KafkaConfig {
    brokers?: string[];
    topic: string;
    clientId?: string;
    sasl?: SaslConfig;
    ssl?: SslConfig;
}
export interface ProcessingConfig {
    chunkSize: number;
    maxRetries: number;
    retryDelayMs: number;
    processingTimeoutMinutes: number;
}
export interface OutboxConfig {
    database?: DatabaseConfig;
    kafka?: KafkaConfig;
    processing: ProcessingConfig;
    sequelizeToken?: string | symbol;
    kafkaProducerToken?: string | symbol;
}
export interface OutboxModuleAsyncOptions {
    imports?: ModuleMetadata['imports'];
    inject?: any[];
    useFactory: (...args: any[]) => Promise<Partial<OutboxConfig>> | Partial<OutboxConfig>;
}
//# sourceMappingURL=outbox-config.interface.d.ts.map