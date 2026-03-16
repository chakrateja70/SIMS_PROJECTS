import { NextResponse } from "next/server";

const FALLBACK_BACKEND_URL = "http://127.0.0.1:8000";

export async function forwardToBackend(endpoint: string, payload: unknown) {
  const baseUrl = (process.env.BACKEND_URL || FALLBACK_BACKEND_URL).replace(/\/+$/, "");
  const safeEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  try {
    const backendResponse = await fetch(`${baseUrl}${safeEndpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const contentType = backendResponse.headers.get("content-type") ?? "";
    const rawData = contentType.includes("application/json")
      ? await backendResponse.json()
      : { message: await backendResponse.text() };

    return NextResponse.json(rawData, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      {
        message: "Backend service is unreachable. Verify BACKEND_URL and backend availability.",
      },
      { status: 502 },
    );
  }
}
