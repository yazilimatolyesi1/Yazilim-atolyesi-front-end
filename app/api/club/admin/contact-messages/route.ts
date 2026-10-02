import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "../rateLimiter";
export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const status = searchParams.get("status");
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
      q,
      status,
    });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return NextResponse.json({ error: "Failed to fetch contact messages" }, {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
