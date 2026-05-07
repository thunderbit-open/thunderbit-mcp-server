'use strict';

/**
 * Format and print output based on the chosen format.
 *
 * @param {object} data - The API response
 * @param {string} format - 'json' | 'table' | 'markdown'
 * @param {string} commandType - 'distill' | 'suggest-fields' | 'extract' | 'batch'
 */
function formatOutput(data, format, commandType) {
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (format === 'markdown') {
    // For distill, print the markdown content only
    const md = extractMarkdown(data);
    if (md) {
      console.log(md);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
    return;
  }

  // format === 'table'
  if (commandType === 'distill') {
    const md = extractMarkdown(data);
    if (md) {
      console.log(md);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
    return;
  }

  if (commandType === 'suggest-fields') {
    printFieldsTable(data);
    return;
  }

  if (commandType === 'extract') {
    printExtractTable(data);
    return;
  }

  // batch or unknown — fall back to JSON
  console.log(JSON.stringify(data, null, 2));
}

function extractMarkdown(data) {
  if (typeof data === 'string') return data;
  if (data && data.markdown) return data.markdown;
  if (data && data.data && data.data.markdown) return data.data.markdown;
  if (data && data.content) return data.content;
  return null;
}

/**
 * Print suggested fields as an ASCII table.
 */
function printFieldsTable(data) {
  let fields = data;
  if (data && data.data) fields = data.data;
  if (data && data.fields) fields = data.fields;
  if (data && data.data && data.data.fields) fields = data.data.fields;

  if (!Array.isArray(fields)) {
    // Maybe it's an object with field entries
    if (typeof fields === 'object' && fields !== null) {
      fields = Object.entries(fields).map(function (entry) {
        if (typeof entry[1] === 'object') {
          return Object.assign({ name: entry[0] }, entry[1]);
        }
        return { name: entry[0], type: String(entry[1]) };
      });
    } else {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
  }

  if (fields.length === 0) {
    console.log('(no fields)');
    return;
  }

  // Collect all keys
  var keys = [];
  fields.forEach(function (f) {
    Object.keys(f).forEach(function (k) {
      if (keys.indexOf(k) === -1) keys.push(k);
    });
  });

  printTable(keys, fields);
}

/**
 * Print extracted data as an ASCII table.
 */
function printExtractTable(data) {
  var rows = data;
  if (data && data.data) rows = data.data;
  if (rows && !Array.isArray(rows) && rows.data) rows = rows.data;
  if (data && data.results) rows = data.results;

  if (!Array.isArray(rows)) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (rows.length === 0) {
    console.log('(no data)');
    return;
  }

  var keys = [];
  rows.forEach(function (r) {
    Object.keys(r).forEach(function (k) {
      if (keys.indexOf(k) === -1) keys.push(k);
    });
  });

  printTable(keys, rows);
}

/**
 * Print a simple ASCII table.
 * @param {string[]} columns
 * @param {object[]} rows
 */
function printTable(columns, rows) {
  // Calculate column widths
  var widths = columns.map(function (c) { return c.length; });
  rows.forEach(function (row) {
    columns.forEach(function (col, i) {
      var val = row[col];
      var len = (val == null ? '' : String(val)).length;
      if (len > widths[i]) widths[i] = len;
    });
  });

  // Cap max width at 50
  widths = widths.map(function (w) { return Math.min(w, 50); });

  // Header
  var header = '| ' + columns.map(function (col, i) {
    return pad(col, widths[i]);
  }).join(' | ') + ' |';

  var separator = '|' + widths.map(function (w) {
    return repeat('-', w + 2);
  }).join('|') + '|';

  console.log(header);
  console.log(separator);

  // Rows
  rows.forEach(function (row) {
    var line = '| ' + columns.map(function (col, i) {
      var val = row[col];
      var s = val == null ? '' : String(val);
      if (s.length > 50) s = s.substring(0, 47) + '...';
      return pad(s, widths[i]);
    }).join(' | ') + ' |';
    console.log(line);
  });
}

function pad(str, len) {
  while (str.length < len) str += ' ';
  return str;
}

function repeat(ch, n) {
  var s = '';
  for (var i = 0; i < n; i++) s += ch;
  return s;
}

module.exports = { formatOutput };
