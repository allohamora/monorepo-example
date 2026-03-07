import assert from 'node:assert/strict';
import { after, describe, it, mock } from 'node:test';
import { getCurrentDate } from '#src/date.ts';

describe('date', () => {
  describe('getCurrentDate', () => {
    after(() => {
      mock.timers.reset();
    });

    it('returns the current date in YYYY-MM-DD format', () => {
      mock.timers.enable({ apis: ['Date'], now: new Date('2026-03-07T18:45:30.000Z') });

      assert.equal(getCurrentDate(), '2026-03-07');
    });
  });
});
