'use strict';

const https = require('https');
const http = require('http');
const url = require('url');

class ThunderbitClient {
  /**
   * @param {string} apiKey
   * @param {string} baseUrl
   */
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * @param {object} options
   * @param {string} options.url
   * @param {string} [options.renderMode]
   * @param {number} [options.timeout]
   * @param {string} [options.countryCode]
   */
  async distill(options) {
    const body = { url: options.url };
    if (options.renderMode) body.renderMode = options.renderMode;
    if (options.timeout != null) body.timeout = options.timeout;
    if (options.countryCode) body.country_code = options.countryCode;
    return this._post('/openapi/v1/distill', body);
  }

  /**
   * @param {object} options
   * @param {string} options.url
   * @param {string} [options.prompt]
   * @param {string} [options.countryCode]
   */
  async suggestFields(options) {
    const body = { url: options.url };
    if (options.prompt) body.prompt = options.prompt;
    if (options.countryCode) body.country_code = options.countryCode;
    return this._post('/openapi/v1/suggest_fields', body);
  }

  /**
   * @param {object} options
   * @param {string} options.url
   * @param {object} options.schema
   * @param {string} [options.renderMode]
   * @param {number} [options.timeout]
   */
  async extract(options) {
    const body = { url: options.url, schema: options.schema };
    if (options.renderMode) body.renderMode = options.renderMode;
    if (options.timeout != null) body.timeout = options.timeout;
    return this._post('/openapi/v1/extract', body);
  }

  /**
   * @param {object} options
   * @param {string[]} options.urls
   * @param {number} [options.timeout]
   */
  async batchDistillCreate(options) {
    const body = { urls: options.urls };
    if (options.timeout != null) body.timeout = options.timeout;
    return this._post('/openapi/v1/batch/distill', body);
  }

  /**
   * @param {string} jobId
   * @param {number} [page]
   * @param {number} [pageSize]
   */
  async batchDistillStatus(jobId, page, pageSize) {
    let path = '/openapi/v1/batch/distill/' + encodeURIComponent(jobId);
    const qs = [];
    if (page != null) qs.push('page=' + page);
    if (pageSize != null) qs.push('pageSize=' + pageSize);
    if (qs.length) path += '?' + qs.join('&');
    return this._get(path);
  }

  /**
   * @param {object} options
   * @param {string[]} options.urls
   * @param {object} options.schema
   * @param {number} [options.timeout]
   */
  async batchExtractCreate(options) {
    const body = { urls: options.urls, schema: options.schema };
    if (options.timeout != null) body.timeout = options.timeout;
    return this._post('/openapi/v1/batch/extract', body);
  }

  /**
   * @param {string} jobId
   * @param {number} [page]
   * @param {number} [pageSize]
   */
  async batchExtractStatus(jobId, page, pageSize) {
    let path = '/openapi/v1/batch/extract/' + encodeURIComponent(jobId);
    const qs = [];
    if (page != null) qs.push('page=' + page);
    if (pageSize != null) qs.push('pageSize=' + pageSize);
    if (qs.length) path += '?' + qs.join('&');
    return this._get(path);
  }

  // ---- async single-page (submit + poll) ----

  async asyncDistillSubmit(options) {
    const body = { url: options.url };
    if (options.renderMode) body.renderMode = options.renderMode;
    if (options.timeout != null) body.timeout = options.timeout;
    if (options.countryCode) body.country_code = options.countryCode;
    return this._post('/openapi/v1/async/distill', body);
  }

  async asyncDistillStatus(jobId) {
    return this._get('/openapi/v1/async/distill/' + encodeURIComponent(jobId));
  }

  async asyncExtractSubmit(options) {
    const body = { url: options.url, schema: options.schema };
    if (options.renderMode) body.renderMode = options.renderMode;
    if (options.timeout != null) body.timeout = options.timeout;
    return this._post('/openapi/v1/async/extract', body);
  }

