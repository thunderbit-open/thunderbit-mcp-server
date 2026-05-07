#!/usr/bin/env node
import { start } from "../src/server.js";

start().catch((err) => {
  process.stderr.write(`[thunderbit-mcp] fatal: ${err?.stack || err?.message || String(err)}\n`);
  process.exit(1);
});
