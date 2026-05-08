import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ThunderbitClient } from "./client.js";
import { registerTools } from "./tools/index.js";

export async function start() {
  const server = new McpServer(
    {
      name: "thunderbit-open-api",
      version: "1.0.0",
    },
    {
      capabilities: { tools: {} },
      instructions:
        "Thunderbit Open API MCP Server provides web scraping and structured data extraction tools. " +
        "Use 'thunderbit_suggest_fields' to analyze a page and discover extractable fields before extraction. " +
        "Use 'thunderbit_distill' to convert web pages to clean Markdown (1 credit). " +
        "Use 'thunderbit_extract' to extract structured data using a JSON Schema (20 credits). " +
        "Batch versions are available for processing up to 100 URLs at once. " +
        "All tools require a Thunderbit API key — set via THUNDERBIT_API_KEY env var or pass as 'apiKey' parameter. " +
        "Get your API key at https://app.thunderbit.com/console.",
    }
  );

  const client = new ThunderbitClient({
    baseUrl: process.env.THUNDERBIT_API_BASE_URL,
    apiKey: process.env.THUNDERBIT_API_KEY,
    timeoutMs: Number(process.env.THUNDERBIT_TIMEOUT_MS) || 120000,
  });

  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
