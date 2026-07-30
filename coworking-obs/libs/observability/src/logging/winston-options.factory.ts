import { ConfigService } from '@nestjs/config';
import { WinstonModuleOptions } from 'nest-winston';
import { ClsService } from 'nestjs-cls';
import { format, transports } from 'winston';
import { correlationFormat } from './correlation.format';

/**
 * One console transport emitting JSON to stdout. Deliberately not a file transport:
 * 12-factor says the process writes to stdout and the platform owns collection —
 * which is what Day 4's Promtail/Loki step will pick up.
 */
export const buildWinstonOptions = (
  config: ConfigService,
  cls: ClsService,
  service: string,
): WinstonModuleOptions => ({
  level: config.get<string>('LOG_LEVEL') ?? 'info',
  // Distinguishes the two apps once both stream into one place.
  defaultMeta: { service },
  format: format.combine(
    format.timestamp(),
    // Without this an Error logged as metadata serialises to `{}` — no message,
    // no stack. Costs one line, and its absence is only ever noticed during an
    // incident.
    format.errors({ stack: true }),
    correlationFormat(cls),
    // LOG_PRETTY is a local-dev affordance only. Anything that ships reads JSON.
    config.get<string>('LOG_PRETTY') === 'true'
      ? format.prettyPrint({ colorize: true })
      : format.json(),
  ),
  transports: [new transports.Console()],
});
