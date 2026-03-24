import { NextRequest, NextResponse } from "next/server";
import { backendUrl, readErrorEnvelope } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const upstream = await fetch(backendUrl("/translate"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
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
          errorMessage: "Failed to fetch"
        }
      },
      { status: 502 }
    );
  }
}
