import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AppService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  getHello(): string {
    // Deep in the call stack, and no correlation id was passed in as an argument —
    // which is the whole point. It arrives through AsyncLocalStorage.
    this.logger.info('handling hello');
    return 'Hello World!';
  }
}
