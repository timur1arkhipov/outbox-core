import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
  Optional,
  HttpStatus,
} from '@nestjs/common';
import { Kafka, Message } from 'kafkajs';
import type { Producer } from 'kafkajs';
import { OUTBOX_CONFIG, EXTERNAL_KAFKA_PRODUCER_TOKEN } from '../constants';
import type { OutboxConfig } from '../interfaces/outbox-config.interface';
import { OutboxError, OutboxErrorCode } from '../types/result.type';
import { Transaction } from 'sequelize';

export interface KafkaSendOptions {
  topic: string;
  messages: Message[];
  transaction?: Transaction;
}

@Injectable()
export class OutboxProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka?: Kafka;
  private producer: Producer;

  constructor(
    @Inject(OUTBOX_CONFIG) private readonly config: OutboxConfig,
    @Optional()
    @Inject(EXTERNAL_KAFKA_PRODUCER_TOKEN)
    private readonly externalProducer?: Producer,
  ) {
    if (this.externalProducer) {
      this.producer = this.externalProducer;
    } else if (this.config.kafka?.brokers && this.config.kafka?.clientId) {
      const kafkaConfig: any = {
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
    } else {
      throw new Error('No Kafka configuration or external producer provided.');
    }
  }

  async onModuleInit() {
    if (this.kafka) {
      try {
        await this.producer.connect();
      } catch (error) {
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    if (this.kafka) {
      await this.producer.disconnect();
    }
  }

  async send(options: KafkaSendOptions): Promise<void> {
    try {
      await this.producer.send({
        topic: options.topic,
        messages: options.messages,
      });
    } catch (error) {
      throw new OutboxError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        OutboxErrorCode.KAFKA_ERROR,
        'Ошибка при отправке сообщений в Kafka',
        error instanceof Error ? error.stack : undefined,
        error,
      );
    }
  }
}
