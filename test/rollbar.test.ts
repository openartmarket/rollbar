import { describe, it } from 'vitest';
import { Rollbar } from '../src/index';
describe('Rollbar', () => {
  const rollbar = new Rollbar(
    {
      environment: 'test',
      code_version: '0.0.0',
      platform: 'node',
      framework: 'vitest',
      language: 'javascript',
    },
    {
      accessToken: 'test',
    },
  );
  it('creates a payload for an error', () => {
    const payload = rollbar.toPayload({ error: new Error('test') });
    console.dir(payload, { depth: null });
  });
});
