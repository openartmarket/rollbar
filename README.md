This library is a zero-dependency Rollbar client that works in any JavaScript environment,
including CloudFlare Workers, Bun, Deno, Node.js.

## Why?

The official library is very complex (XXX LOC)

## Differences from the official library:

The `Rollbar.log` signature is different from the official library in several ways.

### Async

The `log` function returns a promise. This means you should call it like this:

```typescript
await rollbar.log(...)
```

If you need synchronous logging, you should use a wrapper:

```typescript
const rollbar = new SyncRollbar(request)
rollbar.log(...)
rollbar.log(...)

// Wait for all logs to be sent
await rollbar.wait()
```