import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "../../rateLimiter";
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  try {
    const rateLimiter = RateLimiter(request);
    if (!rateLimiter.allowed) {
      return NextResponse.json({
        error: rateLimiter.message,
        retryAfter: rateLimiter.retryAfter
      },
        { status: rateLimiter.status });
    }
    return NextResponse.json({ id }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Error occurred" }, { status: 500 })
  };
};
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
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
      id,
      deleted: true,
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Error occurred" }, { status: 500 })
  };
};