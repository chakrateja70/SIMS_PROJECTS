import { NextRequest, NextResponse } from "next/server";
import { backendUrl, readErrorEnvelope } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const upstream = await fetch(backendUrl("/tts"), {
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

    const audioData = await upstream.arrayBuffer();
    const headers = new Headers();
    headers.set(
      "Content-Type",
      upstream.headers.get("content-type") || "audio/mpeg"
    );

    const disposition = upstream.headers.get("content-disposition");
    if (disposition) {
      headers.set("Content-Disposition", disposition);
    }

    const outputPath = upstream.headers.get("x-output-file");
    if (outputPath) {
      headers.set("X-Output-File", outputPath);
    }

    return new NextResponse(audioData, {
      status: 200,
      headers
    });
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
