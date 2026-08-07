import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

/**
 * ⚠️ Deliberately in-memory. There is no Postgres in this stack and the booking
 * domain was fenced off on Day 2: it earns zero assessment points and competes
 * directly with the observability work that earns all of them.
 *
 * What is being demonstrated today is the instrumentation *around* a scheduled job,
 * and that is byte-identical whether the sweep updates a Map or issues an UPDATE.
 * The one thing that would change with a real table is where the invariant is
 * counted — a SELECT instead of a filter — and the alert rule reading the resulting
 * gauge would not change at all.
 */
export interface Booking {
  id: string;
  deskId: string;
  status: 'reserved' | 'expired';
  expiresAt: number;
}

@Injectable()
export class BookingsStore {
  private readonly bookings = new Map<string, Booking>();

  /** Creates a reserved booking that falls due `ttlMs` from now. */
  create(deskId: string, ttlMs: number): Booking {
    const booking: Booking = {
      id: randomUUID(),
      deskId,
      status: 'reserved',
      expiresAt: Date.now() + ttlMs,
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  /**
   * The invariant, counted fresh on every call: a booking that is past its expiry
   * and still holds its desk. In a healthy system this is ~0 between sweeps and
   * strictly bounded by the sweep interval. It is never supposed to grow.
   *
   * Read by the gauge's collect() callback at scrape time — see BookingsMetrics.
   */
  countExpiredPending(now = Date.now()): number {
    let count = 0;
    for (const booking of this.bookings.values()) {
      if (booking.status === 'reserved' && booking.expiresAt <= now) count += 1;
    }
    return count;
  }

  /**
   * The sweep's actual work. Returns how many bookings it released.
   *
   * `cutoff` is the parameter the injected bug corrupts: pass the correct `now` and
   * every due booking is released; pass a cutoff far in the past and this matches
   * nothing, releases nothing, throws nothing, and returns 0. That is the entire
   * anatomy of a silent failure — no exception exists anywhere for a `catch` to
   * catch, and the function's contract was honoured to the letter.
   */
  expireDue(cutoff: number): number {
    let swept = 0;
    for (const booking of this.bookings.values()) {
      if (booking.status === 'reserved' && booking.expiresAt <= cutoff) {
        booking.status = 'expired';
        swept += 1;
      }
    }
    return swept;
  }

  size(): number {
    return this.bookings.size;
  }
}
