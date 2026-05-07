const DEFAULT_BASE_URL = "https://openapi.thunderbit.com";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class ThunderbitClient {
  constructor({ baseUrl, apiKey, timeoutMs = 120000 } = {}) {
    this.baseUrl = (baseUrl || process.env.THUNDERBIT_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
    this.defaultApiKey = apiKey || process.env.THUNDERBIT_API_KEY || "";
    this.timeoutMs = timeoutMs;
  }

  resolveApiKey(override) {
    const key = override || this.defaultApiKey;
    if (!key) {
      throw new ApiError(401, "Missing API key. Set THUNDERBIT_API_KEY env var or pass apiKey in tool arguments.");
    }
    return key;
  }

  async request(method, path, { apiKey, body, query } = {}) {
    const url = new URL(this.baseUrl + path);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${this.resolveApiKey(apiKey)}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const text = await res.text();
      let json;
      try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }

      if (!res.ok) {
        const msg = json?.message || json?.error?.message || json?.error || res.statusText;
        throw new ApiError(res.status, typeof msg === "string" ? msg : JSON.stringify(msg));
      }
      return json;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (e.name === "AbortError") throw new ApiError(0, `Request timeout after ${this.timeoutMs}ms`);
      throw new ApiError(0, e.message || String(e));
    } finally {
      clearTimeout(timer);
    }
  }

  distill(apiKey, payload) {
    return this.request("POST", "/openapi/v1/distill", { apiKey, body: payload });
  }

  extract(apiKey, payload) {
    return this.request("POST", "/openapi/v1/extract", { apiKey, body: payload });
  }

  suggestFields(apiKey, payload) {
    return this.request("POST", "/openapi/v1/suggest_fields", { apiKey, body: payload });
  }

  createBatchDistill(apiKey, payload) {
    return this.request("POST", "/openapi/v1/batch/distill", { apiKey, body: payload });
  }

  getBatchDistillStatus(apiKey, jobId, page = 0, pageSize = 20) {
    return this.request("GET", `/openapi/v1/batch/distill/${encodeURIComponent(jobId)}`, {
      apiKey, query: { page, pageSize },
    });
  }

  createBatchExtract(apiKey, payload) {
    return this.request("POST", "/openapi/v1/batch/extract", { apiKey, body: payload });
  }

  getBatchExtractStatus(apiKey, jobId, page = 0, pageSize = 20) {
    return this.request("GET", `/openapi/v1/batch/extract/${encodeURIComponent(jobId)}`, {
      apiKey, query: { page, pageSize },
    });
  }
}
