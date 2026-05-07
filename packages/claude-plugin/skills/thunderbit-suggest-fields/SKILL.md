---
name: thunderbit-suggest-fields
description: >
  Analyze a web page and suggest extractable fields/columns using AI.
  Ideal for discovering what structured data can be extracted before
  calling thunderbit_extract. Free — no credits consumed.
---

# Thunderbit Suggest Fields

Analyze a web page and suggest extraction fields using the `thunderbit_suggest_fields` MCP tool.

## Workflow

1. Parse the user's input for URL and optional parameters:
   - `url` (required): the web page URL to analyze
   - `prompt` (optional): guidance for field suggestion (e.g. "Extract product information")
   - `countryCode`: ISO 2-letter code for geo-targeting (default: "US")

2. Call the `thunderbit_suggest_fields` MCP tool with the parsed parameters.

3. Present the suggested fields in an **editable numbered table**:

   ```
   AI 推荐了 N 个可提取字段：

   | #  | 字段名         | 类型   | 提取说明                   |
   |----|---------------|--------|---------------------------|
   | 1  | field_name    | TYPE   | instruction               |
   ...

   您可以：
   - 直接使用这些字段进行提取（调用 /extract）
   - 用自然语言调整字段，例如："去掉第 2 个"、"新增一个 xxx 字段"
   ```

4. If the user wants to proceed with extraction, guide them to use the `/extract` skill or the `thunderbit_extract` tool with the schema built from the fields.

## Error Handling

- **401**: "API Key invalid. Check your THUNDERBIT_API_KEY environment variable."
- **429**: "Rate limit exceeded. Please try again shortly."
- **Timeout**: "Page load timed out. The page may be too complex to analyze."

## Cost

Free — no credits consumed.