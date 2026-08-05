import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { NotifierController } from './notifier.controller';
import { NotifierService } from './notifier.service';

describe('NotifierController', () => {
  let notifierController: NotifierController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotifierController],
      providers: [
        NotifierService,
        // Day 6: NotifierService gained a logger, which broke this spec — the
        // token was unresolvable and every test in the file failed at compile()
        // time. Caught by `pnpm test`, invisible to both tsc and eslint.
        // Same swap the booking-api spec has had since Day 2.
        { provide: WINSTON_MODULE_PROVIDER, useValue: { info: jest.fn() } },
      ],
    }).compile();

    notifierController = app.get<NotifierController>(NotifierController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(notifierController.getHello()).toBe('Hello World!');
    });
  });

  describe('Day 6 downstream endpoints', () => {
    it('handles the awaited call', async () => {
      await expect(notifierController.downstreamImmediate()).resolves.toEqual({
        notified: true,
        tookMs: 40,
      });
    });

    it('handles the fire-and-forget call', async () => {
      await expect(notifierController.fireAndForget()).resolves.toEqual({
        accepted: true,
        tookMs: 40,
      });
    });
  });
});
