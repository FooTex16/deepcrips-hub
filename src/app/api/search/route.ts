import { NextResponse } from "next/server";
import { searchContent, checkSearchRate } from "@/lib/data/search";
import type { SearchOutcome } from "@/lib/data/search";

/**
 * GET /api/search?q=&page=&type=
 * Pencarian global server-side — hanya konten published.
 */
export async function GET(request: Request) {
  const rateLimited = checkSearchRate(request);
  if (rateLimited) {
    return NextResponse.json<SearchOutcome>(rateLimited, { status: 429 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const page = Number(url.searchParams.get("page") ?? "1") || 1;
  const type = url.searchParams.get("type") ?? "all";

  const outcome = await searchContent(q, page, type);
  if (outcome.error === "unconfigured") {
    return NextResponse.json<SearchOutcome>(outcome, { status: 503 });
  }
  return NextResponse.json<SearchOutcome>(outcome);
}
