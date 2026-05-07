'use strict';

var fs = require('fs');
var path = require('path');
var readline = require('readline');
var formatOutput = require('../formatter').formatOutput;

/**
 * Parse a schema value: if it starts with { or [, parse as JSON; otherwise read from file.
 * @param {string} value
 * @returns {object}
 */
function parseSchema(value) {
  var trimmed = value.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      console.error('Error: Invalid JSON in --schema:', e.message);
      process.exit(1);
    }
  }
  // Treat as file path
  var filePath = path.resolve(trimmed);
  if (!fs.existsSync(filePath)) {
    console.error('Error: Schema file not found:', filePath);
    process.exit(1);
  }
  var content = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Error: Invalid JSON in schema file:', e.message);
    process.exit(1);
  }
}

/**
 * Convert suggested fields array to the extract schema format.
 * @param {Array<{name: string, type: string, instruction: string}>} fields
 * @returns {object}
 */
function fieldsToSchema(fields) {
  var properties = {};
  fields.forEach(function (f) {
    properties[f.name] = {
      type: f.type || 'TEXT',
      instruction: f.instruction || '',
    };
  });
  return {
    type: 'array',
    items: {
      type: 'object',
      properties: properties,
    },
  };
}

/**
 * Create a readline interface for interactive prompts.
 * @returns {readline.Interface}
 */
function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: true,
  });
}

/**
 * Ask a question and return the answer.
 * @param {readline.Interface} rl
 * @param {string} question
 * @returns {Promise<string>}
 */
function ask(rl, question) {
  return new Promise(function (resolve) {
    rl.question(question, function (answer) {
      resolve(answer.trim());
    });
  });
}

/**
 * Display the current fields list with numbered indices and selection state.
 * @param {Array<{name: string, type: string, instruction: string, selected: boolean}>} fields
 */
function displayFields(fields) {
  console.error('');
  console.error('  #  | Selected | Name                     | Type   | Instruction');
  console.error('  ---+----------+--------------------------+--------+-------------------------------------------');
  fields.forEach(function (f, i) {
    var num = String(i + 1).padStart(3, ' ');
    var sel = f.selected ? '  [x]   ' : '  [ ]   ';
    var name = (f.name || '').padEnd(24, ' ').substring(0, 24);
    var type = (f.type || '').padEnd(6, ' ').substring(0, 6);
    var inst = (f.instruction || '').substring(0, 43);
    console.error('  ' + num + '  | ' + sel + ' | ' + name + ' | ' + type + ' | ' + inst);
  });
  console.error('');
}

/**
 * Display help text for interactive commands.
 */
function displayHelp() {
  console.error('  Commands:');
  console.error('    <numbers>    Toggle fields by number (e.g. "1 3 5" or "1,3,5")');
  console.error('    all          Select all fields');
  console.error('    none         Deselect all fields');
  console.error('    add          Add a new custom field');
  console.error('    rm <number>  Remove a field (e.g. "rm 2")');
  console.error('    edit <num>   Edit a field (e.g. "edit 3")');
  console.error('    done / d     Confirm and proceed to extraction');
  console.error('    quit / q     Abort');
  console.error('    help / ?     Show this help');
  console.error('');
}

/**
 * Run the interactive field editing loop.
 * @param {Array<{name: string, type: string, instruction: string}>} suggestedFields
 * @returns {Promise<Array|null>} edited fields, or null if user aborted
 */
async function interactiveEditFields(suggestedFields) {
  var fields = suggestedFields.map(function (f) {
    return {
      name: f.name,
      type: f.type || 'TEXT',
      instruction: f.instruction || '',
      selected: true,
    };
  });

  var rl = createRL();

  console.error('AI suggested ' + fields.length + ' fields. Edit the list below:');
  displayFields(fields);
  displayHelp();

  try {
    while (true) {
      var input = await ask(rl, '  > ');
      var lower = input.toLowerCase();

      if (lower === 'done' || lower === 'd' || lower === '') {
        var selected = fields.filter(function (f) { return f.selected; });
        if (selected.length === 0) {
          console.error('  No fields selected. Select at least one field, or type "quit" to abort.');
          continue;
        }
        rl.close();
        return selected;
      }

      if (lower === 'quit' || lower === 'q') {
        rl.close();
        return null;
      }

      if (lower === 'help' || lower === '?') {
        displayHelp();
        continue;
      }

      if (lower === 'all') {
        fields.forEach(function (f) { f.selected = true; });
        displayFields(fields);
        continue;
      }

      if (lower === 'none') {
        fields.forEach(function (f) { f.selected = false; });
        displayFields(fields);
        continue;
      }

      // Add a new field
      if (lower === 'add') {
        var name = await ask(rl, '    Field name: ');
        if (!name) { console.error('    (cancelled)'); continue; }
        var type = await ask(rl, '    Type (TEXT/NUMBER/URL/EMAIL/DATE) [TEXT]: ');
        var instruction = await ask(rl, '    Instruction (optional): ');
        fields.push({
          name: name,
          type: (type || 'TEXT').toUpperCase(),
          instruction: instruction || '',
          selected: true,
        });
        displayFields(fields);
        continue;
      }

      // Remove a field: "rm 2" or "rm 1,3"
      if (lower.startsWith('rm ')) {
        var rmNums = parseNumbers(input.substring(3), fields.length);
        if (rmNums.length === 0) {
          console.error('  Invalid number. Use "rm <number>".');
          continue;
        }
        // Remove in reverse order to keep indices stable
        rmNums.sort(function (a, b) { return b - a; });
        rmNums.forEach(function (idx) { fields.splice(idx, 1); });
        displayFields(fields);
        continue;
      }

      // Edit a field: "edit 3"
      if (lower.startsWith('edit ')) {
        var editNums = parseNumbers(input.substring(5), fields.length);
        if (editNums.length !== 1) {
          console.error('  Edit one field at a time. Usage: "edit <number>"');
          continue;
        }
        var fi = editNums[0];
        var f = fields[fi];
        console.error('    Editing field: ' + f.name);
        var newName = await ask(rl, '    Name [' + f.name + ']: ');
        var newType = await ask(rl, '    Type [' + f.type + ']: ');
        var newInst = await ask(rl, '    Instruction [' + f.instruction + ']: ');
        if (newName) f.name = newName;
        if (newType) f.type = newType.toUpperCase();
        if (newInst) f.instruction = newInst;
        displayFields(fields);
        continue;
      }

      // Toggle fields by numbers: "1 3 5" or "1,3,5" or "2-5"
      var nums = parseNumbers(input, fields.length);
      if (nums.length > 0) {
        nums.forEach(function (idx) {
          fields[idx].selected = !fields[idx].selected;
        });
        displayFields(fields);
        continue;
      }

      console.error('  Unknown command. Type "help" for available commands.');
    }
  } catch (e) {
    rl.close();
    throw e;
  }
}

