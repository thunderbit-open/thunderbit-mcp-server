'use strict';

var formatOutput = require('../formatter').formatOutput;

/**
 * Register the `distill` command.
 * @param {import('commander').Command} program
 * @param {function} getClient - () => ThunderbitClient
 * @param {function} getFormat - () => string
 */
function register(program, getClient, getFormat) {
  program
    .command('distill <url>')
    .description('Distill a web page into clean Markdown')
    .option('--render-mode <mode>', 'Render mode: none, basic, or full', 'none')
    .option('--timeout <ms>', 'Request timeout in milliseconds', '30000')
    .option('--country-code <CC>', 'Country code for geo-targeting', 'US')
    .option('--sync', 'Use synchronous mode instead of the default async mode')
    .action(async function (url, opts) {
      try {
        var client = getClient();
        var options = {
          url: url,
          renderMode: opts.renderMode,
          timeout: parseInt(opts.timeout, 10),
          countryCode: opts.countryCode,
        };

        var result;
        if (opts.sync) {
          result = await client.distill(options);
        } else {
          result = await client.pollUntilDone(
            function () { return client.asyncDistillSubmit(options); },
            function (jobId) { return client.asyncDistillStatus(jobId); },
            { onProgress: function (status, attempt) {
                process.stderr.write('\rProcessing... (' + attempt + ')');
              }
            }
          );
          process.stderr.write('\n');
        }
        formatOutput(result, getFormat(), 'distill');
      } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}

module.exports = { register };
