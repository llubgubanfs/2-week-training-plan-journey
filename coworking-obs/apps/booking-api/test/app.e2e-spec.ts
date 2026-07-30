import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Captures the JSON the service actually writes to stdout. Asserting on real output rather
 * than on a mocked logger is deliberate — it exercises the whole chain (middleware → ALS →
 * Winston format), which is where the correlation actually happens. A mocked logger would
 * bypass the format function and prove nothing.
 */
const captureStdout = () => {
  const lines: Record<string, unknown>[] = [];
  jest
    .spyOn(process.stdout, 'write')
    .mockImplementation((chunk: unknown): boolean => {
      const text = typeof chunk === 'string' ? chunk : String(chunk);
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        try {
          lines.push(JSON.parse(line) as Record<string, unknown>);
        } catch {
          // Not one of ours — swallow it.
        }
      }
      return true;
    });
  return lines;
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('correlation id', () => {
    // 'request received' and 'handling hello' are both emitted synchronously inside the
    // request. 'request completed' fires on res 'finish', which may land after supertest
    // resolves — so these assertions deliberately do not depend on it.
    const idsFrom = (lines: Record<string, unknown>[]) =>
      lines
        .filter((l) => l.context_type === 'http')
        .map((l) => l.correlation_id);

    it('generates one when no header is supplied', async () => {
      const lines = captureStdout();
      await request(app.getHttpServer()).get('/').expect(200);

      const ids = idsFrom(lines);
      expect(ids.length).toBeGreaterThanOrEqual(2);
      expect(new Set(ids).size).toBe(1); // every line of one request shares an id
      expect(ids[0]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('honours an inbound x-correlation-id', async () => {
      const lines = captureStdout();
      await request(app.getHttpServer())
        .get('/')
        .set('x-correlation-id', 'from-caller')
        .expect(200);

      expect(new Set(idsFrom(lines))).toEqual(new Set(['from-caller']));
    });

    it('honours an inbound x-request-id, as stamped by a proxy', async () => {
      const lines = captureStdout();
      await request(app.getHttpServer())
        .get('/')
        .set('x-request-id', 'from-proxy')
        .expect(200);

      expect(new Set(idsFrom(lines))).toEqual(new Set(['from-proxy']));
    });

    it('prefers x-correlation-id when both are present', async () => {
      const lines = captureStdout();
      await request(app.getHttpServer())
        .get('/')
        .set('x-request-id', 'from-proxy')
        .set('x-correlation-id', 'from-caller')
        .expect(200);

      // The deliberate choice of a caller that knows the contract beats the one a proxy
      // stamps automatically.
      expect(new Set(idsFrom(lines))).toEqual(new Set(['from-caller']));
    });
  });
});