/**
 * Parse user input into zero-based field indices.
 * Supports: "1 3 5", "1,3,5", "2-5", mixed "1,3-5,7"
 * @param {string} input
 * @param {number} maxLen
 * @returns {number[]}
 */
function parseNumbers(input, maxLen) {
  var results = [];
  var parts = input.split(/[\s,]+/).filter(Boolean);
  parts.forEach(function (part) {
    var rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      var start = parseInt(rangeMatch[1], 10);
      var end = parseInt(rangeMatch[2], 10);
      for (var i = start; i <= end; i++) {
        if (i >= 1 && i <= maxLen) results.push(i - 1);
      }
    } else {
      var n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= maxLen) results.push(n - 1);
    }
  });
  // Deduplicate
  return results.filter(function (v, i, a) { return a.indexOf(v) === i; });
}

/**
 * Register the `extract` command.
 * @param {import('commander').Command} program
 * @param {function} getClient
 * @param {function} getFormat
 */
function register(program, getClient, getFormat) {
  program
    .command('extract <url>')
    .description('Extract structured data from a web page')
    .option('--schema <json-or-file>', 'Extraction schema as JSON string or path to JSON file')
    .option('-i, --interactive', 'Interactive mode: suggest fields, let you edit, then extract')
    .option('--prompt <text>', 'Prompt for field suggestion (used with --interactive)')
    .option('--render-mode <mode>', 'Render mode: none, basic, or full', 'none')
    .option('--timeout <ms>', 'Request timeout in milliseconds', '60000')
    .option('--sync', 'Use synchronous mode instead of the default async mode')
    .option('--save-schema <file>', 'Save the final schema to a JSON file for reuse')
    .action(async function (url, opts) {
      try {
        var client = getClient();
        var schema;

        if (opts.interactive || !opts.schema) {
          // Interactive mode: suggest fields → edit → extract
          if (opts.schema) {
            // If both --schema and --interactive, start from provided schema
            schema = parseSchema(opts.schema);
          } else {
            // Suggest fields first
            console.error('Analyzing page for extractable fields...');
            var suggestResult = await client.suggestFields({
              url: url,
              prompt: opts.prompt,
              countryCode: 'US',
            });

            var fields = suggestResult;
            if (suggestResult && suggestResult.data) fields = suggestResult.data;
            if (fields && fields.fields) fields = fields.fields;

            if (!Array.isArray(fields) || fields.length === 0) {
              console.error('No fields suggested. Please provide a schema with --schema.');
              process.exit(1);
            }

            if (opts.interactive) {
              // Interactive editing
              var editedFields = await interactiveEditFields(fields);
              if (!editedFields) {
                console.error('Aborted.');
                process.exit(0);
              }
              schema = fieldsToSchema(editedFields);
              console.error('Using ' + editedFields.length + ' field(s) for extraction.');
            } else {
              // Non-interactive but no schema: use all suggested fields
              console.error('Using all ' + fields.length + ' suggested field(s).');
              schema = fieldsToSchema(fields);
            }
          }
        } else {
          schema = parseSchema(opts.schema);
        }

        // Save schema if requested
        if (opts.saveSchema) {
          var schemaJson = JSON.stringify(schema, null, 2);
          fs.writeFileSync(path.resolve(opts.saveSchema), schemaJson, 'utf8');
          console.error('Schema saved to ' + opts.saveSchema);
        }

        // Execute extraction
        console.error('Extracting data...');
        var options = {
          url: url,
          schema: schema,
          renderMode: opts.renderMode,
          timeout: parseInt(opts.timeout, 10),
        };

        var result;
        if (opts.sync) {
          result = await client.extract(options);
        } else {
          result = await client.pollUntilDone(
            function () { return client.asyncExtractSubmit(options); },
            function (jobId) { return client.asyncExtractStatus(jobId); },
            { onProgress: function (status, attempt) {
                process.stderr.write('\rProcessing... (' + attempt + ')');
              }
            }
          );
          process.stderr.write('\n');
        }
        formatOutput(result, getFormat(), 'extract');
      } catch (err) {
        if (err.name === 'ApiError' || err.message.startsWith('Error:')) {
          console.error('Error:', err.message);
          process.exit(1);
        }
        throw err;
      }
    });
}

module.exports = { register, parseSchema, fieldsToSchema, interactiveEditFields };