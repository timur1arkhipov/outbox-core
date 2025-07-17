import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Message } from 'kafkajs';
import type { Producer } from 'kafkajs';
import type { OutboxConfig } from '../interfaces/outbox-config.interface';
import { Transaction } from 'sequelize';
export interface KafkaSendOptions {
    topic: string;
    messages: Message[];
    transaction?: Transaction;
}
export declare class OutboxProducerService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly externalProducer?;
    private kafka?;
    private producer;
    constructor(config: OutboxConfig, externalProducer?: Producer);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    send(options: KafkaSendOptions): Promise<void>;
}
//# sourceMappingURL=outbox-producer.service.d.ts.map