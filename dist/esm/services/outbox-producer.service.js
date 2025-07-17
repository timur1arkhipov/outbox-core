var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, Inject, Optional, HttpStatus, } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { OUTBOX_CONFIG, EXTERNAL_KAFKA_PRODUCER_TOKEN } from '../constants';
import { OutboxError, OutboxErrorCode } from '../types/result.type';
let OutboxProducerService = class OutboxProducerService {
    constructor(config, externalProducer) {
        this.config = config;
        this.externalProducer = externalProducer;
        if (this.externalProducer) {
            this.producer = this.externalProducer;
        }
        else if (this.config.kafka?.brokers && this.config.kafka?.clientId) {
            const kafkaConfig = {
                clientId: this.config.kafka.clientId,
                brokers: this.config.kafka.brokers,
            };
            if (this.config.kafka.sasl?.mechanism) {
                kafkaConfig.sasl = {
                    mechanism: this.config.kafka.sasl.mechanism,
                    username: this.config.kafka.sasl.username,
                    password: this.config.kafka.sasl.password,
                };
            }
            if (this.config.kafka.ssl) {
                kafkaConfig.ssl = this.config.kafka.ssl;
            }
            this.kafka = new Kafka(kafkaConfig);
            this.producer = this.kafka.producer();
        }
        else {
            throw new Error('No Kafka configuration or external producer provided.');
        }
    }
    async onModuleInit() {
        if (this.kafka) {
            try {
                await this.producer.connect();
            }
            catch (error) {
                throw error;
            }
        }
    }
    async onModuleDestroy() {
        if (this.kafka) {
            await this.producer.disconnect();
        }
    }
    async send(options) {
        try {
            await this.producer.send({
                topic: options.topic,
                messages: options.messages,
            });
        }
        catch (error) {
            throw new OutboxError(HttpStatus.INTERNAL_SERVER_ERROR, OutboxErrorCode.KAFKA_ERROR, 'Ошибка при отправке сообщений в Kafka', error instanceof Error ? error.stack : undefined, error);
        }
    }
};
OutboxProducerService = __decorate([
    Injectable(),
    __param(0, Inject(OUTBOX_CONFIG)),
    __param(1, Optional()),
    __param(1, Inject(EXTERNAL_KAFKA_PRODUCER_TOKEN)),
    __metadata("design:paramtypes", [Object, Object])
], OutboxProducerService);
export { OutboxProducerService };
//# sourceMappingURL=outbox-producer.service.js.map