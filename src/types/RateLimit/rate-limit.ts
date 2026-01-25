export type RateLimitRecord = {
  count: number;
  resetTime: number;
};

export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetIn: number;
};
