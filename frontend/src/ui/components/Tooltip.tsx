import { useState } from 'react';
import type { ReactNode } from 'react';

export function Tooltip({ children, text }: { children: ReactNode; text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200 shadow-xl">
          {text}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
}
