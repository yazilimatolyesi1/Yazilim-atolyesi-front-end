import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "../../rateLimiter";
export const GET = async (request: NextRequest) => {
  const userId = request.nextUrl.pathname.split('/').pop();
  try {
    const rateLimiter = RateLimiter(request);
    if (!rateLimiter.allowed) {
      return NextResponse.json({
        error: rateLimiter.message,
        retryAfter: rateLimiter.retryAfter
      },
        { status: rateLimiter.status });
    }
    return NextResponse.json({
      userId,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      message: "An error occurred while processing the request.",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
