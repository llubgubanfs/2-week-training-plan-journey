import { Test } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ClsModule, ClsService } from 'nestjs-cls';
import { Registry } from 'prom-client';
import { METRICS_REGISTRY } from '../metrics/metrics.registry';
import { JobMetrics } from './job.metrics';
import { JobRunner } from './job-runner';

/**
 * These tests exist because of a specific mistake that `tsc` cannot see and that a
 * running stack shows only statistically: putting the success signal in `finally`.
 * That version compiles, passes a smoke test, and reports success on the failing
 * runs — silently disabling the absence-of-success alert this whole day is about.
 *
 * The assertion that matters is the negative one in "does not count a throw as a
 * success". If that ever flips, every downstream rule keeps evaluating and keeps
 * saying nothing is wrong.
 */
describe('JobRunner', () => {
  let runner: JobRunner;
  let metrics: JobMetrics;
  let registry: Registry;
  let cls: ClsService;
  const logger = { info: jest.fn(), error: jest.fn() };

  beforeEach(async () => {
    registry = new Registry();
    logger.info.mockClear();
    logger.error.mockClear();

    const moduleRef = await Test.createTestingModule({
      imports: [ClsModule.forRoot({ global: true })],
      providers: [
        { provide: METRICS_REGISTRY, useValue: registry },
        { provide: WINSTON_MODULE_PROVIDER, useValue: logger },
        JobMetrics,
        JobRunner,
      ],
    }).compile();

    runner = moduleRef.get(JobRunner);
    metrics = moduleRef.get(JobMetrics);
    cls = moduleRef.get(ClsService);
  });

  const outcomes = async (): Promise<Record<string, number>> => {
    const metric = await metrics.runsTotal.get();
    return Object.fromEntries(
      metric.values.map((v) => [String(v.labels.outcome), v.value]),
    );
  };

  it('counts a resolved run as a success and stamps the timestamp', async () => {
    const before = Date.now() / 1000;
    const result = await runner.run('sweep', () =>
      Promise.resolve({ swept: 4 }),
    );

    expect(result).toEqual({ swept: 4 });
    expect(await outcomes()).toEqual({ success: 1 });

    const [sample] = (await metrics.lastSuccessTimestamp.get()).values;
    expect(sample.value).toBeGreaterThanOrEqual(before);
  });

  it('does not count a throw as a success, and does not advance the timestamp', async () => {
    await runner.run('sweep', () => Promise.reject(new Error('boom')));

    const counted = await outcomes();
    expect(counted).toEqual({ failure: 1 });
    // The regression guard. `success` must be entirely absent — a success signal
    // in `finally` would produce { success: 1, failure: 1 } here and the alert
    // rule reading it would never fire again.
    expect(counted.success).toBeUndefined();
    expect((await metrics.lastSuccessTimestamp.get()).values).toHaveLength(0);
  });

  it('swallows the rejection rather than letting it escape the scheduler', async () => {
    await expect(
      runner.run('sweep', () => Promise.reject(new Error('boom'))),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'job failed',
      expect.objectContaining({ job: 'sweep', outcome: 'failure' }),
    );
  });

  /**
   * The silent failure, expressed as a test: a run that does nothing is
   * indistinguishable from a run that does everything, as far as every signal
   * JobRunner emits is concerned. This is asserted rather than commented because
   * it is the justification for `bookings_expired_pending` existing at all — if
   * someone "fixes" this by inferring failure from an empty result, the state
   * gauge stops being the only honest signal and the argument on Day 10 changes.
   */
  it('counts a run that silently did nothing as a success', async () => {
    await runner.run('sweep', () => Promise.resolve({ swept: 0 }));
    expect(await outcomes()).toEqual({ success: 1 });
  });

  it('opens a job context, so log lines correlate without a request', async () => {
    let seen: { id: string | undefined; type: string | undefined } | undefined;
    await runner.run('sweep', () => {
      seen = {
        id: cls.get('correlationId'),
        type: cls.get('contextType'),
      };
      return Promise.resolve(null);
    });

    expect(seen?.type).toBe('job');
    expect(seen?.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('gives each run its own correlation id', async () => {
    const ids: (string | undefined)[] = [];
    const capture = () => {
      ids.push(cls.get('correlationId'));
      return Promise.resolve(null);
    };

    await Promise.all([runner.run('a', capture), runner.run('b', capture)]);

    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
