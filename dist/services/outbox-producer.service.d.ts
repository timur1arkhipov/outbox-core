import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Producer, Message } from 'kafkajs';
import { OutboxConfig } from '../interfaces/outbox-config.interface';
export interface KafkaSendOptions {
    topic: string;
    messages: Message[];
    transaction?: any;
}
export declare class OutboxProducerService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly externalProducer?;
    private kafka?;
    private producer;
    constructor(config: OutboxConfig, externalProducer?: Producer | undefined);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    send(options: KafkaSendOptions): Promise<void>;
}
//# sourceMappingURL=outbox-producer.service.d.ts.map