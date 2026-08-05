// Side-effecting module — see the twin in apps/booking-api/src/tracing.ts.
// `import './tracing';` must remain the first import in main.ts.
import { startTracing } from '@app/observability/tracing/otel';

startTracing(process.env.OTEL_SERVICE_NAME ?? 'notifier');
