var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OutboxModule_1;
import { Global, Module } from '@nestjs/common';
import { Reflector, APP_INTERCEPTOR } from '@nestjs/core';
import { OutboxService } from './services/outbox.service';
import { OutboxDbService } from './services/outbox.db.service';
import { OutboxProducerService } from './services/outbox-producer.service';
import { OutboxMigrationService } from './services/outbox-migration.service';
import { OutboxInitService } from './services/outbox-init.service';
import { OutboxInterceptor } from './interceptors/outbox.interceptor';
import { DEFAULT_OUTBOX_CONFIG, OUTBOX_CONFIG, EXTERNAL_SEQUELIZE_TOKEN, EXTERNAL_KAFKA_PRODUCER_TOKEN, } from './constants';
let OutboxModule = OutboxModule_1 = class OutboxModule {
    static forRoot(config) {
        const mergedConfig = this.mergeWithDefaults(config);
        const providers = [
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
            OutboxInterceptor,
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
            module: OutboxModule_1,
            providers,
            exports: [
                OutboxService,
                OutboxDbService,
                OutboxProducerService,
                OutboxMigrationService,
                OutboxInitService,
                OutboxInterceptor,
                OUTBOX_CONFIG,
            ],
        };
    }
    static forRootAsync(options) {
        const asyncProviders = [
            {
                provide: OUTBOX_CONFIG,
                useFactory: async (...args) => {
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
            OutboxInterceptor,
            {
                provide: APP_INTERCEPTOR,
                useClass: OutboxInterceptor,
            },
        ];
        return {
            module: OutboxModule_1,
            imports: options.imports || [],
            providers: asyncProviders,
            exports: [
                OutboxService,
                OutboxDbService,
                OutboxProducerService,
                OutboxMigrationService,
                OutboxInitService,
                OutboxInterceptor,
                OUTBOX_CONFIG,
            ],
        };
    }
    static mergeWithDefaults(config) {
        const result = {
            defaultProcessing: {
                ...DEFAULT_OUTBOX_CONFIG.defaultProcessing,
                ...config.defaultProcessing,
            },
            topics: {
                ...DEFAULT_OUTBOX_CONFIG.topics,
                ...config.topics,
            },
        };
        if (config.sequelizeToken) {
            result.sequelizeToken = config.sequelizeToken;
            result.database = {
                schema: config.database?.schema || DEFAULT_OUTBOX_CONFIG.database.schema,
                tableName: config.database?.tableName || DEFAULT_OUTBOX_CONFIG.database.tableName,
            };
        }
        else {
            if (!config.database) {
                throw new Error('Either database config or sequelizeToken must be provided');
            }
            result.database = {
                ...DEFAULT_OUTBOX_CONFIG.database,
                ...config.database,
            };
        }
        if (config.kafkaProducerToken) {
            result.kafkaProducerToken = config.kafkaProducerToken;
            result.kafka = {
                brokers: config.kafka?.brokers || DEFAULT_OUTBOX_CONFIG.kafka.brokers,
                clientId: config.kafka?.clientId || DEFAULT_OUTBOX_CONFIG.kafka.clientId,
            };
        }
        else {
            if (!config.kafka) {
                throw new Error('Either kafka config or kafkaProducerToken must be provided');
            }
            result.kafka = {
                ...DEFAULT_OUTBOX_CONFIG.kafka,
                ...config.kafka,
            };
        }
        return result;
    }
};
OutboxModule = OutboxModule_1 = __decorate([
    Global(),
    Module({})
], OutboxModule);
export { OutboxModule };
//# sourceMappingURL=outbox.module.js.map