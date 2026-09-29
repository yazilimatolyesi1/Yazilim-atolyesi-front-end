import { NextRequest, NextResponse } from "next/server";
export const GET = async (req: NextRequest) => {
  try {
    const contactMessages = 123
    return NextResponse.json(contactMessages, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return NextResponse.json({ error: "Failed to fetch contact messages" }, {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
