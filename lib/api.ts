export class ApiError extends Error {
  constructor(
    message: string,
    public fieldErrors: { field: string; message: string }[] = [],
    public status = 0,
  ) {
    super(message);
  }
}

/** Bir istek, yerine yenisi geldiği veya bileşen kapandığı için iptal edildi. Bu bir hata değil; ekranda gösterilmez. */
export class RequestAbortedError extends Error {
  constructor() {
    super("İstek iptal edildi.");
    this.name = "RequestAbortedError";
  }
}

export function isAborted(error: unknown): boolean {
  return error instanceof RequestAbortedError;
}

const TIMEOUT_MS = 12000;

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Zaman aşımı her istekte korunur; çağıranın sinyali varsa ikisi birlikte çalışır.
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const caller = options.signal ?? null;
  const signal = caller ? AbortSignal.any([caller, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(`/api/club/${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
      signal,
    });
  } catch (error) {
    // İptal, bağlantı hatası gibi gösterilmez.
    if (caller?.aborted) throw new RequestAbortedError();
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("İstek zaman aşımına uğradı. Lütfen tekrar dene.");
    }
    throw new ApiError(
      "Bağlantı kurulamadı. Lütfen tekrar dene; bilgilerin formda korunuyor.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      data.message || "İşlem tamamlanamadı. Lütfen tekrar dene.",
      data.fieldErrors || [],
      response.status,
    );
  return data as T;
}
