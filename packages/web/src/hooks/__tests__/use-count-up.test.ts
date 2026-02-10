import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountUp } from '../use-count-up';

describe('useCountUp', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts at 0', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);

    const { result } = renderHook(() => useCountUp(100));

    expect(result.current).toBe(0);
  });

  it('returns 0 when target is 0', () => {
    const { result } = renderHook(() => useCountUp(0));

    expect(result.current).toBe(0);
  });

  it('eventually reaches the target value', async () => {
    let rafCallback: FrameRequestCallback | null = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    const startTime = performance.now();
    vi.spyOn(performance, 'now').mockReturnValue(startTime);

    const { result } = renderHook(() => useCountUp(50, 100));

    vi.spyOn(performance, 'now').mockReturnValue(startTime + 200);

    if (rafCallback) {
      act(() => {
        (rafCallback as FrameRequestCallback)(startTime + 200);
      });
    }

    expect(result.current).toBe(50);
  });
});
