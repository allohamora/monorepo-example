import { afterAll, describe, expect, it, vi } from 'vitest';
import { getDateLabel } from './app.tsx';

describe('app', () => {
  describe('getDateLabel', () => {
    afterAll(() => {
      vi.useRealTimers();
    });

    it('returns the current date label', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-07T18:45:30.000Z'));

      expect(getDateLabel()).toBe('today: 2026-03-07');
    });
  });
});