  async asyncExtractStatus(jobId) {
    return this._get('/openapi/v1/async/extract/' + encodeURIComponent(jobId));
  }

  /**
   * Submit async job and poll until completion.
   * @param {Function} submitFn - async function that submits the job
   * @param {Function} statusFn - async function that checks job status
   * @param {object} [opts]
   * @param {number} [opts.interval=3000] - poll interval in ms
   * @param {number} [opts.maxAttempts=40] - max poll attempts
   * @param {Function} [opts.onProgress] - callback(status, attempt)
   */
  async pollUntilDone(submitFn, statusFn, opts) {
    const interval = (opts && opts.interval) || 3000;
    const maxAttempts = (opts && opts.maxAttempts) || 40;
    const onProgress = opts && opts.onProgress;

    const submitResult = await submitFn();
    if (!submitResult || !submitResult.data || !submitResult.data.id) {
      throw new ApiError('Failed to submit async job', 0);
    }
    const jobId = submitResult.data.id;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, interval));
      const status = await statusFn(jobId);
      const data = status && status.data;
      if (!data) continue;

      if (onProgress) onProgress(data.status, i + 1);

      if (data.status === 'completed') return status;
      if (data.status === 'failed') {
        const errMsg = (status.error && status.error.message) || 'Job failed';
        throw new ApiError(errMsg, 0);
      }
    }
    throw new ApiError('Job still processing after ' + (maxAttempts * interval / 1000) + 's. Job ID: ' + jobId, 0);
  }

  // ---- internal ----

  /**
   * @param {string} path
   * @param {object} body
   * @returns {Promise<object>}
   */
  _post(path, body) {
    return this._request('POST', path, body);
  }

  /**
   * @param {string} path
   * @returns {Promise<object>}
   */
  _get(path) {
    return this._request('GET', path, null);
  }

  /**
   * @param {string} method
   * @param {string} path
   * @param {object|null} body
   * @returns {Promise<object>}
   */
  _request(method, path, body) {
    return new Promise((resolve, reject) => {
      const fullUrl = this.baseUrl + path;
      const parsed = new url.URL(fullUrl);
      const isHttps = parsed.protocol === 'https:';
      const transport = isHttps ? https : http;

      const payload = body != null ? JSON.stringify(body) : null;

      const reqOptions = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: method,
        headers: {
          'Authorization': 'Bearer ' + this.apiKey,
          'Accept': 'application/json',
        },
      };

      if (payload) {
        reqOptions.headers['Content-Type'] = 'application/json';
        reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = transport.request(reqOptions, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          const statusCode = res.statusCode;

          if (statusCode === 401) {
            reject(new ApiError('Authentication failed. Check your API key.', statusCode));
            return;
          }
          if (statusCode === 402) {
            reject(new ApiError('Insufficient credits. Top up at https://thunderbit.com/billing', statusCode));
            return;
          }
          if (statusCode === 429) {
            reject(new ApiError('Rate limit exceeded. Please try again shortly.', statusCode));
            return;
          }

          let data;
          try {
            data = JSON.parse(raw);
          } catch (e) {
            if (statusCode >= 400) {
              reject(new ApiError('HTTP ' + statusCode + ': ' + raw.substring(0, 200), statusCode));
              return;
            }
            data = raw;
          }

          if (statusCode >= 400) {
            var msg;
            if (data && data.error && typeof data.error === 'object') {
              msg = data.error.message || data.error.code || JSON.stringify(data.error);
            } else {
              msg = (data && data.message) || (data && data.error) || ('HTTP ' + statusCode);
            }
            reject(new ApiError(String(msg), statusCode));
            return;
          }

          resolve(data);
        });
      });

      req.on('error', (err) => reject(new ApiError(err.message, 0)));

      if (payload) req.write(payload);
      req.end();
    });
  }
}

class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

module.exports = { ThunderbitClient, ApiError };
