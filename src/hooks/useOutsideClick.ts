// src/hooks/useOutsideClick.ts
import { useEffect } from 'react';

type AnyHTMLElementRef = React.RefObject<HTMLElement | null>;

export function useOutsideClick(
  refs: AnyHTMLElementRef[],
  onOutside: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const clickedInsideSomeRef = refs.some(ref => {
        const el = ref.current;
        return el ? el.contains(target) : false;
      });

      if (!clickedInsideSomeRef) onOutside();
    };

    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);

    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [refs, onOutside, enabled]);
}
