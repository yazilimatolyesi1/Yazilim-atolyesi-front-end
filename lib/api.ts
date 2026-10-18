export type FieldError = {
  field: string;
  message: string;
};
type ApiErrorResponse = {
  message?: unknown;
  fieldErrors?: unknown;
};
export class ApiError extends Error {
  constructor(
    message: string,
    public fieldErrors: FieldError[] = [],
    public status = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export class RequestAbortedError extends Error {
  constructor() {
    super("İstek iptal edildi.");
    this.name = "RequestAbortedError";
  }
}
export function isAborted(error: unknown): boolean {
  return error instanceof RequestAbortedError;
}
const API_PREFIX = "/api/club";
const TIMEOUT_MS = 12_000;
function buildRequestUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  if (
    normalizedPath === "api/club" ||
    normalizedPath.startsWith("api/club/")
  ) {
    return `/${normalizedPath}`;
  }
  return `${API_PREFIX}/${normalizedPath}`;
}
function parseFieldErrors(value: unknown): FieldError[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is FieldError =>
      typeof item === "object" &&
      item !== null &&
      "field" in item &&
      "message" in item &&
      typeof item.field === "string" &&
      typeof item.message === "string",
  );
}
async function parseResponse(
  response: Response,
): Promise<unknown> {
  if (
    response.status === 204 ||
    response.status === 205 ||
    response.body === null
  ) {
    return undefined;
  }
  const text = await response.text();
  if (!text.trim()) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    if (response.ok) {
      throw new ApiError(
        "Sunucudan geçersiz bir yanıt alındı.",
        [],
        response.status,
      );
    }
    return undefined;
  }
}
export const request = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const callerSignal = options.signal;
  const timeoutSignal = AbortSignal.timeout(TIMEOUT_MS);
  const signal = callerSignal
    ? AbortSignal.any([callerSignal, timeoutSignal])
    : timeoutSignal;
  const headers = new Headers(options.headers);
  if (
    options.body !== undefined &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(buildRequestUrl(path), {
      ...options,
      headers,
      signal,
    });
  } catch {
    if (callerSignal?.aborted) {
      throw new RequestAbortedError();
    }
    if (timeoutSignal.aborted) {
      throw new ApiError(
        "İstek zaman aşımına uğradı. Lütfen tekrar dene.",
      );
    }
    if (signal.aborted) {
      throw new RequestAbortedError();
    }
    throw new ApiError(
      "Bağlantı kurulamadı. Lütfen tekrar dene; bilgilerin formda korunuyor.",
    );
  }
  let data: unknown;
  try {
    data = await parseResponse(response);
  } catch (error) {
    if (callerSignal?.aborted || signal.aborted) {
      throw new RequestAbortedError();
    }
    if (timeoutSignal.aborted) {
      throw new ApiError(
        "İstek zaman aşımına uğradı. Lütfen tekrar dene.",
      );
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Yanıt okunamadı. Lütfen tekrar dene.",
      [],
      response.status,
    );
  }
  if (!response.ok) {
    const errorData =
      typeof data === "object" && data !== null
        ? (data as ApiErrorResponse)
        : {};
    const message =
      typeof errorData.message === "string"
        ? errorData.message
        : "İşlem tamamlanamadı. Lütfen tekrar dene.";
    throw new ApiError(
      message,
      parseFieldErrors(errorData.fieldErrors),
      response.status,
    );
  }
  return data as T;
};
