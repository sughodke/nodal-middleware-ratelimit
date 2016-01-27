'use strict';

var RateLimitMiddleware = (function() {

  function RateLimitMiddleware(options) {
    this._hits = {}
    this._options = {
      timeWindow: 60 * 1000,
      max: 100,
      message: 'Too many requests, please try again later.',
      statusCode: 429,
      includeHeaders: true,
      exclude: [
        // '::1'
      ]
    };

    if (undefined !== options) {
      this._options = Object.assign({}, this._options, options)
    }

    this._resetLimiter()
  }

  RateLimitMiddleware.prototype.setOptions = function setOptions() {
    this._options = Object.assign({}, this._options, options);
    this._resetLimiter();
  }

  RateLimitMiddleware.prototype._resetLimiter = function _resetLimiter() {
    // use a simple date to track window expiration vs using say setInterval()
    // Idea borrowed from https://github.com/ovx/strict-rate-limiter
    this._reset = new Date();
    this._reset.setMilliseconds(this._reset.getMilliseconds() + this._options.timeWindow);
    this._hits = {}
  }

  RateLimitMiddleware.prototype.exec = function exec(controller, callback) {

    let ip = controller.request().headers['x-forwarded-for'] || controller.request().connection.remoteAddress;

    // has it been more than this._options.timeWindow?
    if ( this._reset < new Date()) {
      this._resetLimiter();
    }

    if ( this._options.exclude.indexOf(ip) !== -1) {
        this._hits[ip] = 1;
    } else if (this._hits[ip]) {
        this._hits[ip]++;
    } else {
        this._hits[ip] = 1;
    }

    let reqLeft = Math.max(0, this._options.max - this._hits[ip]);
    if (this._options.max && this._hits[ip] > this._options.max) {
      controller.tooManyRequests(this._options.message, {
        host: ip,
        maximum: this._options.max,
        requests: this._hits[ip],
        resets: this._reset
      });
    }

    if ( this._options.includeHeaders ) {
      controller.setHeader('X-RateLimit-Limit', this._options.max);
      controller.setHeader('X-RateLimit-Remaining', reqLeft);
      controller.setHeader('X-Rate-Limit-Reset', this._reset);
    }

    callback(null)

  }

  return RateLimitMiddleware;

})();

module.exports = RateLimitMiddleware;
