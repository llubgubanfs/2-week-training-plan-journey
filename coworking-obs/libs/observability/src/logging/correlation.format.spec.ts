import { AsyncLocalStorage } from 'node:async_hooks';
import { ClsService } from 'nestjs-cls';
import { correlationFormat } from './correlation.format';

/**
 * The claim under test is not "Winston works" — it is that one correlation id
 * reaches a log line without ever being passed as an argument, and that lines with
 * no unit of work behind them degrade cleanly instead of throwing.
 */
describe('correlationFormat', () => {
  const build = () => {
    const cls = new ClsService(new AsyncLocalStorage());
    return { cls, fmt: correlationFormat(cls) };
  };

  const apply = (fmt: ReturnType<typeof correlationFormat>, message: string) =>
    fmt.transform({ level: 'info', message }) as Record<string, unknown>;

  it('stamps the id from the active context', () => {
    const { cls, fmt } = build();

    const info = cls.runWith(
      { correlationId: 'abc-123', contextType: 'http', startedAt: 0 },
      () => apply(fmt, 'request received'),
    );

    expect(info.correlation_id).toBe('abc-123');
    expect(info.context_type).toBe('http');
  });

  it('omits the id outside a context and types the line as system', () => {
    const { fmt } = build();

    const info = apply(fmt, 'Nest application successfully started');

    // Absent, not null and not a sentinel string — the convention `trace_id` will
    // follow on Day 6.
    expect(info).not.toHaveProperty('correlation_id');
    expect(info.context_type).toBe('system');
  });

  it('keeps concurrent contexts separate across an await', async () => {
    const { cls, fmt } = build();

    const handle = (id: string, delayMs: number) =>
      cls.runWith(
        { correlationId: id, contextType: 'http', startedAt: 0 },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          return apply(fmt, 'resumed after await');
        },
      );

    // A resumes *after* B has started and set its own id. With a module-level
    // variable the first assertion would read 'req-b'.
    const [a, b] = await Promise.all([handle('req-a', 20), handle('req-b', 5)]);

    expect(a.correlation_id).toBe('req-a');
    expect(b.correlation_id).toBe('req-b');
  });
});
