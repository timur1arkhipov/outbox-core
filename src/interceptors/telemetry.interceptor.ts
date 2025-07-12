import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Reflector } from '@nestjs/core';
import {
  TELEMETRY_TRACE_KEY,
  TELEMETRY_METRICS_KEY,
  TraceConfig,
  MetricsConfig,
} from '../decorators/telemetry.decorator';
import { OutboxTelemetryService } from '../services/outbox-telemetry.service';

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Optional() private readonly telemetryService?: OutboxTelemetryService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.telemetryService) {
      return next.handle();
    }

    const traceConfig = this.reflector.getAllAndOverride<TraceConfig>(
      TELEMETRY_TRACE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const metricsConfig = this.reflector.getAllAndOverride<MetricsConfig>(
      TELEMETRY_METRICS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!traceConfig && !metricsConfig) {
      return next.handle();
    }

    const methodName = context.getHandler().name;
    const className = context.getClass().name;
    const operationName = traceConfig?.name || `${className}.${methodName}`;

    const startTime = Date.now();
    const span = this.telemetryService.startSpan(operationName, {
      class: className,
      method: methodName,
      ...traceConfig?.attributes,
    });

          if (metricsConfig?.counter && this.telemetryService) {
        this.telemetryService.incrementCounter(
          metricsConfig.counter,
          metricsConfig.attributes || {}
        );
      }

    return next.handle().pipe(
      tap((result) => {
        const duration = Date.now() - startTime;
        
        if (metricsConfig?.histogram && this.telemetryService) {
          this.telemetryService.recordHistogram(
            metricsConfig.histogram,
            duration,
            { ...metricsConfig.attributes, status: 'success' }
          );
        }

        if (traceConfig?.recordMetrics && this.telemetryService) {
          this.telemetryService.recordOperationSuccess(
            operationName,
            duration,
            traceConfig.attributes || {}
          );
        }

        span.setStatus({ code: 1 }); // OK
        span.end();
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        if (metricsConfig?.histogram && this.telemetryService) {
          this.telemetryService.recordHistogram(
            metricsConfig.histogram,
            duration,
            { ...metricsConfig.attributes, status: 'error' }
          );
        }

        if (traceConfig?.recordException && this.telemetryService) {
          this.telemetryService.recordException(span, error);
        }

        if (traceConfig?.recordMetrics && this.telemetryService) {
          this.telemetryService.recordOperationError(
            operationName,
            duration,
            error.constructor.name,
            traceConfig.attributes || {}
          );
        }

        span.setStatus({ 
          code: 2, // ERROR
          message: error.message 
        });
        span.end();

        return throwError(() => error);
      }),
    );
  }
} 