import { DynamicModule, Global, Module } from '@nestjs/common';
import { Reflector, APP_INTERCEPTOR } from '@nestjs/core';
import { OutboxService } from './services/outbox.service';
import { OutboxDbService } from './services/outbox.db.service';
import { OutboxProducerService } from './services/outbox-producer.service';
import { OutboxMigrationService } from './services/outbox-migration.service';
import { OutboxInitService } from './services/outbox-init.service';
import { OutboxInterceptor } from './interceptors/outbox.interceptor';
import { OutboxTelemetryService } from './services/outbox-telemetry.service';
import { TelemetryInterceptor } from './interceptors/telemetry.interceptor';
import {
  OutboxConfig,
  DatabaseConfig,
  KafkaConfig,
  OutboxModuleAsyncOptions,
} from './interfaces/outbox-config.interface';
import {
  DEFAULT_OUTBOX_CONFIG,
  OUTBOX_CONFIG,
  EXTERNAL_SEQUELIZE_TOKEN,
  EXTERNAL_KAFKA_PRODUCER_TOKEN,
} from './constants';

@Global()
@Module({})
export class OutboxModule {
  static forRoot(config: Partial<OutboxConfig>): DynamicModule {
    const mergedConfig = this.mergeWithDefaults(config);
    const providers: any[] = [
      {
        provide: OUTBOX_CONFIG,
        useValue: mergedConfig,
      },
      Reflector,
      OutboxDbService,
      OutboxProducerService,
      OutboxService,
      OutboxMigrationService,
      OutboxInitService,
      OutboxTelemetryService,
      OutboxInterceptor,
      TelemetryInterceptor,
      {
        provide: APP_INTERCEPTOR,
        useClass: OutboxInterceptor,
      },
    ];

    if (config.sequelizeToken) {
      providers.push({
        provide: EXTERNAL_SEQUELIZE_TOKEN,
        useExisting: config.sequelizeToken,
      });
    }

    if (config.kafkaProducerToken) {
      providers.push({
        provide: EXTERNAL_KAFKA_PRODUCER_TOKEN,
        useExisting: config.kafkaProducerToken,
      });
    }

    return {
      module: OutboxModule,
      providers,
      exports: [
        OutboxService,
        OutboxDbService,
        OutboxProducerService,
        OutboxMigrationService,
        OutboxInitService,
        OutboxTelemetryService,
        OutboxInterceptor,
        TelemetryInterceptor,
        OUTBOX_CONFIG,
      ],
    };
  }

  static forRootAsync(options: OutboxModuleAsyncOptions): DynamicModule {
    const asyncProviders = [
      {
        provide: OUTBOX_CONFIG,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return this.mergeWithDefaults(config);
        },
        inject: options.inject || [],
      },
      Reflector,
      OutboxDbService,
      OutboxProducerService,
      OutboxService,
      OutboxMigrationService,
      OutboxInitService,
      OutboxTelemetryService,
      OutboxInterceptor,
      TelemetryInterceptor,
      {
        provide: APP_INTERCEPTOR,
        useClass: OutboxInterceptor,
      },
    ];

    return {
      module: OutboxModule,
      imports: options.imports || [],
      providers: asyncProviders,
      exports: [
        OutboxService,
        OutboxDbService,
        OutboxProducerService,
        OutboxMigrationService,
        OutboxInitService,
        OutboxTelemetryService,
        OutboxInterceptor,
        TelemetryInterceptor,
        OUTBOX_CONFIG,
      ],
    };
  }

  private static mergeWithDefaults(
    config: Partial<OutboxConfig>,
  ): OutboxConfig {
    console.log('Input config:', JSON.stringify(config, null, 2));
    console.log('DEFAULT_OUTBOX_CONFIG:', JSON.stringify(DEFAULT_OUTBOX_CONFIG, null, 2));
    
    const result: Partial<OutboxConfig> = {
      processing: {
        ...DEFAULT_OUTBOX_CONFIG.processing,
        ...config.processing,
      },
      telemetry: {
        ...DEFAULT_OUTBOX_CONFIG.telemetry,
        ...config.telemetry,
      },
    };

    // Only create database config if not using external Sequelize token
    if (config.sequelizeToken) {
      console.log('🔧 Using external Sequelize token path');
      result.sequelizeToken = config.sequelizeToken;
      // Keep minimal database config for schema/table name only
      result.database = {
        schema: config.database?.schema || DEFAULT_OUTBOX_CONFIG.database!.schema,
        tableName: config.database?.tableName || DEFAULT_OUTBOX_CONFIG.database!.tableName,
      } as DatabaseConfig;
    } else {
      console.log('🔧 Using internal database config path');
      if (!config.database) {
        throw new Error('Either database config or sequelizeToken must be provided');
      }
      result.database = {
        ...DEFAULT_OUTBOX_CONFIG.database,
        ...config.database,
      } as DatabaseConfig;
    }

    // Only create kafka config if not using external producer token
    if (config.kafkaProducerToken) {
      result.kafkaProducerToken = config.kafkaProducerToken;
      // Keep minimal kafka config for topic name only
      result.kafka = {
        topic: config.kafka?.topic || DEFAULT_OUTBOX_CONFIG.kafka!.topic,
      } as KafkaConfig;
    } else {
      if (!config.kafka) {
        throw new Error('Either kafka config or kafkaProducerToken must be provided');
      }
      result.kafka = {
        ...DEFAULT_OUTBOX_CONFIG.kafka,
        ...config.kafka,
      } as KafkaConfig;
    }

    console.log('Final merged config:', JSON.stringify(result, null, 2));
    return result as OutboxConfig;
  }
}
