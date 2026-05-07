'use strict';

var formatOutput = require('../formatter').formatOutput;

/**
 * Register the `suggest-fields` command.
 * @param {import('commander').Command} program
 * @param {function} getClient
 * @param {function} getFormat
 */
function register(program, getClient, getFormat) {
  program
    .command('suggest-fields <url>')
    .description('Suggest extraction fields for a web page using AI')
    .option('--prompt <text>', 'Custom prompt to guide field suggestion')
    .option('--country-code <CC>', 'Country code for geo-targeting', 'US')
    .action(async function (url, opts) {
      try {
        var client = getClient();
        var result = await client.suggestFields({
          url: url,
          prompt: opts.prompt,
          countryCode: opts.countryCode,
        });
        formatOutput(result, getFormat(), 'suggest-fields');
      } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}

module.exports = { register };
