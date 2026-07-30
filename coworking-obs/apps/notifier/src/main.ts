import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NotifierModule } from './notifier.module';

async function bootstrap() {
  const app = await NestFactory.create(NotifierModule);
  const config = app.get(ConfigService);

  // 3001 by default — booking-api owns 3000. The generator gave both apps the
  // same default port (and read a lowercase `process.env.port`), which would
  // collide the moment Compose brings both up.
  await app.listen(Number(config.get('NOTIFIER_PORT') ?? 3001), '0.0.0.0');
}
void bootstrap();
