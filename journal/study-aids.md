# Study aids

Interactive explainers built during sessions. **Not deliverables** — Harvey never sees these.
They exist for the Day 9 and Day 10 retests, where no agent is present.

Artifacts are private by default and live at `claude.ai/code/artifacts`. Republishing keeps
the same URL, so these links are stable and a page can be revised without breaking them.

| Built | Aid | Covers | Weak spot |
|---|---|---|---|
| Day 2 · Jul 30 | [Carrying a request id: ALS vs nestjs-cls](https://claude.ai/code/artifact/2cd8c980-593e-4525-b824-b1f321ad4a2a) | Why context survives an `await`; `async_hooks` `init`/`before`; why a module-level `let` fails | **#5** — re-missed twice, still open |
| Day 4 · Aug 3 | [Scrape, Reset, Rate](https://claude.ai/code/artifact/9932139a-7445-4183-a3e7-5c4a85e6f75d) | Pull model · scrape resolution · counter vs gauge under sampling · counter resets · why `rate()` survives a deploy | **#14**, **#15** |
| Day 4 · Aug 3 | [Break to page](https://claude.ai/code/artifact/4ba3f589-ee5d-4467-8b90-58dcf921d29f) | The five delays from break to pager · `t_cross = (T/E) × W` · what `for:` actually suppresses | **#14** (companion) |

## Findings from these that change the Day 3 alerting note

Recorded here rather than silently editing the committed deliverable — the note as shipped is
defensible, and these are refinements to raise *if asked*, not corrections of an error.

1. **Detection latency has five terms, not three.** The Day 3 note doesn't quote a number at
   all, which is fine. If asked: scrape (≤15s) + `evaluation_interval` (≤15s) + threshold
   crossing (15s–250s depending on severity) + `for:` (300s) + Alertmanager `group_wait` (30s).
   Roughly **6–10 minutes**, and the spread is the interesting part.

2. **Threshold crossing is severity-dependent, and it dominates.** `t_cross = (T / E) × W`.
   A total outage breaches a 5% threshold in **15 seconds**; a 6% error rate takes **250**.
   A 16× swing from one term nobody quotes.

3. **`for: 5m` against a `[5m]` window leaves a ~30-second transient budget.** Time above
   threshold is `W + B − 2TW` — the window plus the burst, because the window keeps carrying
   the damage for its full length after recovery. So a **45-second** total outage that heals
   itself still pages someone. Counterintuitively a *wider* window makes transients worse, not
   better. Not a bug in the rule; a property worth being able to state.

## Provenance of the Day 3 numbers

- **`15s`** — the value in the `prometheus.yml` shipped in the release tarball. The config
  spec's own default is **1 minute**. Convention by inheritance, not a spec default. At ~135
  series this is ~1 MB/day, so the cost argument is irrelevant here; it's chosen for resolution.
- **`[5m]`** — floor is 2 samples (hard) / 4× the scrape interval (practical); ceiling is
  responsiveness and Prometheus's own 5-minute staleness horizon. 20 samples at 15s scraping.
- **`for: 5m`** — the weakest-justified of the three. See finding 3 for what it actually buys.
