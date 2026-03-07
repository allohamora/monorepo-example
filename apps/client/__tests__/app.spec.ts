import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDateLabel } from '../src/app.tsx';

describe('app', () => {
  describe('getDateLabel', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns the current date label', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-07T18:45:30.000Z'));

      expect(getDateLabel()).toBe('today: 2026-03-07');
    });
  });
});
