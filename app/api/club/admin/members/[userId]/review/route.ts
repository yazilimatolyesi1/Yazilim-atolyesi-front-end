import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "../../../rateLimiter";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const body = await request.json();
  const { status, reviewNote } = body as {
    status: "approved" | "rejected";
    reviewNote?: string;
  };
  try {
    const rateLimiter = RateLimiter(request);
    if (!rateLimiter.allowed) {
      return NextResponse.json({
        error: rateLimiter.message,
        retryAfter: rateLimiter.retryAfter
      },
        { status: rateLimiter.status });
    }
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({
        message: "Invalid status value. Must be 'approved' or 'rejected'.",
      }, { status: 400 });
    }

    return NextResponse.json({
      message: `Successfully updated the review status for user ${userId}.`,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      message: "An error occurred while processing the PATCH request.",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}