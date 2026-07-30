import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // 0.0.0.0, not Nest's default localhost: bound to localhost inside a container
  // the port is published but nothing outside can reach it.
  // Number(): env vars always arrive as strings, so the generic form
  // config.get<number>() would be a false assertion.
  await app.listen(Number(config.get('BOOKING_API_PORT') ?? 3000), '0.0.0.0');
}
void bootstrap();
