import { NextRequest, NextResponse } from "next/server";
import { Role } from "../../../../../../../lib/admin-types";
import { RateLimiter } from "../../../rateLimiter";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { role } = body as { role: Role };
  try {
    const rateLimiter = RateLimiter(request);
    if (!rateLimiter.allowed) {
      return NextResponse.json({
        error: rateLimiter.message,
        retryAfter: rateLimiter.retryAfter
      },
        { status: rateLimiter.status });
    }
    if (!["ADMIN", "EDITOR", "MEMBER"].includes(role)) {
      return NextResponse.json({
        message: "Invalid role value. Must be 'ADMIN', 'EDITOR', or 'MEMBER'.",
      }, { status: 400 });
    }
    return NextResponse.json({
      message: `Successfully updated the role for user ${id}.`,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      message: "An error occurred while processing the PATCH request.",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}