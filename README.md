#  Nodal Rate Limit Middleware

This is a middleware package for [Nodal](http://www.nodaljs.com) that performs basic rate-limiting on public endpoints. This is intentionally a very simplistic piece of middleware that does not share any state.

# DO NOT USE THIS YET
This module, while totally functional, has hardcoded options. Until PR [#149](https://github.com/keithwhor/nodal/pull/149) on the main Nodal repo is merged. The module currently allows **100 connections per minute per ip**. Localhost (::1 in Nodal) is also intentionally not excluded to allow for testing.

## Install

```sh
$ npm install --save nodal-middleware-ratelimit
```

## Useage

In your `app/app.js` you first need to require the module

```javascript
const RateLimitMiddleware = require('@intabulas/nodal-middleware-ratelimit');
```

Then simply use it

```javascript
this.middleware.use(RateLimitMiddleware)
```

## Headers

This middleware currently sets the following headers

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
