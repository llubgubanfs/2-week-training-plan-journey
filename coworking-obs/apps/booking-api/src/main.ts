// ⚠️ MUST BE THE FIRST IMPORT. Instrumentation patches modules as they load, so
// anything imported above this line captures an unpatched reference and emits no
// spans. Moving it below @nestjs/core silently produces an empty Jaeger — no
// error, no warning, just no traces.
import './tracing';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';

async function bootstrap() {
  // bufferLogs holds Nest's own startup lines until the Winston logger is attached
  // below, so they come out as JSON too instead of the default pretty printer.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const config = app.get(ConfigService);

  // 0.0.0.0, not Nest's default localhost: bound to localhost inside a container
  // the port is published but nothing outside can reach it.
  // Number(): env vars always arrive as strings, so the generic form
  // config.get<number>() would be a false assertion.
  await app.listen(Number(config.get('BOOKING_API_PORT') ?? 3000), '0.0.0.0');
}
void bootstrap();
