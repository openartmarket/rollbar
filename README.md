This library is a zero-dependency Rollbar client that works in any JavaScript environment,
including CloudFlare Workers, Bun, Deno, Node.js.

## Differences from the official library:

* 95% smaller (~300 SLOC vs ~7000 SLOC)
* Only implements the [create-item](https://docs.rollbar.com/reference/create-item) API
* Async API 

## Installation

    npm install @openartmarket/rollbar

## Usage

Define global options:

```typescript
const options: RollbarOptions = {
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  data: {
    environment: 'some-environment',
    code_version: '0.0.0',
    framework: 'anything',
    platform: 'node',

    // You may want to specify more properties here
  },
};
```

Create a new `Rollbar` instance:

```typescript
import Rollbar from `@openartmarket/rollbar`

const rollbar = new Rollbar(options)
```

It's *strongly recommended* to pass a `request` and `person` object 
to the `Rollbar` constructor.

You **must** create the `rollbar` instance *before* the `request` body is read by your code or web framework. This is to ensure the library can [clone](https://developer.mozilla.org/en-US/docs/Web/API/Request/clone) the request and extract details.

```typescript
const rollbar = new Rollbar({...options, request, person})
```

Log to rollbar. You can only log `string` and `Error` objects.

```typescript
await rollbar.debug(...)
await rollbar.info(...)
await rollbar.warning(...)
await rollbar.error(...)
await rollbar.critical(...)
```

If you log from synchronous functions and can't use `await`, you **must** call `wait`
somewhere else in your code to make sure all rollbar requests complete.

This is especially important on Cloudflare Workers. If you forget to do this, 
your worker might exit before pending Rollbar requests have finished.

```typescript
rollbar.debug(...)
rollbar.debug(...)

// Wait for all logging requests to be sent
await rollbar.wait()
```