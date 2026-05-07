import { z } from "zod";
import { ApiError } from "../client.js";

const apiKeyField = z.string().optional().describe(
  "Thunderbit API key (tb_xxx). Optional if THUNDERBIT_API_KEY env var is set."
);

function textResult(text) {
  return { content: [{ type: "text", text: typeof text === "string" ? text : JSON.stringify(text, null, 2) }] };
}

function errorResult(message) {
  return { content: [{ type: "text", text: message }], isError: true };
}

function wrap(fn) {
  return async (args) => {
    try {
      return await fn(args);
    } catch (e) {
      if (e instanceof ApiError) {
        const hint = e.status === 402
          ? " — Top up at https://thunderbit.com/billing"
          : e.status === 401
          ? " — Check your API key at https://thunderbit.com/open-api"
          : e.status === 429
          ? " — Rate limit exceeded, retry later"
          : "";
        return errorResult(`Thunderbit API error (${e.status || "network"}): ${e.message}${hint}`);
      }
      return errorResult(`Internal error: ${e.message || String(e)}`);
    }
  };
}

export function registerTools(server, client) {
  server.registerTool(
    "thunderbit_distill",
    {
      title: "Distill Web Page to Markdown",
      description:
        "Convert a web page into clean, LLM-ready Markdown. Ideal for research, content analysis, RAG ingestion, and reading articles behind complex layouts. Costs 1 credit per call.",
      inputSchema: {
        url: z.string().url().describe("Web page URL to convert"),
        timeout: z.number().int().min(5000).max(60000).optional().describe("Timeout in ms (5000-60000)"),
        waitFor: z.number().int().min(0).max(10000).optional().describe("Wait time after load for dynamic content (ms)"),
        includeTags: z.array(z.string()).optional().describe("HTML tags to include"),
        excludeTags: z.array(z.string()).optional().describe("HTML tags to exclude"),
        countryCode: z.string().length(2).optional().describe("ISO 2-letter country code (default US)"),
        renderMode: z.enum(["none", "basic", "full"]).optional().describe("Page render mode"),
        apiKey: apiKeyField,
      },
    },
    wrap(async ({ apiKey, ...rest }) => {
      const res = await client.distill(apiKey, rest);
      const md = res?.data?.markdown ?? res?.markdown;
      if (md) return textResult(md);
      return errorResult(`Distill failed: ${res?.error?.message || "Unknown error"}`);
    })
  );

  server.registerTool(
    "thunderbit_extract",
    {
      title: "Extract Structured Data",
      description:
        "Extract structured data from a web page using a JSON Schema. Perfect for lead generation, price monitoring, competitive analysis, and dataset building. Use thunderbit_suggest_fields first if you don't know the page structure. Costs 20 credits per call.",
      inputSchema: {
        url: z.string().url().describe("Web page URL"),
        schema: z.record(z.any()).describe("JSON Schema defining the data structure to extract"),
        timeout: z.number().int().min(5000).max(120000).optional(),
        waitFor: z.number().int().min(0).max(10000).optional(),
        renderMode: z.enum(["none", "basic", "full"]).optional(),
        apiKey: apiKeyField,
      },
    },
    wrap(async ({ apiKey, ...rest }) => {
      const res = await client.extract(apiKey, rest);
      return textResult(res?.data ?? res);
    })
  );

  server.registerTool(
    "thunderbit_suggest_fields",
    {
      title: "Suggest Extractable Fields",
      description:
        "Analyze a web page and automatically suggest extractable fields/columns. Start here when you don't know what data a page contains — returns field names, types, and extraction instructions usable directly with thunderbit_extract. Costs 1 credit per call.",
      inputSchema: {
        url: z.string().url().describe("Web page URL to analyze"),
        prompt: z.string().optional().describe("Optional guidance for what fields to suggest"),
        countryCode: z.string().length(2).optional(),
        apiKey: apiKeyField,
      },
    },
    wrap(async ({ apiKey, ...rest }) => {
      const res = await client.suggestFields(apiKey, rest);
      return textResult(res?.data ?? res);
    })
  );

  server.registerTool(
    "thunderbit_batch_distill_create",
    {
      title: "Create Batch Distill Job",
      description:
        "Create a batch job to distill multiple URLs into Markdown (max 100 URLs). Returns a job ID — poll thunderbit_batch_distill_status until complete. Costs 1 credit per URL.",
      inputSchema: {
        urls: z.array(z.string().url()).min(1).max(100).describe("URLs to distill (max 100)"),
        timeout: z.number().int().min(5000).max(60000).optional(),
        apiKey: apiKeyField,
      },
    },
    wrap(async ({ apiKey, ...rest }) => {
      const res = await client.createBatchDistill(apiKey, rest);
      return textResult(res?.data ?? res);
    })
  );

  server.registerTool(
    "thunderbit_batch_distill_status",
    {
      title: "Check Batch Distill Status",
      description: "Poll the status and retrieve results of a batch distill job. Free (0 credits).",
      inputSchema: {
        jobId: z.string().describe("Job ID returned from thunderbit_batch_distill_create"),
        page: z.number().int().min(0).optional().describe("Page number, 0-based (default 0)"),
        pageSize: z.number().int().min(1).max(100).optional().describe("Results per page (default 20, max 100)"),
        apiKey: apiKeyField,
      },
    },
    wrap(async ({ apiKey, jobId, page, pageSize }) => {
      const res = await client.getBatchDistillStatus(apiKey, jobId, page ?? 0, pageSize ?? 20);
      return textResult(res?.data ?? res);
    })
  );

  server.registerTool(
    "thunderbit_batch_extract_create",
    {
      title: "Create Batch Extract Job",
      description:
        "Create a batch job to extract structured data from multiple URLs (max 100 URLs). Returns a job ID — poll thunderbit_batch_extract_status until complete. Costs 20 credits per URL.",
      inputSchema: {
        urls: z.array(z.string().url()).min(1).max(100),
        schema: z.record(z.any()).describe("JSON Schema applied to every URL"),
        timeout: z.number().int().min(5000).max(120000).optional(),
        apiKey: apiKeyField,
      },
    },
    wrap(async ({ apiKey, ...rest }) => {
      const res = await client.createBatchExtract(apiKey, rest);
      return textResult(res?.data ?? res);
    })
  );

  server.registerTool(
    "thunderbit_batch_extract_status",
    {
      title: "Check Batch Extract Status",
      description: "Poll the status and retrieve results of a batch extract job. Free (0 credits).",
      inputSchema: {
        jobId: z.string(),
        page: z.number().int().min(0).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
        apiKey: apiKeyField,
      },
    },
    wrap(async ({ apiKey, jobId, page, pageSize }) => {
      const res = await client.getBatchExtractStatus(apiKey, jobId, page ?? 0, pageSize ?? 20);
      return textResult(res?.data ?? res);
    })
  );
}
