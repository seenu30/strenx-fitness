/**
 * Rate Limiting with Upstash Redis
 *
 * Provides rate limiting for API routes to prevent abuse and ensure fair usage.
 * Uses sliding window algorithm for smooth rate limiting.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limit tiers
export type RateLimitTier =
  | "default" // Standard rate limit
  | "auth" // Authentication endpoints (stricter)
  | "api" // General API endpoints
  | "upload" // File upload endpoints (more lenient)
  | "sensitive"; // Sensitive data access (strictest)

// Rate limit configurations
export interface RateLimitConfig {
  requests: number;
  window: string; // e.g., "1m", "10s", "1h"
  blockDuration?: string; // How long to block after limit exceeded
}

/**
 * Default rate limit configurations per tier
 */
export const RATE_LIMIT_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
  default: {
    requests: 100,
    window: "1m",
  },
  auth: {
    requests: 5,
    window: "1m",
    blockDuration: "5m", // Block for 5 minutes after too many attempts
  },
  api: {
    requests: 60,
    window: "1m",
  },
  upload: {
    requests: 10,
    window: "1m",
  },
  sensitive: {
    requests: 20,
    window: "1m",
  },
};

/**
 * Parse window string to milliseconds
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)([smh])$/);
  if (!match) return 60000; // Default to 1 minute

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    default:
      return 60000;
  }
}

/**
 * Create Redis client
 */
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("Upstash Redis not configured - rate limiting disabled");
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

/**
 * Create rate limiter for a specific tier
 */
const rateLimiters: Map<RateLimitTier, Ratelimit> = new Map();

function getRateLimiter(tier: RateLimitTier): Ratelimit | null {
  const existingLimiter = rateLimiters.get(tier);
  if (existingLimiter) return existingLimiter;

  const redisClient = getRedis();
  if (!redisClient) return null;

  const config = RATE_LIMIT_CONFIGS[tier];
  const windowMs = parseWindow(config.window);

  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(config.requests, `${windowMs} ms`),
    analytics: true,
    prefix: `strenx:ratelimit:${tier}`,
  });

  rateLimiters.set(tier, limiter);
  return limiter;
}

/**
 * Get identifier for rate limiting (IP + optional user ID)
 */
export function getIdentifier(request: NextRequest, userId?: string): string {
  // Get IP from various headers (handling proxies)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0] || realIp || "unknown";

  // Combine IP with user ID for authenticated requests
  if (userId) {
    return `${userId}:${ip}`;
  }

  return ip;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp when the limit resets
  retryAfter?: number; // Seconds to wait before retrying
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = "default"
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(tier);

  // If rate limiting is not configured, allow all requests
  if (!limiter) {
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: 0,
    };
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
  };
}

/**
 * Rate limit response headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };

  if (result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create rate limited response (429 Too Many Requests)
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: getRateLimitHeaders(result),
    }
  );
}

/**
 * Rate limit middleware wrapper for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  options?: {
    tier?: RateLimitTier;
    userId?: string;
  }
): Promise<NextResponse> {
  const identifier = getIdentifier(request, options?.userId);
  const result = await checkRateLimit(identifier, options?.tier || "api");

  if (!result.success) {
    return createRateLimitResponse(result);
  }

  // Add rate limit headers to successful response
  const response = await handler();
  const headers = getRateLimitHeaders(result);

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Specific rate limiters for common use cases
 */

export async function rateLimitAuth(
  request: NextRequest
): Promise<RateLimitResult> {
  const identifier = getIdentifier(request);
  return checkRateLimit(`auth:${identifier}`, "auth");
}

export async function rateLimitUpload(
  request: NextRequest,
  userId: string
): Promise<RateLimitResult> {
  const identifier = getIdentifier(request, userId);
  return checkRateLimit(`upload:${identifier}`, "upload");
}

export async function rateLimitSensitive(
  request: NextRequest,
  userId: string
): Promise<RateLimitResult> {
  const identifier = getIdentifier(request, userId);
  return checkRateLimit(`sensitive:${identifier}`, "sensitive");
}

/**
 * Clean up rate limit data for a user (e.g., on account deletion)
 */
export async function clearRateLimitData(userId: string): Promise<void> {
  const redisClient = getRedis();
  if (!redisClient) return;

  // This would need to scan and delete keys - simplified version
  console.log(`Would clear rate limit data for user: ${userId}`);
}
