# Thunderbit Claude Code Plugin

> AI-powered web scraping and structured data extraction inside Claude Code — bundled MCP server + 4 skills.

## Install

```bash
claude plugin marketplace add thunderbit-engineering/thunderbit-mcp-server
claude plugin add thunderbit
```

Then set your API key (get one at [thunderbit.com/open-api](https://thunderbit.com/open-api)):

```bash
export THUNDERBIT_API_KEY=tb_your_api_key_here
```

## What's bundled

- **MCP server** `@thunderbit/mcp-server` — auto-spawned via `npx`. 7 tools: distill, extract, suggest_fields, batch (×4).
- **Skills** — natural-language entry points that guide Claude through the right tool sequence:
  - `thunderbit-distill` — "convert this page to markdown"
  - `thunderbit-extract` — "extract products from this page"
  - `thunderbit-suggest-fields` — "what data can be extracted from this page"
  - `thunderbit-batch` — "process this list of URLs"

## Usage

After install, just talk to Claude Code:

> Convert https://news.ycombinator.com to Markdown.

> Extract product name, price, and rating from https://example.com/products

> Pull article titles from these 50 URLs.

The skills will guide the model to pick the right MCP tool and parameters.

## Credits / pricing

| Tool | Cost |
|------|------|
| `suggest_fields`, `distill` | 1 credit |
| `extract` | 20 credits |
| Batch jobs | 1 or 20 credits per URL |
| Status polling | Free |

Top up at [thunderbit.com/billing](https://thunderbit.com/billing).

## License

MIT
