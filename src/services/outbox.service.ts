import { Injectable, Inject, Optional } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { OutboxDbService } from './outbox.db.service';
import { OutboxEventFiltersDto } from '../dto/outbox-event-filters.dto';
import { OutboxEventDto, OutboxEventStatusEnum } from '../dto/outbox-event.dto';
import { UpdateOutboxEventDto } from '../dto/update-outbox-event.dto';
import { OutboxProducerService } from './outbox-producer.service';
import { OutboxTelemetryService } from './outbox-telemetry.service';
import {
  OutboxEventMsgDto,
  OutboxEventMsgPayload,
} from '../dto/outbox-event-msg.dto';
import { ChunkProcessingDto } from '../dto/chunk-processing.dto';
import { CleanupResultDto } from '../dto/cleanup-result.dto';
import {
  PromiseWithError,
  OutboxError,
  OutboxErrorCode,
} from '../types/result.type';
import { OUTBOX_CONFIG } from '../constants';
import { OutboxConfig } from '../interfaces/outbox-config.interface';
import { OutboxOperation } from '../decorators/telemetry.decorator';

@Injectable()
export class OutboxService {
  private readonly DEFAULT_CHUNK_SIZE = 100;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly PROCESSING_TIMEOUT_MINUTES = 5;

  constructor(
    private readonly dbService: OutboxDbService,
    private readonly kafkaProducer: OutboxProducerService,
    @Inject(OUTBOX_CONFIG) private readonly config: OutboxConfig,
    @Optional() private readonly telemetryService?: OutboxTelemetryService,
  ) {}

  public async receiveOutboxEventInfomodels(
    filters: OutboxEventFiltersDto,
    transaction?: Transaction,
  ): PromiseWithError<OutboxEventDto[]> {
    const outboxEvents = await this.dbService.selectOutboxEventsInfomodels(
      filters,
      transaction,
    );

    if (outboxEvents._error) {
      return {
        data: null,
        _error: outboxEvents._error,
      };
    }

    return outboxEvents;
  }

  public async selectBeforeOutboxEventsInfomodels(
    entity_uuids: string[],
    transaction?: Transaction,
  ): PromiseWithError<OutboxEventDto[]> {
    const outboxEvents =
      await this.dbService.selectBeforeOutboxEventsInfomodels(
        entity_uuids,
        transaction,
      );

    if (outboxEvents._error) {
      return {
        data: null,
        _error: outboxEvents._error,
      };
    }

    return outboxEvents;
  }

  public async updateOutboxEvents(
    uuid: string[],
    data: UpdateOutboxEventDto,
    transaction?: Transaction,
  ): PromiseWithError<void> {
    const actualOutboxEventModels = await this.receiveOutboxEventInfomodels(
      { uuid },
      transaction,
    );

    if (actualOutboxEventModels._error) {
      return {
        data: null,
        _error: actualOutboxEventModels._error,
      };
    }

    if (!actualOutboxEventModels.data?.length) {
      return {
        data: null,
        _error: new OutboxError(
          400,
          OutboxErrorCode.VALIDATION_ERROR,
          'Нет событий для обновления',
        ),
      };
    }

    const statusCheckError = this.checkStatus(actualOutboxEventModels.data, [
      OutboxEventStatusEnum.SENT,
    ]);
    if (statusCheckError) {
      return {
        data: null,
        _error: statusCheckError,
      };
    }

    const updatedOutboxEvents = await this.dbService.updateOutboxEvent(
      uuid,
      data,
      transaction,
    );
    if (updatedOutboxEvents._error) {
      return {
        data: null,
        _error: updatedOutboxEvents._error,
      };
    }

    return { data: null, _error: null };
  }

