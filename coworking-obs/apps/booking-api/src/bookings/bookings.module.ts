import { Module } from '@nestjs/common';
import { BookingsMetrics } from './bookings.metrics';
import { BookingsStore } from './bookings.store';
import { ExpirySweepService } from './expiry-sweep.service';

/**
 * BookingsMetrics is listed as a provider despite nothing injecting it. That is
 * deliberate and is the kind of line a reviewer should ask about: instantiating it
 * is what registers the gauge — and its collect() callback — on the registry.
 * Without it in this array the class is dead code and `bookings_expired_pending`
 * never appears on /metrics at all.
 */
@Module({
  providers: [BookingsStore, BookingsMetrics, ExpirySweepService],
  exports: [BookingsStore],
})
export class BookingsModule {}
