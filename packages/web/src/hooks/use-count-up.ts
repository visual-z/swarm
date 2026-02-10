import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 to `target` using requestAnimationFrame.
 * Duration is capped at 250ms for snappy feel.
 */
export function useCountUp(target: number, duration = 250): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (prevTarget.current === target && value === target) return;

    const startValue = prevTarget.current !== target ? 0 : value;
    prevTarget.current = target;

    if (target === 0) {
      setValue(0);
      return;
    }

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for a satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);

      setValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}
