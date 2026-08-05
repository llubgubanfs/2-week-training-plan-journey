// ⚠️ MUST BE THE FIRST IMPORT — see the note in apps/booking-api/src/main.ts.
import './tracing';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NotifierModule } from './notifier.module';

async function bootstrap() {
  // bufferLogs holds Nest's own startup lines until the Winston logger is attached
  // below, so they come out as JSON too instead of the default pretty printer.
  const app = await NestFactory.create(NotifierModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const config = app.get(ConfigService);

  // 3001 by default — booking-api owns 3000. The generator gave both apps the
  // same default port (and read a lowercase `process.env.port`), which would
  // collide the moment Compose brings both up.
  await app.listen(Number(config.get('NOTIFIER_PORT') ?? 3001), '0.0.0.0');
}
void bootstrap();
