---
name: thunderbit-distill
description: >
  Convert any web page into clean, LLM-ready Markdown using Thunderbit.
  Ideal for research, RAG pipeline ingestion, content analysis,
  reading articles behind complex layouts, and archiving web content.
---

# Thunderbit Distill

Convert a web page to clean Markdown using the `thunderbit_distill` MCP tool.

## Workflow

1. Parse the user's input for URL and optional parameters:
   - `url` (required): the web page URL
   - `renderMode`: "none", "basic" (default), or "full" (for JS-heavy pages)
   - `excludeTags`: comma-separated HTML tags to exclude (e.g. "nav,footer,aside")
   - `includeTags`: comma-separated HTML tags to include exclusively
   - `countryCode`: ISO 2-letter code for geo-targeting (default: "US")
   - `timeout`: timeout in ms, 5000-60000 (default: 30000)
   - `waitFor`: wait time after page load for dynamic content, 0-10000ms (default: 0)

2. Call the `thunderbit_distill` MCP tool with the parsed parameters.

3. Return the Markdown content directly to the user without extra wrapping.

## Error Handling

- **401**: "API Key invalid. Check your THUNDERBIT_API_KEY environment variable."
- **402**: "Insufficient credits. Top up at https://thunderbit.com/billing"
- **429**: "Rate limit exceeded. Please try again shortly."
- **Timeout**: "Page load timed out. Try increasing timeout or switching renderMode to 'full'."

## Cost

1 credit per call.
