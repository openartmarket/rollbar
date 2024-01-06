import { beforeEach, describe, expect, it } from 'vitest';
import { Rollbar } from '../src/index';
describe('Rollbar', () => {
  const accessToken = process.env.ROLLBAR_ACCESS_TOKEN;

  let rollbar: Rollbar;
  beforeEach(() => {
    rollbar = new Rollbar(
      {
        environment: '@openartmarket/rollbar',
        code_version: '0.0.0',
        platform: 'node',
        framework: 'vitest',
        language: 'javascript',
      },
      {
        accessToken,
      },
    );
  });

  it('creates a payload for an error', async () => {
    const form = new FormData();
    form.append('foo', 'bar');
    const request = new Request('https://example.com/foo/bar?baz=qux', {
      method: 'POST',
      headers: new Headers({
        'User-Agent': 'test',
      }),
      body: form,
    });

    // Clone the request used for logging
    const clonedRequest = request.clone();

    // Read the body
    await request.text();

    const errorMessage = `test-${Date.now()}`;
    const payload = await rollbar.toPayload({
      error: new Error(errorMessage),
      request: clonedRequest,
    });

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
});
