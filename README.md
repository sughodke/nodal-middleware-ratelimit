#  Nodal Rate Limit Middleware

This is a middleware package for [Nodal](http://www.nodaljs.com) that performs basic rate-limiting on public endpoints. This is meant to be a functional example how how to write middleware for nodal and package as an npm module. Thus this is intentionally a very rudimentary and simplistic piece of middleware and my wish it others will build more advanced rate limiters.

# DO NOT USE THIS YET
This module, while totally functional, has hardcoded options. Until PR [#149](https://github.com/keithwhor/nodal/pull/149) on the main Nodal repo is merged. The module currently allows **100 connections per minute per ip**. Localhost (::1 in Nodal) is also intentionally not excluded to allow for testing.

## Install

```sh
$ npm install --save nodal-middleware-ratelimit
```

## Useage

In your `app/app.js` you first need to require the module

```javascript
const RateLimitMiddleware = require('nodal-middleware-ratelimit');
```

Then simply use it

```javascript
this.middleware.use(RateLimitMiddleware)
```

Whola your aapp is now being rate limited!.

## Configuring

If you want to override the default rate limiting options, you can pass configuration options when you `use()` your middleware. For example if you wnat to limit requests to 50 per every 5 minutes and allow local requests to excluded from limiting, you would do the following.

```javascript
this.middleware.use(RateLimitMiddleware, { max: 50, timeWindow: 300 * 100, exclude: ['::1'] })
```

| Optiona | Description          | Default |
| ------------- | ----------- | ----------- |
| timeWindow     | Time window for rate limiting in milliseconds| 60000 (1 miniute) |
| max | Maximum number of requests in the rate limiting window | 100 requests |
| message | Message to send back when rate limit exceeded | Too many requests, please try again later |
| includeHeaders | Set X-RateLimit-Limit, X-Rate-Limit-Reset & X-RateLimit-Remaining headers | true|
| exclude | Array of IPs that are excluded from rate limiting | [] |
| enforce | Array of route prefix's to limit the application of limiting to routes | [] |


## Apply Rate Limiting to specific routes
Nodal currently doesn't allow middleware/renderware to be scoped to a route, thus rate limiting is applied over all your routes by default. This mens that if your building a Nodal application with both API and UI routes, it will limit your UI endpoints as well. To control the behavior you can send an optional `enforce` option that is an array of route prefixes to limit the rate limiting to. For example to limit it to only routes starting with `/v1`

```javascript
this.middleware.use(RateLimitMiddleware, { enforce: [ '/v1/' ] })
```


## Headers

This middleware can optionally (and by default doest) set the following X- headers

| Name | Description          |
| ------------- | ----------- |
| X-RateLimit-Limit      | Request limit per minute|
| X-RateLimit-Remaining      | The number of requests left for the time window|
| X-Rate-Limit-Reset     | Timestamp of when the limit will be reset     |


## Error Messages

When the limit is reach, the middleware will return a HTTP Too Many Request (429) response and the body will be a JSON document. The `error` key in the document will look like the following

```json
{
  "error":{
    "message": "Too many requests, please try again later.",
    "details": {
      "host": "::1",
      "maximum": 20,
      "requests": 22,
      "resets":" 2016-01-27T03:58:48.072Z"
    }
  }
}
```
