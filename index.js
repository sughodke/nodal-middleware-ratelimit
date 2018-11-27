'use strict';
const client = require('client.js');

// Borrowed from Nodal (core/required/utilities.js)
function parseRegexFromString(str) {

  if (str[str.length - 1] === '/') {
    str = str.substr(0, str.length - 1);
  }

  str = str.replace(/(?:(?:\/:(\w+?)\/)|(\*))/g, (m, name, aster) => {
    return m === '*' ? '(.*?)' : '/([^\/]+?)/';
  });

  str = str.replace(/\/:(\w+?)$/, (m, name) => {
    return '(?:/([^\/]+?))?';
  });

  str = str.replace(/\/\(\.\*\?\)/g, '(?:\/(.*?))?');

  return new RegExp(`^${str}/?$`);
}


class RateLimitMiddleware {
  constructor (options) {
    this._options = {
      timeWindow: 60 * 1000,
      max: 100,
      message: 'Too many requests, please try again later',
      includeHeaders: true,
      exclude: [
        // '::1'
      ],
      enforce: [
      ],
    };

    if (undefined !== options) {
      this._options = Object.assign({}, this._options, options);
    }

    // Convert the route prefixes to regular expressions
    this._options.enforce = this._options.enforce.map(re => parseRegexFromString(re));

    this._resetLimiter();
  }

  setOptions(options) {
    if (undefined !== options) {
      this._options = Object.assign({}, this._options, options);
      this._resetLimiter();
    }
  }

  _resetLimiter() {
    // use a simple date to track window expiration vs using say setInterval()
    // Idea borrowed from https://github.com/ovx/strict-rate-limiter
    this._reset = new Date();
    this._reset.setMilliseconds(this._reset.getMilliseconds() + this._options.timeWindow);
  };

  async exec(controller, callback) {
    const route = controller.request().url;
    let excluded = false;

    this._options.enforce.forEach(re => {
      if (!re.exec(route)) {
        excluded = true;
      }
    });

    if (!excluded) {
      const ip = controller.request().headers['x-forwarded-for'] ||
        controller.request().connection.remoteAddress;

      // has it been more than this._options.timeWindow?
      if (this._reset < new Date()) {
        this._resetLimiter();
      }

      let curHits = await client.mgetAsync(ip).catch(err => console.log(err));

      if (this._options.exclude.indexOf(ip) !== -1) {
        client.set(ip, 1);
      } else if (curHits) {
        client.incr(ip);
      } else {
        client.set(ip, 1, 'EX', 10 * 60 * 60);
      }

      curHits = await client.mgetAsync(ip).catch(err => console.log(err));

      const reqLeft = Math.max(0, this._options.max - curHits);

      if (this._options.max && curHits > this._options.max) {
        controller.tooManyRequests(this._options.message, {
          host: ip,
          maximum: this._options.max,
          requests: curHits,
          resets: this._reset,
        });
      }

      if (this._options.includeHeaders) {
        controller.setHeader('X-RateLimit-Limit', this._options.max);
        controller.setHeader('X-RateLimit-Remaining', reqLeft);
        controller.setHeader('X-Rate-Limit-Reset', this._reset);
      }
    }
    callback(null);
  }
}

module.exports = RateLimitMiddleware;
