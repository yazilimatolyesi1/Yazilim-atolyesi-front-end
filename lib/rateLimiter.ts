import { NextRequest } from "next/server";
/**
 * Rate Limiting Library to Prevent Attacks
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}
const store: RateLimitStore = {};
// Clean up expired data
const cleanupExpiredEntries = () => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
};
// Clear all data (for testing use)
export const clearRateLimitStore = () => {
  Object.keys(store).forEach(key => {
    delete store[key];
  });
};
// Clear Rate Limiting data for a specific IP
export const clearRateLimitForIP = (ip: string) => {
  Object.keys(store).forEach(key => {
    if (key.includes(ip)) {
      delete store[key];
    }
  });
};
// View Rate Limiting status (for testing use)
export const getRateLimitStatus = () => {
  const now = Date.now();
  const status: { [key: string]: { count: number; resetTime: number; remaining: number } } = {};
  Object.keys(store).forEach(key => {
    const entry = store[key];
    status[key] = {
      count: entry.count,
      resetTime: entry.resetTime,
      remaining: Math.max(0, Math.ceil((entry.resetTime - now) / 1000))
    };
  });
  return status;
};
// Get the client IP
export const getClientIP = (req: NextRequest): string => {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown';
};
// Rate Limiter
const RateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
  requestEndPoint?: string;
}) => {
  const { windowMs, maxRequests, message = 'Too many requests', requestEndPoint } = options;
  return (req: NextRequest): { allowed: boolean; message?: string; retryAfter?: number; status?: number } => {
    const endpoint = requestEndPoint || req.nextUrl.pathname;
    const clientIP = getClientIP(req);
    const now = Date.now();
    const key = `${endpoint}:${clientIP}`;
    // Clean up expired data
    cleanupExpiredEntries();
    // Check current limit
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return { allowed: true };
    }
    if (store[key].count >= maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      return {
        allowed: false,
        message,
        retryAfter,
        status: 429
      };
    }
    store[key].count++;
    return { allowed: true };
  };
};
export const generalRateLimiter = RateLimiter({
  windowMs: 1000 * 60 * 15, // 15 minutes
  maxRequests: 200, // 200 requests per 15 minutes
  message: "İstek sınırını aştınız. Lütfen tekrar denemeden önce biraz bekleyin.",
  requestEndPoint: 'general'
});