import { NextRequest } from "next/server";
// the RateLimiter function is for testing purposes and should be replaced with a proper rate limiting implementation in production
export const RateLimiter = (request: NextRequest) => {
  return {
    allowed: true,
    message: "Rate limiter is not available.",
    retryAfter: 60,
    status: 429
  };
};