  @OutboxOperation('produce_message')
  public async produceMessage(
    payload: OutboxEventMsgDto[],
  ): PromiseWithError<void> {
    try {
      const topic = this.config.kafka?.topic || 'outbox-events';
      const startTime = Date.now();
      
      await this.kafkaProducer.send({
        topic,
        messages: payload.map((msg: OutboxEventMsgDto) => {
          return { value: JSON.stringify(msg), key: msg.uuid };
        }),
      });

      if (this.telemetryService) {
        const duration = Date.now() - startTime;
        this.telemetryService.recordKafkaSendDuration(duration, topic, payload.length);
        this.telemetryService.recordKafkaMessage(topic, true);
      }
    } catch (error) {
      if (this.telemetryService) {
        const topic = this.config.kafka?.topic || 'outbox-events';
        this.telemetryService.recordKafkaMessage(topic, false);
      }

      return {
        data: null,
        _error: new OutboxError(
          500,
          OutboxErrorCode.KAFKA_ERROR,
          'Ошибка при отправке сообщений в Kafka',
          error instanceof Error ? error.stack : undefined,
          error,
        ),
      };
    }

    return {
      data: null,
      _error: null,
    };
  }

  private checkStatus(
    outboxEvents: OutboxEventDto[],
    forbiddenStatuses: OutboxEventStatusEnum[],
  ): OutboxError | null {
    for (const event of outboxEvents) {
      if (forbiddenStatuses.includes(event.status)) {
        return new OutboxError(
          400,
          OutboxErrorCode.VALIDATION_ERROR,
          `Ошибка валидации: данное изменение невозможно для События ${event.uuid} в статусе ${event.status}`,
        );
      }
    }

    return null;
  }

  @OutboxOperation('send_chunks')
  public async sendOutboxEventsInChunks(
    chunkSize?: number,
  ): PromiseWithError<ChunkProcessingDto> {
    const actualChunkSize = chunkSize || this.DEFAULT_CHUNK_SIZE;
    let totalProcessed = 0;
    let successChunks = 0;
    let failedChunks = 0;

    await this.cleanupStuckEventsInt();
    const lockedEvents = await this.lockAndMarkEventsAsProcessing();

    if (lockedEvents._error) {
      return {
        data: null,
        _error: lockedEvents._error,
      };
    }

    if (!lockedEvents.data?.length) {
      return {
        data: { totalProcessed: 0, successChunks: 0, failedChunks: 0 },
        _error: null,
      };
    }

    const eventsByEntity = this.groupEventsByEntity(lockedEvents.data);

    const entityUUIDs = Array.from(eventsByEntity.keys());

    const beforeEvents =
      await this.selectBeforeOutboxEventsInfomodels(entityUUIDs);

    const chunks = this.createChunksFromGroupedEvents(
      eventsByEntity,
      actualChunkSize,
    );

    for (const chunk of chunks) {
      const result = await this.processEventChunk(
        chunk,
        beforeEvents.data ?? [],
      );

      if (result._error) {
        failedChunks++;
      } else {
        successChunks++;
      }

      totalProcessed += chunk.length;
    }

    return {
      data: { totalProcessed, successChunks, failedChunks },
      _error: null,
    };
  }

  private async processEventChunk(
    events: OutboxEventDto[],
    beforeEvents: OutboxEventDto[],
  ): PromiseWithError<void> {
    const eventsMsg = this.buildPayloadMsgForChunk(events, beforeEvents);

    if (!eventsMsg.length) {
      return { data: null, _error: null };
    }

    const sendResult = await this.sendChunkWithRetry(eventsMsg);

    await this.updateOutboxEvents(
      eventsMsg.map((e) => e.uuid),
      {
        status: sendResult._error
          ? OutboxEventStatusEnum.ERROR
          : OutboxEventStatusEnum.SENT,
      },
    );

    return sendResult;
  }

