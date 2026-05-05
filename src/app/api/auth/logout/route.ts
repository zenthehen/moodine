import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await clearSession();
    return NextResponse.redirect(new URL("/", req.url));
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
