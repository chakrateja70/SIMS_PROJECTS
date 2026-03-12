import { NextResponse } from "next/server";
import { backendUrl, readErrorEnvelope } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const upstream = await fetch(backendUrl("/languages"), {
      method: "GET",
      cache: "no-store"
    });

    if (!upstream.ok) {
      const error = await readErrorEnvelope(upstream);
      return NextResponse.json(error, { status: upstream.status });
    }

    const payload = await upstream.json();
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        detail: {
          statusCode: 502,
          statusMessage: "Bad Gateway",
          errorMessage: `Unable to fetch language list: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        }
      },
      { status: 502 }
    );
  }
}
