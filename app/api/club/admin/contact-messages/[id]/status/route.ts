import { NextRequest, NextResponse } from "next/server";
export const PATCH = async (request: NextRequest) => {
  const messageid = request.nextUrl.pathname.split('/').pop();
  try {
    return NextResponse.json({
      message: `PATCH request received for contact message ${messageid}.`,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      message: "An error occurred while processing the PATCH request.",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  };
};