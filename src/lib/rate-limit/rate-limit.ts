import type { RateLimitRecord, RateLimitConfig, RateLimitResult } from "@/types/RateLimit/rate-limit";

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitMap.get(key);

  // If no record or window expired, create new record
  if (!record || record.resetTime < now) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Increment count
  record.count += 1;

  // Check if over limit
  if (record.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }

  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetIn: record.resetTime - now,
  };
}

// Helper to get client IP from request
export function getClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback - in production this should rarely happen
  return "unknown";
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // AI Assistant: 10 requests per minute (expensive API calls)
  assistant: (ip: string) =>
    rateLimit(`assistant:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 }),

  // Contact form: 5 requests per 15 minutes (prevent spam)
  contact: (ip: string) =>
    rateLimit(`contact:${ip}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 }),

  // Auth endpoints: 10 requests per 15 minutes (prevent brute force)
  auth: (ip: string) =>
    rateLimit(`auth:${ip}`, { maxRequests: 10, windowMs: 15 * 60 * 1000 }),

  // Search: 30 requests per minute (moderate limit)
  search: (ip: string) =>
    rateLimit(`search:${ip}`, { maxRequests: 30, windowMs: 60 * 1000 }),
};
