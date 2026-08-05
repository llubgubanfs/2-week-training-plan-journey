// Side-effecting module. Its whole job is to run before anything else does.
//
// main.ts opens with `import './tracing';` and that line must stay first — see
// the note in @app/observability/tracing/otel for why "first" is stricter than
// it looks. Do not import this from anywhere else, and do not convert it into a
// function call at the top of bootstrap(); imports are hoisted, so a call would
// run after @nestjs/core had already loaded http unpatched.
import { startTracing } from '@app/observability/tracing/otel';

startTracing(process.env.OTEL_SERVICE_NAME ?? 'booking-api');
