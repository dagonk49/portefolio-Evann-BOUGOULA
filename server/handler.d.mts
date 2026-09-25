import type { IncomingMessage, ServerResponse } from "node:http";
import type { ContactMail } from "./contact-core.mjs";

export interface RateLimiter {
  take(key: string): boolean;
}

export function createRateLimiter(options?: { max?: number; windowMs?: number; now?: () => number }): RateLimiter;

export function createContactHandler(options: {
  send: (mail: ContactMail) => Promise<unknown>;
  to: string;
  from: string;
  allowedOrigins?: string[];
  trustProxy?: boolean;
  limiter?: RateLimiter;
  log?: (event: string, detail?: Record<string, unknown>) => void;
}): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