  private async sendChunkWithRetry(
    events: OutboxEventMsgDto[],
    attempt = 1,
  ): PromiseWithError<void> {
    const result = await this.produceMessage(events);

    if (result._error && attempt < this.MAX_RETRIES) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.RETRY_DELAY_MS * attempt),
      );
      return this.sendChunkWithRetry(events, attempt + 1);
    }

    return result;
  }

  private groupEventsByEntity(
    events: OutboxEventDto[],
  ): Map<string, OutboxEventDto[]> {
    const grouped = new Map<string, OutboxEventDto[]>();

    for (const event of events) {
      const entityUUID = event.entity_uuid;
      if (!grouped.has(entityUUID)) {
        grouped.set(entityUUID, []);
      }
      grouped.get(entityUUID)!.push(event);
    }

    for (const [, eventList] of grouped) {
      this.sortEventsByDate(eventList);
    }

    return grouped;
  }

  private createChunksFromGroupedEvents(
    eventsByEntity: Map<string, OutboxEventDto[]>,
    chunkSize: number,
  ): OutboxEventDto[][] {
    const chunks: OutboxEventDto[][] = [];
    let currentChunk: OutboxEventDto[] = [];

    for (const [, events] of eventsByEntity) {
      for (const event of events) {
        currentChunk.push(event);

        if (currentChunk.length >= chunkSize) {
          chunks.push([...currentChunk]);
          currentChunk = [];
        }
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private buildPayloadMsgForChunk(
    events: OutboxEventDto[],
    beforeEvents: OutboxEventDto[],
  ): OutboxEventMsgDto[] {
    const eventsMsg: OutboxEventMsgDto[] = [];
    const entityUUIDToBeforeEvents = new Map<string, OutboxEventDto>();

    for (const beforeEvent of beforeEvents) {
      entityUUIDToBeforeEvents.set(beforeEvent.entity_uuid, beforeEvent);
    }

    const groupedInChunk = new Map<string, OutboxEventDto[]>();
    for (const event of events) {
      const entityUUID = event.entity_uuid;
      if (!groupedInChunk.has(entityUUID)) {
        groupedInChunk.set(entityUUID, []);
      }
      groupedInChunk.get(entityUUID)!.push(event);
    }

    for (const [, eventList] of groupedInChunk) {
      this.sortEventsByDate(eventList);
    }

    for (const [entityUUID, entityEvents] of groupedInChunk) {
      entityEvents.forEach((event, index) => {
        let payload: OutboxEventMsgPayload;

        if (event.type === 'CREATED') {
          payload = { before: null, after: event.payload };
          eventsMsg.push({ ...event, payload });
          return;
        }

        if (index === 0) {
          const foundBeforeEvent = entityUUIDToBeforeEvents.get(entityUUID);
          payload = {
            before: foundBeforeEvent?.payload || null,
            after: event.payload,
          };
        } else {
          payload = {
            before: entityEvents[index - 1].payload,
            after: event.payload,
          };
        }

        eventsMsg.push({ ...event, payload });
      });
    }

    return eventsMsg;
  }

  private sortEventsByDate(events: OutboxEventDto[]): void {
    events.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }

  private async cleanupStuckEventsInt(): PromiseWithError<void> {
    await this.dbService.cleanupStuckEvents(
      this.PROCESSING_TIMEOUT_MINUTES,
      this.MAX_RETRIES,
    );

    return { data: null, _error: null };
  }

  private async lockAndMarkEventsAsProcessing(): PromiseWithError<
    OutboxEventDto[]
  > {
    const eventsResult = await this.receiveOutboxEventInfomodels({
      status: [
        OutboxEventStatusEnum.READY_TO_SEND,
        OutboxEventStatusEnum.ERROR,
      ],
      with_lock: true,
    });

    if (eventsResult._error) {
      return eventsResult;
    }

    if (!eventsResult.data?.length) {
      return { data: [], _error: null };
    }

    const updateResult = await this.updateOutboxEvents(
      eventsResult.data.map((event) => event.uuid),
      { status: OutboxEventStatusEnum.PROCESSING },
    );

    if (updateResult._error) {
      return {
        data: null,
        _error: updateResult._error,
      };
    }

    const updatedEvents = eventsResult.data.map((event) => ({
      ...event,
      status: OutboxEventStatusEnum.PROCESSING,
    }));

    return { data: updatedEvents, _error: null };
  }

  public async cleanupStuckEvents(): PromiseWithError<CleanupResultDto> {
    const result = await this.dbService.cleanupStuckEvents(
      this.PROCESSING_TIMEOUT_MINUTES,
      this.MAX_RETRIES,
    );

    if (result._error) {
      return {
        data: null,
        _error: result._error,
      };
    }

    return {
      data: result.data,
      _error: null,
    };
  }
}
