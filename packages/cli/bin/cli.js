#!/usr/bin/env node
'use strict';

var Command = require('commander').Command;
var ThunderbitClient = require('../src/client').ThunderbitClient;

var distillCmd = require('../src/commands/distill');
var suggestFieldsCmd = require('../src/commands/suggest-fields');
var extractCmd = require('../src/commands/extract');
var batchCmd = require('../src/commands/batch');

var DEFAULT_BASE_URL = 'https://openapi.thunderbit.com';

var program = new Command();

program
  .name('thunderbit')
  .description('CLI for Thunderbit Open API — distill, extract, and suggest fields from web pages')
  .version(require('../package.json').version, '-V, --version')
  .option('-k, --api-key <key>', 'API key (or set THUNDERBIT_API_KEY env var)')
  .option('--base-url <url>', 'API base URL (or set THUNDERBIT_API_BASE_URL env var)')
  .option('-f, --format <format>', 'Output format: json, table, or markdown', 'json');

/**
 * Resolve the API key from flag or env var.
 * @returns {string}
 */
function resolveApiKey() {
  var key = program.opts().apiKey || process.env.THUNDERBIT_API_KEY;
  if (!key) {
    console.error('Error: API key is required. Use --api-key or set THUNDERBIT_API_KEY environment variable.');
    process.exit(1);
  }
  return key;
}

/**
 * Resolve the base URL from flag or env var.
 * @returns {string}
 */
function resolveBaseUrl() {
  return program.opts().baseUrl || process.env.THUNDERBIT_API_BASE_URL || DEFAULT_BASE_URL;
}

/**
 * Create a ThunderbitClient with resolved config.
 * @returns {ThunderbitClient}
 */
function getClient() {
  return new ThunderbitClient(resolveApiKey(), resolveBaseUrl());
}

/**
 * Get the output format.
 * @returns {string}
 */
function getFormat() {
  return program.opts().format || 'json';
}

// Register commands
distillCmd.register(program, getClient, getFormat);
suggestFieldsCmd.register(program, getClient, getFormat);
extractCmd.register(program, getClient, getFormat);
batchCmd.register(program, getClient, getFormat);

// Parse and run
program.parseAsync(process.argv).catch(function (err) {
  console.error('Error:', err.message);
  process.exit(1);
});
