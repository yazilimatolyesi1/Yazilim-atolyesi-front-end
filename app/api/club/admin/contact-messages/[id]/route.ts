import { NextResponse } from "next/server";
export const GET = async (request: NextResponse) => {
  const { searchParams } = new URL(request.url);
  const messageid = searchParams.get("message") || "No message provided";
  try {
    return NextResponse.json({ message: `get: ${messageid} ` }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Error occurred" }, { status: 500 })
  };
};
export const DELETE = async (request: NextResponse) => {
  const { searchParams } = new URL(request.url);
  const messageid = searchParams.get("message") || "No message provided";
  try {
    return NextResponse.json({ message: `deleted: ${messageid} ` }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Error occurred" }, { status: 500 })
  };
};