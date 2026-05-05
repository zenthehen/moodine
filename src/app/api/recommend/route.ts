import { NextResponse } from "next/server";
import { parseQueryWithGemini } from "@/lib/geminiParser";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const intent = await parseQueryWithGemini(query);
    return NextResponse.json({ intent });
  } catch (error) {
    console.error("[/api/recommend]", error);
    return NextResponse.json({ error: "parse_failed" }, { status: 500 });
  }
}
