# @thunderbit/mcp-server

> Thunderbit MCP Server — AI-powered web scraping and structured data extraction for Claude, ChatGPT, and any MCP-compatible AI assistant.

[![npm version](https://img.shields.io/npm/v/@thunderbit/mcp-server.svg)](https://npmjs.com/package/@thunderbit/mcp-server)
[![MCP Compatible](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io)

A Model Context Protocol (MCP) server that lets AI assistants:

- Convert any web page into clean, LLM-ready **Markdown**
- Extract **structured data** from web pages using JSON Schema
- Get **AI-suggested fields** for unknown page structures
- Run **batch jobs** on up to 100 URLs at a time

Backed by the Thunderbit Open API. Get a free API key at [thunderbit.com/open-api](https://thunderbit.com/open-api).

---

## Quick Start (Claude Desktop)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "thunderbit": {
      "command": "npx",
      "args": ["-y", "@thunderbit/mcp-server"],
      "env": {
        "THUNDERBIT_API_KEY": "tb_your_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop. The Thunderbit tools should appear in the tool picker.

## Quick Start (Cursor / Cline / other MCP clients)

Same config shape — `command: "npx"`, `args: ["-y", "@thunderbit/mcp-server"]`.

## Manual install

```bash
npm install -g @thunderbit/mcp-server
thunderbit-mcp
```

Or one-shot:

```bash
THUNDERBIT_API_KEY=tb_xxx npx -y @thunderbit/mcp-server
```

---

## Tools

| Tool | Cost | Purpose |
|------|------|---------|
| `thunderbit_suggest_fields` | 1 credit | Discover what data is on a page |
| `thunderbit_distill` | 1 credit | Page → clean Markdown |
| `thunderbit_extract` | 20 credits | Page → structured JSON via schema |
| `thunderbit_batch_distill_create` | 1 credit/URL | Distill up to 100 URLs |
| `thunderbit_batch_distill_status` | Free | Poll batch distill results |
| `thunderbit_batch_extract_create` | 20 credits/URL | Extract from up to 100 URLs |
| `thunderbit_batch_extract_status` | Free | Poll batch extract results |

### Recommended workflow

```
1. thunderbit_suggest_fields  →  See what data the page has
2. thunderbit_extract         →  Pull it as structured JSON
   OR thunderbit_distill      →  Get the page as Markdown
3. (Bulk) batch_*_create      →  Submit up to 100 URLs
4. (Bulk) batch_*_status      →  Poll until done
```

---

## Configuration

| Env Var | Description | Default |
|---------|-------------|---------|
| `THUNDERBIT_API_KEY` | API key (`tb_...`) | — (required) |
| `THUNDERBIT_API_BASE_URL` | API base URL | `https://openapi.thunderbit.com` |
| `THUNDERBIT_TIMEOUT_MS` | HTTP timeout per call | `120000` |

API key precedence: tool-call `apiKey` argument → `THUNDERBIT_API_KEY` env var → error.

---

## Errors

| HTTP Status | Hint |
|-------------|------|
| 401 | Invalid API key — check `THUNDERBIT_API_KEY` |
| 402 | Out of credits — top up at [thunderbit.com/billing](https://thunderbit.com/billing) |
| 429 | Rate-limit exceeded — retry later |

Errors are returned as MCP tool errors (`isError: true`) so the AI can react gracefully.

---

## Local Development

```bash
git clone https://github.com/thunderbit-engineering/thunderbit-mcp-server.git
cd thunderbit-mcp-server/packages/mcp-server
npm install
THUNDERBIT_API_KEY=tb_xxx node bin/cli.js
```

The server speaks MCP over stdio. To test interactively, use [`@modelcontextprotocol/inspector`](https://github.com/modelcontextprotocol/inspector):

```bash
npx @modelcontextprotocol/inspector node bin/cli.js
```

---

## License

MIT © Thunderbit
