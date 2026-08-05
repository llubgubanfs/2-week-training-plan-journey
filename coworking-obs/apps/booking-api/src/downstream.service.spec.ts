import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ClsService } from 'nestjs-cls';
import { DownstreamService } from './downstream.service';

/**
 * Covers the one thing on the Day 6 hop that can break silently.
 *
 * `traceparent` is injected by the instrumentation, so it is not ours to get
 * wrong. `x-correlation-id` is ours, and if it stops being sent nothing fails:
 * both services keep working, both keep logging, and the ids simply stop
 * matching. No error, no failing build — exactly the shape of the standing
 * carry-over about regressions that are invisible to tsc and to the test suite.
 */
describe('DownstreamService', () => {
  const CORRELATION_ID = 'test-correlation-id';
  let service: DownstreamService;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ notified: true }),
    });
    global.fetch = fetchMock;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DownstreamService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: { info: jest.fn(), error: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: () => 'http://notifier:3001' },
        },
        { provide: ClsService, useValue: { get: () => CORRELATION_ID } },
      ],
    }).compile();

    service = moduleRef.get(DownstreamService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('forwards x-correlation-id on the awaited call', async () => {
    await service.callImmediate();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://notifier:3001/downstream-immediate');
    expect(init.headers).toEqual({ 'x-correlation-id': CORRELATION_ID });
  });

  // Not async, and that is the point: fireAndForget() returns void, not a
  // promise. There is nothing here to await — which is exactly the property that
  // makes the caller unable to learn about a failure.
  it('forwards x-correlation-id on the fire-and-forget call', () => {
    service.fireAndForget();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://notifier:3001/fire-and-forget');
    expect(init.headers).toEqual({ 'x-correlation-id': CORRELATION_ID });
  });

  it('sends no correlation header when there is no context', async () => {
    // A job or a bootstrap call has no request behind it. Sending an empty
    // header would be worse than sending none: the receiver honours inbound ids,
    // so an empty string could overwrite a perfectly good generated one.
    const moduleRef = await Test.createTestingModule({
      providers: [
        DownstreamService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: { info: jest.fn(), error: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: () => 'http://notifier:3001' },
        },
        { provide: ClsService, useValue: { get: () => undefined } },
      ],
    }).compile();

    await moduleRef.get(DownstreamService).callImmediate();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toEqual({});
  });

  it('does not reject when the fire-and-forget call fails', async () => {
    // The .catch() is what keeps an unhandled rejection from killing the process
    // and taking the whole span buffer with it. If this ever starts throwing,
    // a failing downstream call becomes an outage.
    fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED'));

    expect(() => service.fireAndForget()).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
  });
});
