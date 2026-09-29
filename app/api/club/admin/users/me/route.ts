import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${process.env.CLUB_API_URL}/club/admin/users/me`,
      {
        method: "GET",
        headers: {
          cookie: request.headers.get("cookie") ?? "",
          authorization: request.headers.get("authorization") ?? "",
        },
      }
    );
    const data = await response.json();
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "An error occurred while fetching user data." },
      { status: 500 }
    );
  }
}