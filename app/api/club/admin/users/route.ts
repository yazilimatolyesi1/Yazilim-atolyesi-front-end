import { NextRequest, NextResponse } from "next/server";
import { Role } from "../../../../../lib/admin-types";
import { RateLimiter } from "../rateLimiter";
export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const role = searchParams.get("role") as Role;
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
    if (role !== "ADMIN") {
      return NextResponse.json({
        error: "you are not authorized to access this resource. Only ADMIN role is allowed.",
      }, { status: 400 });
    }
    return NextResponse.json({
      q,
      role,
      status,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      message: "An error occurred while processing the request.",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}