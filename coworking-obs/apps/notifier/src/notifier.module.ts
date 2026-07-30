import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotifierController } from './notifier.controller';
import { NotifierService } from './notifier.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [NotifierController],
  providers: [NotifierService],
})
export class NotifierModule {}
