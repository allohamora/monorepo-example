import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { app } from '#src/app.ts';
import { testClient } from 'hono/testing';

describe('app', () => {
  const api = testClient(app);

  afterEach(() => {
    mock.timers.reset();
  });

  describe('GET /ping', () => {
    it('returns 200 with pong response body', async () => {
      mock.timers.enable({ apis: ['Date'], now: new Date('2026-03-07T18:45:30.000Z') });

      const response = await api.ping.$get();

      assert.equal(response.status, 200);
      assert.equal(await response.text(), 'pong - 2026-03-07');
      assert.equal(response.headers.get('access-control-allow-origin'), '*');
    });
  });
});
