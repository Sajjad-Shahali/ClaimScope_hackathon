import { BarChart3, Globe2, ShieldAlert, ShieldCheck, Sparkles, CarFront, Search, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const navigation = [
  { to: '/app', label: 'Overview', icon: BarChart3, end: true },
  { to: '/app/warranties', label: 'Warranties', icon: ShieldCheck, end: false },
  { to: '/app/geography', label: 'Geography', icon: Globe2, end: false },
  { to: '/app/vehicles', label: 'Vehicles', icon: CarFront, end: false },
  { to: '/app/anomalies', label: 'Anomalies', icon: ShieldAlert, end: false },
  { to: '/app/claims', label: 'Claims', icon: Search, end: false },
  { to: '/app/insights', label: 'Insights', icon: Sparkles, end: false },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <aside
      className="flex h-full flex-col justify-between rounded-card-lg border p-4 backdrop-blur-2xl lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[260px] lg:shrink-0"
      style={{
        background: 'rgba(7,17,31,0.85)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Top section */}
      <div className="space-y-4">
        {/* Logo */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-glow"
              style={{ background: 'linear-gradient(135deg, #5eead4 0%, #8b5cf6 100%)' }}
            >
              <ShieldCheck className="h-4 w-4 text-slate-950" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-teal-400/60">ClaimScope</p>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">Portfolio Control</h1>
            </div>
          </div>
          {onClose && (
            <button
              className="button-ghost h-8 w-8 p-0 lg:hidden flex items-center justify-center"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-0.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border',
                    isActive
                      ? 'border-teal-400/15 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-100 hover:border-white/[0.06]',
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: 'linear-gradient(135deg, rgba(94,234,212,0.1) 0%, rgba(139,92,246,0.05) 100%)' }
                    : {}
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={clsx(
                        'h-4 w-4 flex-shrink-0 transition-colors duration-200',
                        isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300',
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-glow" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Stance blurb */}
        <div
          className="rounded-xl px-3.5 py-3"
          style={{
            borderLeft: '2px solid rgba(94,234,212,0.35)',
            background: 'rgba(94,234,212,0.04)',
            borderRadius: '0 12px 12px 0',
          }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-teal-400/50 mb-1.5">Platform stance</p>
          <p className="text-xs leading-5 text-slate-400">
            Explainable claims intelligence — portfolio triage, not fraud detection or actuarial pricing.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        className="rounded-xl px-3.5 py-3"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-3.5 w-3.5 text-teal-400" />
          <span className="text-xs font-semibold text-slate-300">Presentation ready</span>
        </div>
        <p className="text-[11px] leading-4 text-slate-500">
          Overview + Insights pages form the demo backbone.
        </p>
      </div>
    </aside>
  );
}
