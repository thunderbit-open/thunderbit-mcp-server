# Thunderbit MCP Server

> Open-source toolkit for the Thunderbit Open API — CLI, MCP server, and Claude Code plugin.

[![npm: @thunderbit/mcp-server](https://img.shields.io/npm/v/@thunderbit/mcp-server.svg?label=%40thunderbit%2Fmcp-server)](https://npmjs.com/package/@thunderbit/mcp-server)
[![npm: @thunderbit/cli](https://img.shields.io/npm/v/@thunderbit/cli.svg?label=%40thunderbit%2Fcli)](https://npmjs.com/package/@thunderbit/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

This monorepo ships three packages, all backed by the [Thunderbit Open API](https://thunderbit.com/open-api):

| Package | Purpose | Audience |
|---------|---------|----------|
| [`@thunderbit/cli`](packages/cli) | Command-line tool for distill / extract / batch | Developers, scripts, CI |
| [`@thunderbit/mcp-server`](packages/mcp-server) | Model Context Protocol server (7 tools) | AI assistants — Claude Desktop, Cursor, Cline, Claude Code |
| [`thunderbit` Claude Code plugin](packages/claude-plugin) | Bundled MCP + 4 skills | Claude Code users |

Get a free API key at [thunderbit.com/open-api](https://thunderbit.com/open-api).

---

## Quick Start

### CLI

```bash
npm i -g @thunderbit/cli
export THUNDERBIT_API_KEY=tb_your_api_key_here
thunderbit distill https://example.com -f markdown
```

### MCP Server (Claude Desktop / Cursor / Cline)

Edit your MCP client config:

```json
{
  "mcpServers": {
    "thunderbit": {
      "command": "npx",
      "args": ["-y", "@thunderbit/mcp-server"],
      "env": { "THUNDERBIT_API_KEY": "tb_your_api_key_here" }
    }
  }
}
```

### Claude Code Plugin

```bash
claude plugin marketplace add thunderbit-engineering/thunderbit-mcp-server
claude plugin add thunderbit
export THUNDERBIT_API_KEY=tb_your_api_key_here
```

---

## What you can do

- Convert any web page into clean, LLM-ready Markdown
- Extract structured data from pages using JSON Schema
- Get AI-suggested fields when you don't know what's on a page
- Run batch jobs on up to 100 URLs at a time

---

## Pricing

Distill — 1 credit. Extract — 20 credits. Suggest fields — 1 credit. Batch jobs scale per URL. Status polling is free.

Top up at [thunderbit.com/billing](https://thunderbit.com/billing).

---

## Development

```bash
git clone https://github.com/thunderbit-engineering/thunderbit-mcp-server.git
cd thunderbit-mcp-server
# each package is independent
cd packages/mcp-server && npm install
cd packages/cli && npm install
```

---

## License

MIT © Thunderbit
