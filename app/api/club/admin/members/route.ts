import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "../rateLimiter";
export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q"); // YAZN
  const membershipStatus = searchParams.get("membershipStatus"); // PENDING
  const institution = searchParams.get("institution"); // Gedik
  const department = searchParams.get("department"); // Computer Engineering
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
      membershipStatus,
      institution,
      department,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      message: "An error occurred while processing the request.",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
