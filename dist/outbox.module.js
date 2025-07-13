"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OutboxModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const outbox_service_1 = require("./services/outbox.service");
const outbox_db_service_1 = require("./services/outbox.db.service");
const outbox_producer_service_1 = require("./services/outbox-producer.service");
const outbox_migration_service_1 = require("./services/outbox-migration.service");
const outbox_init_service_1 = require("./services/outbox-init.service");
const outbox_interceptor_1 = require("./interceptors/outbox.interceptor");
const outbox_telemetry_service_1 = require("./services/outbox-telemetry.service");
const telemetry_interceptor_1 = require("./interceptors/telemetry.interceptor");
const constants_1 = require("./constants");
let OutboxModule = OutboxModule_1 = class OutboxModule {
    static forRoot(config) {
        const mergedConfig = this.mergeWithDefaults(config);
        const providers = [
            {
                provide: constants_1.OUTBOX_CONFIG,
                useValue: mergedConfig,
            },
            core_1.Reflector,
            outbox_db_service_1.OutboxDbService,
            outbox_producer_service_1.OutboxProducerService,
            outbox_service_1.OutboxService,
            outbox_migration_service_1.OutboxMigrationService,
            outbox_init_service_1.OutboxInitService,
            outbox_telemetry_service_1.OutboxTelemetryService,
            outbox_interceptor_1.OutboxInterceptor,
            telemetry_interceptor_1.TelemetryInterceptor,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: outbox_interceptor_1.OutboxInterceptor,
            },
        ];
        if (config.sequelizeToken) {
            providers.push({
                provide: constants_1.EXTERNAL_SEQUELIZE_TOKEN,
                useExisting: config.sequelizeToken,
            });
        }
        if (config.kafkaProducerToken) {
            providers.push({
                provide: constants_1.EXTERNAL_KAFKA_PRODUCER_TOKEN,
                useExisting: config.kafkaProducerToken,
            });
        }
        return {
            module: OutboxModule_1,
            providers,
            exports: [
                outbox_service_1.OutboxService,
                outbox_db_service_1.OutboxDbService,
                outbox_producer_service_1.OutboxProducerService,
                outbox_migration_service_1.OutboxMigrationService,
                outbox_init_service_1.OutboxInitService,
                outbox_telemetry_service_1.OutboxTelemetryService,
                outbox_interceptor_1.OutboxInterceptor,
                telemetry_interceptor_1.TelemetryInterceptor,
                constants_1.OUTBOX_CONFIG,
            ],
        };
    }
    static forRootAsync(options) {
        const asyncProviders = [
            {
                provide: constants_1.OUTBOX_CONFIG,
                useFactory: async (...args) => {
                    const config = await options.useFactory(...args);
                    return this.mergeWithDefaults(config);
                },
                inject: options.inject || [],
            },
            core_1.Reflector,
            outbox_db_service_1.OutboxDbService,
            outbox_producer_service_1.OutboxProducerService,
            outbox_service_1.OutboxService,
            outbox_migration_service_1.OutboxMigrationService,
            outbox_init_service_1.OutboxInitService,
            outbox_telemetry_service_1.OutboxTelemetryService,
            outbox_interceptor_1.OutboxInterceptor,
            telemetry_interceptor_1.TelemetryInterceptor,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: outbox_interceptor_1.OutboxInterceptor,
            },
        ];
        return {
            module: OutboxModule_1,
            imports: options.imports || [],
            providers: asyncProviders,
            exports: [
                outbox_service_1.OutboxService,
                outbox_db_service_1.OutboxDbService,
                outbox_producer_service_1.OutboxProducerService,
                outbox_migration_service_1.OutboxMigrationService,
                outbox_init_service_1.OutboxInitService,
                outbox_telemetry_service_1.OutboxTelemetryService,
                outbox_interceptor_1.OutboxInterceptor,
                telemetry_interceptor_1.TelemetryInterceptor,
                constants_1.OUTBOX_CONFIG,
            ],
        };
    }
    static mergeWithDefaults(config) {
        console.log('Input config:', JSON.stringify(config, null, 2));
        console.log('DEFAULT_OUTBOX_CONFIG:', JSON.stringify(constants_1.DEFAULT_OUTBOX_CONFIG, null, 2));
        const result = {
            processing: {
                ...constants_1.DEFAULT_OUTBOX_CONFIG.processing,
                ...config.processing,
            },
            telemetry: {
                ...constants_1.DEFAULT_OUTBOX_CONFIG.telemetry,
                ...config.telemetry,
            },
        };
        // Only create database config if not using external Sequelize token
        if (config.sequelizeToken) {
            console.log('🔧 Using external Sequelize token path');
            result.sequelizeToken = config.sequelizeToken;
            // Keep minimal database config for schema/table name only
            result.database = {
                schema: config.database?.schema || constants_1.DEFAULT_OUTBOX_CONFIG.database.schema,
                tableName: config.database?.tableName || constants_1.DEFAULT_OUTBOX_CONFIG.database.tableName,
            };
        }
        else {
            console.log('🔧 Using internal database config path');
            if (!config.database) {
                throw new Error('Either database config or sequelizeToken must be provided');
            }
            result.database = {
                ...constants_1.DEFAULT_OUTBOX_CONFIG.database,
                ...config.database,
            };
        }
        // Only create kafka config if not using external producer token
        if (config.kafkaProducerToken) {
            result.kafkaProducerToken = config.kafkaProducerToken;
            // Keep minimal kafka config for topic name only
            result.kafka = {
                topic: config.kafka?.topic || constants_1.DEFAULT_OUTBOX_CONFIG.kafka.topic,
            };
        }
        else {
            if (!config.kafka) {
                throw new Error('Either kafka config or kafkaProducerToken must be provided');
            }
            result.kafka = {
                ...constants_1.DEFAULT_OUTBOX_CONFIG.kafka,
                ...config.kafka,
            };
        }
        console.log('Final merged config:', JSON.stringify(result, null, 2));
        return result;
    }
};
exports.OutboxModule = OutboxModule;
exports.OutboxModule = OutboxModule = OutboxModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], OutboxModule);
//# sourceMappingURL=outbox.module.js.map