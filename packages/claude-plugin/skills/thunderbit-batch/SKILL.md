---
name: thunderbit-batch
description: >
  Process multiple URLs in batch — either distill to Markdown or extract
  structured data. Handles job creation and automatic status polling.
  Supports up to 100 URLs per batch.
---

# Thunderbit Batch

Process multiple URLs in batch mode. Supports two modes:
- **distill**: convert pages to Markdown (1 credit/URL)
- **extract**: extract structured data (20 credits/URL)

## Workflow

1. Parse the user's input:
   - `urls` (required): list of URLs to process (max 100)
   - `mode`: "distill" or "extract" (infer from context if not specified)
   - For extract mode:
     - `schema` (optional): JSON Schema defining what to extract
     - `prompt` (optional): guidance for field suggestion
   - `timeout`: timeout per URL in ms (default: 30000 for distill, 60000 for extract)

2. **Determine mode**:
   - If user says "convert", "markdown", "distill" → distill mode
   - If user says "extract", "scrape data", "get fields" → extract mode
   - If unclear, ask the user

3. **For extract mode without schema**:
   a. Call `thunderbit_suggest_fields` on the first URL to discover fields.
   b. Present suggested fields and ask user to confirm.
   c. Convert confirmed fields into a JSON Schema.

4. **Create the batch job**:
   - Distill mode: call `thunderbit_batch_distill_create` with urls and timeout.
   - Extract mode: call `thunderbit_batch_extract_create` with urls, schema, and timeout.
   - Save the returned `jobId`.

5. **Poll for results**:
   a. Wait 10 seconds, then call the corresponding status tool (`thunderbit_batch_distill_status` or `thunderbit_batch_extract_status`).
   b. Report progress to the user (e.g. "Processing: 15/50 completed").
   c. If status is not yet "completed", wait another 10 seconds and poll again.
   d. Continue until the job completes or fails.

6. **Return results**:
   - Present results in a formatted table or list.
   - Report any failed URLs separately.

## Error Handling

- **401**: "API Key invalid. Check your THUNDERBIT_API_KEY environment variable."
- **402**: "Insufficient credits. Top up at https://thunderbit.com/billing"
- **429**: "Rate limit exceeded. Please try again shortly."
- **Job failed**: Report the failure reason and list of failed URLs.

## Cost

- Batch distill: 1 credit per URL
- Batch extract: 20 credits per URL
