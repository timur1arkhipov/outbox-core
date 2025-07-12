export { OutboxModule } from './outbox.module';
export { OutboxService } from './services/outbox.service';
export { OutboxDbService } from './services/outbox.db.service';
export { OutboxProducerService } from './services/outbox-producer.service';
export { OutboxMigrationService } from './services/outbox-migration.service';
export { OutboxTelemetryService } from './services/outbox-telemetry.service';
export { OutboxInterceptor } from './interceptors/outbox.interceptor';
export { TelemetryInterceptor } from './interceptors/telemetry.interceptor';

export { OutboxEvent } from './decorators/outbox-event.decorator';
export { 
  WithTrace, 
  WithMetrics, 
  WithTelemetry, 
  OutboxOperation
} from './decorators/telemetry.decorator';

export type {
  TraceConfig,
  MetricsConfig 
} from './decorators/telemetry.decorator';

export type {
  OutboxConfig,
  DatabaseConfig,
  KafkaConfig,
  ProcessingConfig,
  TelemetryConfig,
} from './interfaces/outbox-config.interface';
export type {
  OutboxEventData,
  OutboxEventMessage,
  OutboxEventMessagePayload,
} from './interfaces/outbox-event.interface';

export { OutboxEventDto, OutboxEventStatusEnum } from './dto/outbox-event.dto';
export { OutboxEventFiltersDto } from './dto/outbox-event-filters.dto';
export { OutboxEventMsgDto } from './dto/outbox-event-msg.dto';
export { UpdateOutboxEventDto } from './dto/update-outbox-event.dto';
export { ChunkProcessingDto } from './dto/chunk-processing.dto';
export { CleanupResultDto } from './dto/cleanup-result.dto';

export {
  OUTBOX_CONFIG,
  EXTERNAL_SEQUELIZE_TOKEN,
  EXTERNAL_KAFKA_PRODUCER_TOKEN,
  DEFAULT_OUTBOX_CONFIG,
} from './constants';

export { OutboxError, OutboxErrorCode } from './types/result.type';

export type {
  PromiseWithError,
  WithError,
} from './types/result.type';
