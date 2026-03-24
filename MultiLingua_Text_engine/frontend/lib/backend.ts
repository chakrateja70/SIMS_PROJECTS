export const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:8000";

type ErrorEnvelope = {
  detail: {
    statusCode: number;
    statusMessage: string;
    errorMessage: string;
  };
};

export function backendUrl(path: string): string {
  const configured = process.env.BACKEND_BASE_URL?.trim();
  const base = configured && configured.length > 0 ? configured : DEFAULT_BACKEND_BASE_URL;
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function readErrorEnvelope(response: Response): Promise<ErrorEnvelope> {
  const fallbackMessage =
    response.statusText || `Backend request failed with status ${response.status}`;

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as unknown;
      if (isErrorEnvelope(payload)) {
        return payload;
      }

      const message =
        extractMessage(payload) ||
        (typeof payload === "string" ? payload : fallbackMessage);

      return {
        detail: {
          statusCode: response.status,
          statusMessage: response.statusText || "Error",
          errorMessage: message
        }
      };
    } catch {
      // Fall through to text parser.
    }
  }

  let textBody = "";
  try {
    textBody = (await response.text()).trim();
  } catch {
    textBody = "";
  }

  return {
    detail: {
      statusCode: response.status,
      statusMessage: response.statusText || "Error",
      errorMessage: textBody || fallbackMessage
    }
  };
}

function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }

  const detail = (value as { detail?: unknown }).detail;
  if (!detail || typeof detail !== "object") {
    return false;
  }

  return typeof (detail as { errorMessage?: unknown }).errorMessage === "string";
}

function extractMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as {
    message?: unknown;
    error?: unknown;
    detail?: unknown;
  };

  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message;
  }

  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error;
  }

  if (typeof candidate.detail === "string" && candidate.detail.trim()) {
    return candidate.detail;
  }

  return null;
}
