import { NextRequest, NextResponse } from "next/server";
import { backendUrl, readErrorEnvelope } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FORWARDED_HEADERS = [
  "content-disposition",
  "x-output-file",
  "x-transcript",
  "x-transcript-encoding",
  "x-source-lang",
  "x-target-lang",
  "x-translated-text",
  "x-translated-text-encoding",
  "x-skipped-translation"
];

export async function POST(request: NextRequest) {
  try {
    const incomingForm = await request.formData();
    const body = new FormData();

    for (const [key, value] of incomingForm.entries()) {
      if (value instanceof File) {
        body.append(key, value, value.name);
      } else {
        body.append(key, value);
      }
    }

    const upstream = await fetch(backendUrl("/speech"), {
      method: "POST",
      body,
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

    for (const headerName of FORWARDED_HEADERS) {
      const value = upstream.headers.get(headerName);
      if (value) {
        headers.set(headerName, value);
      }
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
