import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ClaimDetailResponse } from '@/types/api';
import { compactDate, formatCurrency, formatNumber, formatPercent, titleCase } from '@/lib/utils';

function renderValue(value: string | number | boolean | null | undefined) {
  if (typeof value === 'number') return (
    <span style={{ fontFamily: 'Fira Code, monospace' }} className="tabular-nums">
      {formatNumber(value, 2)}
    </span>
  );
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value ?? '—';
}

function KeyValueGrid({
  title,
  data,
  accent,
}: {
  title: string;
  data: Record<string, string | number | boolean | null>;
  accent?: 'teal' | 'violet' | 'default';
}) {
  const borderColor = accent === 'teal'
    ? 'rgba(94,234,212,0.25)'
    : accent === 'violet'
    ? 'rgba(139,92,246,0.25)'
    : 'rgba(255,255,255,0.08)';
  return (
    <div className="panel-muted p-4">
      <h4
        className="text-[10px] font-bold uppercase tracking-widest mb-3 pb-2"
        style={{
          color: accent === 'teal' ? '#5eead4' : accent === 'violet' ? '#a78bfa' : '#64748b',
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        {title}
      </h4>
      <div className="grid gap-2 md:grid-cols-2">
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className="rounded-xl p-2.5 transition-colors hover:bg-white/[0.03]"
            style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {titleCase(key)}
            </div>
            <div className="text-sm text-white">{renderValue(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClaimDetailModal({
  detail,
  onClose,
}: {
  detail: ClaimDetailResponse;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-4 py-8"
      style={{ background: 'rgba(7,17,31,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-5xl rounded-card-lg border p-6 animate-scale-in"
        style={{
          background: 'rgba(11,22,46,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="badge-accent mb-2">Claim drill-down</div>
            <h3
              className="text-2xl font-bold tracking-tight"
              style={{
                fontFamily: 'Fira Code, monospace',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #5eead4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {detail.claim_id}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-400">
              <span>Expected: <span className="text-white font-mono">{formatCurrency(detail.expected_claim)}</span></span>
              <span className="text-slate-600">·</span>
              <span>Residual: <span className="text-white font-mono">{formatCurrency(detail.residual)}</span></span>
              <span className="text-slate-600">·</span>
              <span>Peer percentile: <span className="text-white font-mono">{formatPercent(detail.percentile_within_peer_group, 0)}</span></span>
            </div>
          </div>
          <button className="button-ghost h-9 w-9 p-0 flex items-center justify-center shrink-0" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content grid */}
        <div className="grid gap-4 xl:grid-cols-2">
          <KeyValueGrid title="Raw fields" data={detail.raw_fields} accent="default" />
          <KeyValueGrid title="Engineered fields" data={detail.engineered_fields} accent="teal" />
          <KeyValueGrid title="Peer-group benchmark" data={detail.peer_group_benchmark} accent="violet" />
          <KeyValueGrid title="Anomaly components" data={detail.anomaly_components} accent="default" />
        </div>

        {/* Segment context */}
        <div className="mt-4 panel-muted p-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            Segment context
          </h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(detail.segment_context).map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl p-2.5"
                style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{titleCase(key)}</div>
                <div className="text-sm text-white">{renderValue(value as string | number | boolean | null)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
