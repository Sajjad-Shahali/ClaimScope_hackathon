import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export function Tooltip({ children, text }: { children: ReactNode; text: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.top, left: r.left + r.width / 2 });
  };

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && createPortal(
        <span
          className="pointer-events-none whitespace-nowrap rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200 shadow-xl"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            transform: 'translate(-50%, calc(-100% - 8px))',
            zIndex: 9999,
          }}
        >
          {text}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>,
        document.body,
      )}
    </span>
  );
}
