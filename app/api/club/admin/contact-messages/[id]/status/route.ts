import { NextRequest, NextResponse } from "next/server";
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;
  try {
    return NextResponse.json({
      id,
      status,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      message: "An error occurred while processing the PATCH request.",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  };
};