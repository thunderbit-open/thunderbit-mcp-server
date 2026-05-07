'use strict';

var fs = require('fs');
var path = require('path');
var formatOutput = require('../formatter').formatOutput;
var parseSchema = require('./extract').parseSchema;

var POLL_INTERVAL_MS = 5000;

/**
 * Collect URLs from args and optional file.
 * @param {string[]} urls - positional URL args
 * @param {string} [filePath] - path to a file with one URL per line
 * @returns {string[]}
 */
function collectUrls(urls, filePath) {
  var result = urls ? urls.slice() : [];
  if (filePath) {
    var resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      console.error('Error: URL file not found:', resolved);
      process.exit(1);
    }
    var lines = fs.readFileSync(resolved, 'utf8')
      .split('\n')
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l.length > 0 && !l.startsWith('#'); });
    result = result.concat(lines);
  }
  if (result.length === 0) {
    console.error('Error: No URLs provided. Pass URLs as arguments or use --file.');
    process.exit(1);
  }
  return result;
}

/**
 * Poll a batch job until completion.
 * @param {function} statusFn - async (jobId) => response
 * @param {string} jobId
 * @param {string} format
 */
async function pollJob(statusFn, jobId, format) {
  var spinChars = ['|', '/', '-', '\\'];
  var tick = 0;

  while (true) {
    var status = await statusFn(jobId);
    var data = status.data || status;
    var state = (data.status || '').toLowerCase();

    if (state === 'completed' || state === 'failed' || state === 'cancelled') {
      formatOutput(status, format, 'batch');
      return;
    }

    var completed = data.completed || 0;
    var total = data.total || '?';
    var ch = spinChars[tick % spinChars.length];
    process.stderr.write('\r' + ch + ' Polling job ' + jobId + ' — ' + completed + '/' + total + ' completed...');
    tick++;

    await sleep(POLL_INTERVAL_MS);
  }
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

/**
 * Register batch commands as a command group.
 * @param {import('commander').Command} program
 * @param {function} getClient
 * @param {function} getFormat
 */
function register(program, getClient, getFormat) {
  var batch = program
    .command('batch')
    .description('Batch operations for distill and extract');

  // batch distill
  batch
    .command('distill [urls...]')
    .description('Create a batch distill job')
    .option('--file <path>', 'Read URLs from a file (one per line)')
    .option('--timeout <ms>', 'Timeout per page in milliseconds', '30000')
    .option('--no-poll', 'Create the job but do not poll for results')
    .action(async function (urls, opts) {
      try {
        var client = getClient();
        var allUrls = collectUrls(urls, opts.file);
        var result = await client.batchDistillCreate({
          urls: allUrls,
          timeout: parseInt(opts.timeout, 10),
        });

        var jobId = result.id || result.job_id || (result.data && (result.data.id || result.data.job_id));

        if (!jobId) {
          formatOutput(result, getFormat(), 'batch');
          return;
        }

        console.error('Batch distill job created: ' + jobId);

        if (opts.poll === false) {
          formatOutput(result, getFormat(), 'batch');
          return;
        }

        await pollJob(
          function (id) { return client.batchDistillStatus(id); },
          jobId,
          getFormat()
        );
      } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });

  // batch extract
  batch
    .command('extract [urls...]')
    .description('Create a batch extract job')
    .requiredOption('--schema <json-or-file>', 'Extraction schema as JSON string or path to JSON file')
    .option('--file <path>', 'Read URLs from a file (one per line)')
    .option('--timeout <ms>', 'Timeout per page in milliseconds', '60000')
    .option('--no-poll', 'Create the job but do not poll for results')
    .action(async function (urls, opts) {
      try {
        var client = getClient();
        var allUrls = collectUrls(urls, opts.file);
        var schema = parseSchema(opts.schema);
        var result = await client.batchExtractCreate({
          urls: allUrls,
          schema: schema,
          timeout: parseInt(opts.timeout, 10),
        });

        var jobId = result.id || result.job_id || (result.data && (result.data.id || result.data.job_id));

        if (!jobId) {
          formatOutput(result, getFormat(), 'batch');
          return;
        }

        console.error('Batch extract job created: ' + jobId);

        if (opts.poll === false) {
          formatOutput(result, getFormat(), 'batch');
          return;
        }

        await pollJob(
          function (id) { return client.batchExtractStatus(id); },
          jobId,
          getFormat()
        );
      } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}

module.exports = { register };
