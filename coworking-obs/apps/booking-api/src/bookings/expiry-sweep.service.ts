import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { JobRunner } from '@app/observability';
import { BookingsStore } from './bookings.store';

export const EXPIRY_SWEEP_JOB = 'expiry-sweep';

/**
 * How this run is allowed to go wrong.
 *
 * `throw`  — the loud kind. An exception escapes the work function, JobRunner's
 *            catch records `outcome="failure"` and writes an error log line.
 * `silent` — the interesting kind. The sweep runs, matches nothing because its
 *            cutoff is wrong, and returns 0 normally. No exception exists. The
 *            success counter increments. Every step signal stays green.
 * `mixed`  — alternates between the two, so one demo run produces both shapes.
 */
export type FailureMode = 'none' | 'throw' | 'silent' | 'mixed';

/**
 * The Day 8 job: release bookings whose reservation has expired, so the desk goes
 * back into circulation. This is the worker drawn on the Day 7 design — and it is
 * the one whose silent death was the scenario Leander raised in his interview.
 *
 * Note what a silent failure costs here, because it is not obvious from the code:
 * nothing errors, nothing 500s, no user request fails. Desks simply never come
 * back. On the waitlist design it is worse than that — no expiry means no
 * `desk.freed` event, so promotion never fires and every queue behind those desks
 * stalls too. One dead worker, zero error logs.
 */
@Injectable()
export class ExpirySweepService implements OnModuleInit {
  private readonly intervalMs: number;
  private readonly failureMode: FailureMode;
  private readonly failureRate: number;
  private readonly seedPerTick: number;
  private readonly bookingTtlMs: number;

  /** Flipped on each injected failure so `mixed` alternates rather than clusters. */
  private nextMixedFailure: 'throw' | 'silent' = 'throw';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly config: ConfigService,
    private readonly scheduler: SchedulerRegistry,
    private readonly runner: JobRunner,
    private readonly store: BookingsStore,
  ) {
    // 12-factor: the schedule is configuration, not a literal baked into a @Cron
    // decorator. A decorator argument has to be a compile-time constant, which is
    // why this registers through SchedulerRegistry in onModuleInit instead — the
    // demo needs a 15s tick and anything real would want minutes.
    this.intervalMs = this.num('SWEEP_INTERVAL_MS', 15_000);
    this.failureMode = (this.config.get<string>('SWEEP_FAILURE_MODE') ??
      'mixed') as FailureMode;
    this.failureRate = this.num('SWEEP_FAILURE_RATE_PCT', 20) / 100;
    this.seedPerTick = this.num('SWEEP_SEED_PER_TICK', 3);
    this.bookingTtlMs = this.num('BOOKING_TTL_MS', 20_000);
  }

  onModuleInit(): void {
    const sweep = setInterval(() => void this.sweep(), this.intervalMs);
    this.scheduler.addInterval(EXPIRY_SWEEP_JOB, sweep);

    // Synthetic demand, so the invariant has something to be violated by without a
    // human generating traffic. Separate from the sweep interval on purpose: if the
    // seeder shared the sweep's tick, a dead sweep would also stop creating
    // bookings and the gauge would sit still for the wrong reason — the demo would
    // hide the very failure it exists to show.
    if (this.seedPerTick > 0) {
      const seeder = setInterval(() => this.seed(), this.intervalMs);
      this.scheduler.addInterval(`${EXPIRY_SWEEP_JOB}-seeder`, seeder);
    }

    this.logger.info('expiry sweep scheduled', {
      job: EXPIRY_SWEEP_JOB,
      interval_ms: this.intervalMs,
      failure_mode: this.failureMode,
      failure_rate: this.failureRate,
    });
  }

  /**
   * One run. Everything about correlation, metrics and spans lives in JobRunner —
   * this function's only job is the work and the injected flaw, which is what keeps
   * the flaw honest: it is not special-cased anywhere in the instrumentation.
   */
  private async sweep(): Promise<void> {
    await this.runner.run(EXPIRY_SWEEP_JOB, async () => {
      const failure = this.pickFailure();

      if (failure === 'throw') {
        // Stands in for the ordinary loud failures: connection refused, deadlock,
        // statement timeout.
        await Promise.reject(new Error('sweep failed: connection terminated'));
      }

      // ⚠️ THE BUG. On a silent run the cutoff is one hour in the past, so the
      // predicate matches no booking that is actually due. Structurally this is the
      // off-by-one WHERE clause, the timezone-shifted comparison, or the filter that
      // silently excludes everything — the family of bug that returns success.
      //
      // Everything downstream behaves correctly: expireDue() honours its contract,
      // the work function resolves, JobRunner counts outcome="success", and
      // job_last_success_timestamp_seconds advances. There is no error to log
      // because nothing went wrong; something merely never happened.
      const cutoff = failure === 'silent' ? Date.now() - 3_600_000 : Date.now();

      const swept = this.store.expireDue(cutoff);
      await Promise.resolve();

      return { swept, tracked: this.store.size() };
    });
  }

  private seed(): void {
    for (let i = 0; i < this.seedPerTick; i += 1) {
      this.store.create(
        `desk-${Math.floor(Math.random() * 30) + 1}`,
        this.bookingTtlMs,
      );
    }
  }

  private pickFailure(): 'throw' | 'silent' | null {
    if (this.failureMode === 'none') return null;
    if (Math.random() >= this.failureRate) return null;

    if (this.failureMode === 'mixed') {
      const chosen = this.nextMixedFailure;
      this.nextMixedFailure = chosen === 'throw' ? 'silent' : 'throw';
      return chosen;
    }
    return this.failureMode;
  }

  private num(key: string, fallback: number): number {
    const parsed = Number(this.config.get<string>(key));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }
}
