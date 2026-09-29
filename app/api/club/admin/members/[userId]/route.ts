import { NextRequest, NextResponse } from "next/server";
export const GET = async (request: NextRequest) => {
  const userId = request.nextUrl.pathname.split('/').pop();
  try {
    return NextResponse.json({
      message: `Hello from the admin member ${userId} route!`,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      message: "An error occurred while processing the request.",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
