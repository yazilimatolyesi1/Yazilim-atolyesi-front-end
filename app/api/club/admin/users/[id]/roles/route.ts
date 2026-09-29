import { NextRequest, NextResponse } from "next/server";
export const PATCH = async (request: NextRequest) => {
  const userId = request.nextUrl.pathname.split('/').pop();
  try {
    const requestBody = await request.json();
    const { role } = requestBody;
    if (!role) {
      return NextResponse.json({ message: "Role is required in the request body." }, { status: 400 });
    }
    return NextResponse.json({ message: `User with ID ${userId} has been assigned the role: ${role}` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      message: "An error occurred while processing the PATCH request.",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}