---
name: thunderbit-extract
description: >
  Extract structured data from web pages using AI. Automatically suggests
  extraction fields if no schema is provided, then lets the user edit fields
  via natural language before extracting.
  Use for scraping product listings, contact info, tables, or any structured content.
---

# Thunderbit Extract

Extract structured data from a web page. If the user doesn't provide a schema,
automatically discover fields first, then let the user edit via natural language.

## Workflow

1. Parse the user's input:
   - `url` (required): the web page URL
   - `schema` (optional): JSON Schema defining what to extract
   - `prompt` (optional): natural language guidance (e.g. "Extract product info")
   - `renderMode`: "none" (default), "basic", or "full"
   - `timeout`: timeout in ms, 5000-120000 (default: 60000)
   - `waitFor`: wait time after page load, 0-10000ms (default: 0)

2. **If no schema is provided**:
   a. Call `thunderbit_suggest_fields` with the URL and prompt to discover extractable fields.
   b. Present the suggested fields in an **editable numbered table** using this format:

      ```
      AI 推荐了 N 个可提取字段：

      | #  | 字段名         | 类型   | 提取说明                   | 状态 |
      |----|---------------|--------|---------------------------|------|
      | 1  | 区块高度       | NUMBER | 比特币区块的高度            | ✅   |
      | 2  | 出块者地址     | TEXT   | 创建该区块的出块者地址       | ✅   |
      | 3  | 总交易数       | NUMBER | 该区块中包含的交易总数量     | ✅   |
      ...

      您可以用自然语言调整字段，例如：
      - "去掉第 2 和第 4 个字段"
      - "把'出块者地址'改名为'矿池地址'"
      - "新增一个'矿池名称'文本字段，提取说明：出块矿池的名称"
      - "只保留 1、3、5"
      - "全部保留，直接提取"

      请告诉我需要做什么调整？
      ```

   c. **Wait for user response** — interpret the user's natural language instructions:
      - **删除/去掉/移除**: Remove specified fields by number or name
      - **新增/添加/加一个**: Add a new field with name, type, and instruction
      - **改名/重命名**: Rename a field
      - **修改类型**: Change field type (TEXT/NUMBER/URL/EMAIL/DATE)
      - **修改说明/instruction**: Update extraction instruction
      - **只保留**: Keep only the specified fields, remove the rest
      - **全部保留 / 直接提取 / 确认 / OK**: Accept current fields and proceed
      - User may give **multiple instructions at once** (e.g. "去掉 2 和 4，新增一个矿池名称字段")

   d. After each edit, **show the updated table** with the same numbered format so the user can verify. Repeat steps c-d until the user confirms.

   e. Convert the confirmed fields into a JSON Schema for extraction:
      ```json
      {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "field_name": {
              "type": "text|number|url|email|date",
              "instruction": "How to extract this field"
            }
          }
        }
      }
      ```

3. **If schema is provided** (or confirmed from step 2):
   a. Call `thunderbit_extract` with the URL and schema.
   b. Return the extracted data in a clear, formatted table.

## Field Editing Rules

- Field types must be one of: `TEXT`, `NUMBER`, `URL`, `EMAIL`, `DATE`
- When the user says "去掉 URL 类型的字段", remove all fields with type URL
- When adding a field, infer reasonable defaults:
  - If no type specified, default to `TEXT`
  - If no instruction specified, generate one based on the field name and page context
- Preserve the original field order; append new fields at the end
- Always show the # column for easy reference

## Schema Format

The schema for `thunderbit_extract` should follow this structure:
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "field_name": {
        "type": "text|number|url|email|date",
        "instruction": "How to extract this field"
      }
    }
  }
}
```

## Error Handling

- **401**: "API Key invalid. Check your THUNDERBIT_API_KEY environment variable."
- **402**: "Insufficient credits. Top up at https://thunderbit.com/billing"
- **429**: "Rate limit exceeded. Please try again shortly."
- **Timeout**: "Page load timed out. Try increasing timeout or switching renderMode to 'full'."

## Cost

- Suggest fields: free (0 credits)
- Extract: 20 credits per call