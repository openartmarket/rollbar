import { describe, expect, it } from 'vitest';
import { Rollbar, RollbarOptions } from '../src/index';
import { Data } from '../src/types';

const options: RollbarOptions = {
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  data: {
    environment: '@openartmarket/rollbar',
    code_version: '0.0.0',
    framework: 'anything',
    platform: 'node',
  },
};

describe('Rollbar', () => {
  it('waits for logs', async () => {
    const rollbar = new Rollbar({ ...options, url: 'http://localhost:9999/nothing-here' });
    rollbar.log('hello');
    expect(rollbar.wait()).rejects.toThrowError('fetch failed');
  });

  it('creates a payload for an error', async () => {
    const rollbar = new Rollbar(options);

    const errorMessage = `test-${Date.now()}`;
    const payload = await rollbar.toPayload(new Error(errorMessage));
    if (!('trace' in payload.data.body)) {
      throw new Error('No trace');
    }
    const expected: Partial<Data> = {
      environment: '@openartmarket/rollbar',
      code_version: '0.0.0',
      framework: 'anything',
      platform: 'node',
      // Added by the library
      language: 'javascript',
    };
    expect(payload.data).toMatchObject(expected);
  });

  it('creates a payload for an error', async () => {
    const rollbar = new Rollbar(options);

    const errorMessage = `test-${Date.now()}`;
    const payload = await rollbar.toPayload(new Error(errorMessage));
    if (!('trace' in payload.data.body)) {
      throw new Error('No trace');
    }
    expect(payload.data.body.trace.exception).toMatchObject({
      class: 'Error',
      message: errorMessage,
    });
  });

  it('creates a payload for a message', async () => {
    const rollbar = new Rollbar(options);

    const payload = await rollbar.toPayload('hello');
    if (!('message' in payload.data.body)) {
      throw new Error('No message');
    }
    expect(payload.data.body.message).toMatchObject({
      body: 'hello',
    });
  });

  it('creates a payload for a regular form', async () => {
    const form = new URLSearchParams();
    form.append('foo', 'bar');
    const request = new Request('https://example.com/foo/bar?baz=qux', {
      method: 'POST',
      headers: new Headers({
        'User-Agent': 'test',
      }),
      body: form,
    });
    // Create rollbar before reading the request body.
    const rollbar = new Rollbar({ ...options, request });

    // Read the body
    await request.text();

    const errorMessage = `test-${Date.now()}`;
    const payload = await rollbar.toPayload(new Error(errorMessage));

    expect(payload.data.request).toMatchObject({
      url: 'https://example.com/foo/bar?baz=qux',
      method: 'POST',
      body: undefined,
      POST: { foo: 'bar' },
      query_string: '?baz=qux',
      GET: { baz: 'qux' },
      user_ip: undefined,
      params: {},
    });
  });

  it('creates a payload for a multipart form', async () => {
    const form = new FormData();
    form.append('foo', 'bar');
    const request = new Request('https://example.com/foo/bar?baz=qux', {
      method: 'POST',
      headers: new Headers({
        'User-Agent': 'test',
      }),
      body: form,
    });
    // Create rollbar before reading the request body.
    const rollbar = new Rollbar({ ...options, request });

    // Read the body
    await request.text();

    const errorMessage = `test-${Date.now()}`;
    const payload = await rollbar.toPayload(new Error(errorMessage));

    expect(payload.data.request).toMatchObject({
      url: 'https://example.com/foo/bar?baz=qux',
      method: 'POST',
      body: undefined,
      POST: { foo: 'bar' },
      query_string: '?baz=qux',
      GET: { baz: 'qux' },
      user_ip: undefined,
      params: {},
    });
  });

  it('creates a payload for JSON request', async () => {
    const form = JSON.stringify({ foo: 'bar' });
    const request = new Request('https://example.com/foo/bar?baz=qux', {
      method: 'POST',
      headers: new Headers({
        'User-Agent': 'test',
        'Content-Type': 'application/json',
      }),
      body: form,
    });
    // Create rollbar before reading the request body.
    const rollbar = new Rollbar({ ...options, request });

    // Read the body
    await request.text();

    const errorMessage = `test-${Date.now()}`;
    const payload = await rollbar.toPayload(new Error(errorMessage));

    expect(payload.data.request).toMatchObject({
      url: 'https://example.com/foo/bar?baz=qux',
      method: 'POST',
      body: undefined,
      POST: { foo: 'bar' },
      query_string: '?baz=qux',
      GET: { baz: 'qux' },
      user_ip: undefined,
      params: {},
    });
  });

  it('creates a payload for a text body', async () => {
    const request = new Request('https://example.com/foo/bar?baz=qux', {
      method: 'POST',
      headers: new Headers({
        'User-Agent': 'test',
      }),
      body: 'Hello',
    });
    // Create rollbar before reading the request body.
    const rollbar = new Rollbar({ ...options, request });

    // Read the body
    await request.text();

    const errorMessage = `test-${Date.now()}`;
    const payload = await rollbar.toPayload(new Error(errorMessage));

    expect(payload.data.request).toMatchObject({
      url: 'https://example.com/foo/bar?baz=qux',
      method: 'POST',
      body: 'Hello',
      POST: undefined,
      query_string: '?baz=qux',
      GET: { baz: 'qux' },
      user_ip: undefined,
      params: {},
    });
  });

  it('creates a payload twice', async () => {
    const request = new Request('https://example.com/foo/bar?baz=qux', {
      method: 'POST',
      headers: new Headers({
        'User-Agent': 'test',
      }),
      body: 'Hello',
    });
    // Create rollbar before reading the request body.
    const rollbar = new Rollbar({ ...options, request });

    // Read the body
    await request.text();

    const errorMessage = `test-${Date.now()}`;
    const error = new Error(errorMessage);
    const payload1 = await rollbar.toPayload(error);
    const payload2 = await rollbar.toPayload(error);

    expect(payload1).toEqual(payload2);
  });
});
