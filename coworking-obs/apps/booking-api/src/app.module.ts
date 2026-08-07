import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ObservabilityModule } from '@app/observability';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookingsModule } from './bookings/bookings.module';
import { DownstreamController } from './downstream.controller';
import { DownstreamService } from './downstream.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot({ service: 'booking-api' }),
    // Day 8. forRoot() only wires SchedulerRegistry and the decorator scanner; the
    // sweep registers its own interval at runtime so the period stays configurable.
    ScheduleModule.forRoot(),
    BookingsModule,
  ],
  controllers: [AppController, DownstreamController],
  providers: [AppService, DownstreamService],
})
export class AppModule {}
