## Observability & Structured Logging

1. What's the difference between a log, a metric, and a trace?
    - A log is an entry made by processes in a system during runtime, it contains information about its current state. A metric is information that is quantifiable, how long a process took, and is useful for benchmarks and analytics. A trace is the information that tells where the log originated or has come about to.
---

2. Your API's error rate just spiked — what's the first thing you look at?
    - The first thing I would investigate are the api calls that are tagged as 'errors', then trace the failure point.
---

3. What does a Prometheus scrape endpoint do?
    - I do not have knowledge nor experience with Prometheus at the moment.
---

4. Why use structured (JSON) logs instead of plain text logs?
    - structured (JSON) logs are ideal for filtering when querying logs, it gives you formatted and typed logs that are easier to query than plain unstructured text logs.
--- 

5. How would you know your app is down before a user reports it?
    - A health endpoint being called by a monitoring tool that checks the status and uptime, then a mechanism to notify the intended personnel via email or any other channels regarding the status.


---

System Design to be demoed