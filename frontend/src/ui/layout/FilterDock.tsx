import { useState, useRef, useEffect } from 'react';
import { X, SlidersHorizontal, ChevronDown, Check, Search } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { api } from '@/lib/api';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';

// ── Searchable multi-select dropdown ────────────────────────────────────────

function SearchableMultiSelect({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values?: string[];
  options: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = values ?? [];
  const count = selected.length;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setSearch(''); }
  };

  return (
    <div ref={containerRef} className="relative block" onKeyDown={handleKeyDown}>
      {/* Label row with count badge */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span>
        {count > 0 && (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-teal-300"
            style={{
              background: 'rgba(94,234,212,0.12)',
              border: '1px solid rgba(94,234,212,0.25)',
            }}
          >
            {count} selected
          </span>
        )}
      </div>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input flex items-center justify-between gap-2 cursor-pointer text-left w-full"
        style={open ? { borderColor: 'rgba(94,234,212,0.4)', boxShadow: '0 0 0 3px rgba(94,234,212,0.08)' } : {}}
      >
        <span className={`truncate text-sm flex-1 ${count === 0 ? 'text-slate-500' : 'text-white'}`}>
          {count === 0
            ? `All ${label.toLowerCase()}s`
            : count === 1
            ? selected[0]
            : `${selected[0]}  +${count - 1} more`}
        </span>
        {count > 0 && (
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-teal-300"
            style={{ background: 'rgba(94,234,212,0.15)', fontFamily: 'Fira Code, monospace' }}
          >
            {count}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180 text-teal-400' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1.5 rounded-2xl border overflow-hidden animate-scale-in"
          style={{
            background: 'rgba(9,19,40,0.98)',
            borderColor: 'rgba(94,234,212,0.18)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(94,234,212,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Search */}
          <div className="p-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                className="input pl-8 py-1.5 text-sm h-8"
                placeholder={`Search ${label.toLowerCase()}s…`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-500 text-center">No matches for "{search}"</div>
            ) : (
              filtered.map(option => {
                const isSelected = selected.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggle(option)}
                    className="group flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left transition-colors duration-150"
                    style={{ background: isSelected ? 'rgba(94,234,212,0.04)' : undefined }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(94,234,212,0.04)' : ''; }}
                  >
                    {/* Checkbox */}
                    <div
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded transition-all duration-150"
                      style={{
                        background: isSelected ? 'rgba(94,234,212,0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isSelected ? 'rgba(94,234,212,0.55)' : 'rgba(255,255,255,0.14)'}`,
                      }}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 text-teal-400" strokeWidth={3} />}
                    </div>
                    <span className={`flex-1 truncate ${isSelected ? 'text-teal-200' : 'text-slate-300'}`}>{option}</span>
                    {isSelected && (
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" style={{ boxShadow: '0 0 6px #5eead4' }} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer — clear button */}
          {count > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="p-2">
              <button
                type="button"
                onClick={() => { onChange([]); setOpen(false); setSearch(''); }}
                className="button-ghost w-full justify-center text-xs h-7 gap-1.5"
              >
                <X className="h-3 w-3" />
                Clear {count} selection{count !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── FilterDock ───────────────────────────────────────────────────────────────

export function FilterDock() {
  const { filters, setFilters, resetFilters } = useDashboardFilters();
  const { data } = useApiQuery(['filters'], api.filters);

  const scoreInvalid =
    filters.min_anomaly_score !== undefined &&
    (filters.min_anomaly_score < 0 || filters.min_anomaly_score > 1);

  // Count total active filter groups for the header summary
  const activeGroups: string[] = [];
  if (filters.warranty?.length) activeGroups.push(`${filters.warranty.length} warrant${filters.warranty.length !== 1 ? 'ies' : 'y'}`);
  if (filters.region?.length) activeGroups.push(`${filters.region.length} region${filters.region.length !== 1 ? 's' : ''}`);
  if (filters.province?.length) activeGroups.push(`${filters.province.length} province${filters.province.length !== 1 ? 's' : ''}`);
  if (filters.brand?.length) activeGroups.push(`${filters.brand.length} brand${filters.brand.length !== 1 ? 's' : ''}`);
  if (filters.age_bucket?.length) activeGroups.push(`${filters.age_bucket.length} age bucket${filters.age_bucket.length !== 1 ? 's' : ''}`);
  if (filters.gender?.length) activeGroups.push(`${filters.gender.length} gender${filters.gender.length !== 1 ? 's' : ''}`);
  if (filters.start_date) activeGroups.push('start date');
  if (filters.end_date) activeGroups.push('end date');
  if (filters.anomaly_only) activeGroups.push('anomaly only');
  if (filters.high_cost_only) activeGroups.push('high-cost only');
  if (filters.min_anomaly_score !== undefined) activeGroups.push('min score');

  // Active chips for the chip strip
  const chips: { label: string; onRemove: () => void }[] = [];
  (filters.warranty ?? []).forEach(w => chips.push({ label: `Warranty: ${w}`, onRemove: () => setFilters(p => ({ ...p, warranty: p.warranty?.filter(x => x !== w) || undefined })) }));
  (filters.region ?? []).forEach(r => chips.push({ label: `Region: ${r}`, onRemove: () => setFilters(p => ({ ...p, region: p.region?.filter(x => x !== r) || undefined })) }));
  (filters.province ?? []).forEach(r => chips.push({ label: `Province: ${r}`, onRemove: () => setFilters(p => ({ ...p, province: p.province?.filter(x => x !== r) || undefined })) }));
  (filters.brand ?? []).forEach(b => chips.push({ label: `Brand: ${b}`, onRemove: () => setFilters(p => ({ ...p, brand: p.brand?.filter(x => x !== b) || undefined })) }));
  (filters.age_bucket ?? []).forEach(a => chips.push({ label: `Age: ${a}`, onRemove: () => setFilters(p => ({ ...p, age_bucket: p.age_bucket?.filter(x => x !== a) || undefined })) }));
  (filters.gender ?? []).forEach(g => chips.push({ label: `Gender: ${g}`, onRemove: () => setFilters(p => ({ ...p, gender: p.gender?.filter(x => x !== g) || undefined })) }));
  if (filters.start_date) chips.push({ label: `From ${filters.start_date}`, onRemove: () => setFilters(p => ({ ...p, start_date: undefined })) });
  if (filters.end_date) chips.push({ label: `To ${filters.end_date}`, onRemove: () => setFilters(p => ({ ...p, end_date: undefined })) });
  if (filters.anomaly_only) chips.push({ label: 'Anomaly only', onRemove: () => setFilters(p => ({ ...p, anomaly_only: false })) });
  if (filters.high_cost_only) chips.push({ label: 'High-cost only', onRemove: () => setFilters(p => ({ ...p, high_cost_only: false })) });
  if (filters.min_anomaly_score !== undefined) chips.push({ label: `Min score: ${filters.min_anomaly_score}`, onRemove: () => setFilters(p => ({ ...p, min_anomaly_score: undefined })) });

  return (
    <section className="panel p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(94,234,212,0.08)', border: '1px solid rgba(94,234,212,0.15)' }}
          >
            <SlidersHorizontal className="h-4 w-4 text-teal-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="section-title">Global filters</h3>
              {/* Active filter summary — always visible */}
              {activeGroups.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeGroups.map((g, i) => (
                    <span
                      key={i}
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-teal-300"
                      style={{
                        background: 'rgba(94,234,212,0.1)',
                        border: '1px solid rgba(94,234,212,0.2)',
                        fontFamily: 'Fira Code, monospace',
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-slate-600">No filters active — showing all data</span>
              )}
            </div>
            <p className="section-subtitle mt-0.5">Filters apply to all dashboard views simultaneously.</p>
          </div>
        </div>
        <button className="button self-start shrink-0" onClick={resetFilters}>Reset all</button>
      </div>

      {/* Main filter grid */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">Start date</span>
          <input
            className="input"
            type="date"
            value={filters.start_date ?? ''}
            onChange={e => setFilters(p => ({ ...p, start_date: e.target.value || undefined }))}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">End date</span>
          <input
            className="input"
            type="date"
            value={filters.end_date ?? ''}
            onChange={e => setFilters(p => ({ ...p, end_date: e.target.value || undefined }))}
          />
        </label>
        <SearchableMultiSelect
          label="Warranty"
          values={filters.warranty}
          options={data?.warranties ?? []}
          onChange={next => setFilters(p => ({ ...p, warranty: next.length ? next : undefined }))}
        />
        <SearchableMultiSelect
          label="Region"
          values={filters.region}
          options={data?.regions ?? []}
          onChange={next => setFilters(p => ({ ...p, region: next.length ? next : undefined }))}
        />
        <SearchableMultiSelect
          label="Province"
          values={filters.province}
          options={data?.provinces ?? []}
          onChange={next => setFilters(p => ({ ...p, province: next.length ? next : undefined }))}
        />
        <SearchableMultiSelect
          label="Brand"
          values={filters.brand}
          options={data?.brands ?? []}
          onChange={next => setFilters(p => ({ ...p, brand: next.length ? next : undefined }))}
        />
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">Min anomaly score</span>
          <input
            className={`input ${scoreInvalid ? 'border-rose-400/60 focus:border-rose-400' : ''}`}
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={filters.min_anomaly_score ?? ''}
            onChange={e => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              setFilters(p => ({ ...p, min_anomaly_score: val }));
            }}
          />
          {scoreInvalid && <p className="mt-1 text-xs text-rose-400">Must be 0 – 1</p>}
        </label>
      </div>

      {/* Secondary filter row */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SearchableMultiSelect
          label="Age bucket"
          values={filters.age_bucket}
          options={data?.age_buckets ?? []}
          onChange={next => setFilters(p => ({ ...p, age_bucket: next.length ? next : undefined }))}
        />
        <SearchableMultiSelect
          label="Gender"
          values={filters.gender}
          options={['F', 'M', 'OTHER', 'UNKNOWN']}
          onChange={next => setFilters(p => ({ ...p, gender: next.length ? next : undefined }))}
        />
        <label
          className="panel-muted flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl"
          style={{ border: filters.anomaly_only ? '1px solid rgba(94,234,212,0.2)' : undefined }}
        >
          <input
            type="checkbox"
            checked={Boolean(filters.anomaly_only)}
            onChange={e => setFilters(p => ({ ...p, anomaly_only: e.target.checked }))}
            className="accent-teal-400"
          />
          <div>
            <div className="text-sm font-medium text-white">Anomalies only</div>
            <div className="text-xs text-slate-400">Focus on flagged claims.</div>
          </div>
        </label>
        <label
          className="panel-muted flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl"
          style={{ border: filters.high_cost_only ? '1px solid rgba(94,234,212,0.2)' : undefined }}
        >
          <input
            type="checkbox"
            checked={Boolean(filters.high_cost_only)}
            onChange={e => setFilters(p => ({ ...p, high_cost_only: e.target.checked }))}
            className="accent-teal-400"
          />
          <div>
            <div className="text-sm font-medium text-white">High-cost only</div>
            <div className="text-xs text-slate-400">P95+ severity claims.</div>
          </div>
        </label>
      </div>

      {/* Active filter chips — removable */}
      {chips.length > 0 && (
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Active filters
            </span>
            <span
              className="text-[10px] font-bold tabular-nums text-teal-400"
              style={{ fontFamily: 'Fira Code, monospace' }}
            >
              {chips.length} applied
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip, i) => (
              <button
                key={i}
                onClick={chip.onRemove}
                className="badge group flex items-center gap-2 transition-all duration-150 hover:border-rose-400/30 hover:bg-rose-400/5"
              >
                <span>{chip.label}</span>
                <X className="h-3 w-3 text-slate-500 group-hover:text-rose-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
