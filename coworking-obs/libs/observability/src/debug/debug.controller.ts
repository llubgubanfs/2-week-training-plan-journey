import {
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Endpoints that exist purely to make the observability signals move.
 *
 * Nothing else in this service can fail or block, which makes three of the four
 * signals undemonstrable: the error-ratio panel has only ever seen 0%, the
 * HighErrorRatio rule has never left `inactive`, and http_requests_in_flight
 * cannot leave 0 no matter how much load is applied.
 *
 * That last one is worth stating precisely, because it is not a bug. The gauge
 * spans middleware entry to res 'close'. For a handler that synchronously
 * returns a string that region is ~0.19ms, so by Little's Law its occupancy is
 * throughput x duration — under 1 even at ~4,900 req/s. Requests queue in the
 * kernel accept queue and libuv, upstream of the instrumented span. Measured:
 * 401 established TCP connections and 14,624 requests served still produced a
 * gauge reading of 0 across 96 samples.
 *
 * The gauge only moves when requests are held *inside* the handler. That is what
 * /debug/slow does, and it is the same shape as the Day 8 failure mode: an
 * awaited call that does not come back.
 *
 * NOT gated behind an env flag — Leander's call, Day 4, after the trade-off was
 * put to him. The blast radius is bounded instead: the delay is clamped, and
 * there is deliberately no endpoint that hangs forever. Revisit if Day 8 decides
 * to actually deploy this.
 */
@Controller('debug')
export class DebugController {
  /** Above this the endpoint stops being a demo and starts being an outage. */
  private static readonly MAX_DELAY_MS = 10_000;
  private static readonly DEFAULT_DELAY_MS = 2_000;

  /**
   * Holds a request open inside the handler for `ms` milliseconds.
   *
   *   curl 'localhost:3000/debug/slow?ms=5000'
   *
   * Fire a few of these concurrently and http_requests_in_flight finally climbs,
   * because now there really are requests sitting in the instrumented span.
   *
   * Also the first thing in this service that can be abandoned mid-flight, which
   * makes the 499 branch reachable — it has been written since Day 3 and has
   * never once fired, because every request completed in ~2ms:
   *
   *   curl --max-time 1 'localhost:3000/debug/slow?ms=8000'
   */
  @Get('slow')
  async slow(
    @Query('ms') raw: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ sleptMs: number } | undefined> {
    const ms = DebugController.clamp(
      raw,
      DebugController.DEFAULT_DELAY_MS,
      DebugController.MAX_DELAY_MS,
    );

    const abandoned = await DebugController.sleep(ms, res);

    // The client gave up. The socket is already gone, so there is nothing to
    // write to — returning a body here would be a write to a destroyed stream.
    // The metrics middleware has meanwhile recorded this as 499 off the 'close'
    // event, which is the whole point of the exercise.
    if (abandoned) return undefined;

    return { sleptMs: ms };
  }

  /**
   * Returns 500 for a proportion of requests.
   *
   *   curl 'localhost:3000/debug/fail'            # every request fails
   *   curl 'localhost:3000/debug/fail?rate=0.1'   # one in ten
   *
   * The rate matters more than it looks. rate() over a window is a moving
   * average, so an instant break reaches the alert threshold at t = (T/E) x W:
   * a total outage crosses 5% in 15s, while a 10% error rate takes 150s. Being
   * able to dial E is what makes both of those demonstrable rather than
   * theoretical.
   */
  @Get('fail')
  fail(@Query('rate') raw: string | undefined): { ok: true } {
    const rate = DebugController.clamp(raw, 1, 1, 0);
    if (Math.random() < rate) {
      throw new InternalServerErrorException(
        'Synthetic failure from /debug/fail',
      );
    }
    return { ok: true };
  }

  /**
   * Query params arrive as strings or not at all, and a caller can send anything.
   * Number('') is 0 and Number('abc') is NaN, so both are rejected in favour of
   * the default rather than silently becoming a zero-length delay.
   */
  private static clamp(
    raw: string | undefined,
    fallback: number,
    max: number,
    min = 0,
  ): number {
    const value = Number(raw);
    if (raw === undefined || raw === '' || Number.isNaN(value)) return fallback;
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Resolves true if the client disconnected before the timer elapsed.
   *
   * The listener is removed and the timer cleared on both paths: an abandoned
   * request should stop costing the server a pending timer the moment it goes
   * away, which is exactly the hygiene the 499 work on Day 3 was about.
   */
  private static sleep(ms: number, res: Response): Promise<boolean> {
    return new Promise((resolve) => {
      const onClose = () => {
        clearTimeout(timer);
        resolve(true);
      };
      const timer = setTimeout(() => {
        res.off('close', onClose);
        resolve(false);
      }, ms);
      res.once('close', onClose);
    });
  }
}
