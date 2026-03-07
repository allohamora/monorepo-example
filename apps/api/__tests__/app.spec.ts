import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { app } from '#src/app.ts';
import { testClient } from 'hono/testing';

describe('app', () => {
  const api = testClient(app);

  describe('GET /ping', () => {
    it('returns 200 with pong response body', async () => {
      const response = await api.ping.$get();

      assert.equal(response.status, 200);
      assert.equal(await response.text(), 'pong');
      assert.equal(response.headers.get('access-control-allow-origin'), '*');
    });
  });
});
