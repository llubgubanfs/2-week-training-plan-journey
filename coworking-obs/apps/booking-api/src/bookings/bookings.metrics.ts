import { Inject, Injectable } from '@nestjs/common';
import { Gauge, Registry } from 'prom-client';
import { METRICS_REGISTRY } from '@app/observability';
import { BookingsStore } from './bookings.store';

/**
 * The state signal, and the counterpart to `job_last_success_timestamp_seconds`.
 *
 * ── Why this is a collect() callback and not a `.set()` inside the sweep ──
 *
 * This is the load-bearing decision of the whole day and it is worth being able to
 * defend in one sentence: **a state signal must not be written by the component it
 * is watching.**
 *
 * If the sweep called `gauge.set(store.countExpiredPending())` at the end of each
 * run, then a sweep that stops running stops updating the gauge — and Prometheus
 * would keep scraping the last healthy value, 0, forever. The graph would be flat
 * and green while bookings piled up behind it. The signal would have quietly become
 * a *step* signal wearing a state signal's name: it would only ever report on runs
 * that happened, which is the exact class of failure it was added to catch.
 *
 * A collect() callback inverts the dependency. prom-client invokes it during
 * registry.metrics(), i.e. on Prometheus's scrape, so the value is computed by the
 * scrape rather than by the job. The sweep can be dead, wedged, crash-looping or
 * silently matching zero rows and this number still tells the truth — because the
 * only thing it depends on is the data, not on anything having run.
 *
 * Cost, stated because it is real: this executes inside the /metrics request, so an
 * expensive query here becomes scrape latency and, past the scrape timeout, a
 * *missing* series. A Map scan is free; against a real table this would want an
 * indexed COUNT and a hard eye on `scrape_duration_seconds`.
 */
@Injectable()
export class BookingsMetrics {
  readonly expiredPending: Gauge<string>;

  constructor(
    @Inject(METRICS_REGISTRY) registry: Registry,
    store: BookingsStore,
  ) {
    this.expiredPending = new Gauge({
      name: 'bookings_expired_pending',
      help: 'Bookings past their expiry that still hold a desk. Should be ~0.',
      registers: [registry],
      collect() {
        this.set(store.countExpiredPending());
      },
    });
  }
}
