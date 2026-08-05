import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ObservabilityModule } from '@app/observability';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DownstreamController } from './downstream.controller';
import { DownstreamService } from './downstream.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot({ service: 'booking-api' }),
  ],
  controllers: [AppController, DownstreamController],
  providers: [AppService, DownstreamService],
})
export class AppModule {}
