import type { Request, Response } from 'express';

/** Every request that matched no route collapses to this single label value. */
export const UNMATCHED_ROUTE = 'unmatched';

/** nginx's convention for "client closed the connection before we answered". */
export const CLIENT_CLOSED_REQUEST = 499;

/**
 * The route *template* — `/reservations/:id`, never `/reservations/9f3c-…`.
 *
 * `req.originalUrl` carries path params and the query string, so using it as a
 * label makes cardinality a function of traffic: one new series per location,
 * per date, per reservation id, forever, and Prometheus keeps them until
 * retention expires. The template is bounded by the number of routes we wrote.
 *
 * Unmatched requests (404s, and bots probing /wp-admin, /.env) have no template.
 * Falling back to the raw URL there would reintroduce exactly the unbounded
 * growth this function exists to prevent — an attacker could mint series at
 * will — so they all share one value.
 */
export const routeLabel = (req: Request): string => {
  // @types/express declares `route` as `any`; narrow it rather than trusting it.
  const matched = req.route as { path?: string } | undefined;
  const template = matched?.path;
  if (!template) return UNMATCHED_ROUTE;

  // baseUrl is non-empty when the route sits behind a global prefix or a
  // sub-router; req.route.path is relative to that mount point.
  const full = `${req.baseUrl ?? ''}${template}`;
  return full === '' ? '/' : full;
};

/**
 * `res.statusCode` is initialised to 200 by Node and is never null, so on an
 * abandoned request it reads 200 unless a handler happened to overwrite it —
 * silently recording a dead connection as a success. `writableFinished` is the
 * only honest signal: it flips true once the response has actually been flushed,
 * immediately before 'finish' would fire.
 */
export const statusLabel = (res: Response): number =>
  res.writableFinished ? res.statusCode : CLIENT_CLOSED_REQUEST;
