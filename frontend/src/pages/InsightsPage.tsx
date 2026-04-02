import { useApiQuery } from '@/hooks/useApiQuery';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { api } from '@/lib/api';
import { InsightList } from '@/ui/components/InsightList';
import { ShieldCheck } from 'lucide-react';

const narrativeSteps = [
  'Open with why claims portfolio intelligence matters — analysts need prioritization, not another black-box prediction story.',
  'Show the top KPI changes and the leading warranties driving paid loss concentration.',
  'Move to geography and vehicles to prove the problem is structurally localized, not evenly spread.',
  'Use anomaly examples to demonstrate explainability and analyst workflow value.',
  'Close with caveats and operational next steps: review warranty wording, claims handling routing, and concentration monitoring.',
];

export function InsightsPage() {
  const { filters } = useDashboardFilters();
  const insights = useApiQuery(['insights', filters], () => api.insights(filters));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section
        className="panel p-6 animate-slide-up"
        style={{
          background: 'linear-gradient(135deg, rgba(94,234,212,0.06) 0%, rgba(139,92,246,0.04) 100%), rgba(8,18,35,0.7)',
          borderLeft: '3px solid rgba(94,234,212,0.4)',
          borderRadius: '0 20px 20px 0',
        }}
      >
        <div className="badge-accent mb-3">Narrative engine</div>
        <h3 className="text-2xl font-bold tracking-tight text-white">
          Deterministic insights for your presentation and demo script
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          The backend computes data-grounded insight text. This page turns analytics into slide-ready narration without inventing unsupported causes.
        </p>
      </section>

      {/* Insights grid */}
      <section className="grid gap-5 xl:grid-cols-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <InsightList title="Top findings" items={insights.data?.top_findings ?? []} tone="accent" />
        <InsightList title="Top warranty risks" items={insights.data?.top_warranty_risks ?? []} />
        <InsightList title="Top geography risks" items={insights.data?.top_geography_risks ?? []} />
        <InsightList title="Top vehicle segment risks" items={insights.data?.top_vehicle_segment_risks ?? []} />
        <InsightList title="Anomaly headlines" items={insights.data?.anomaly_headlines ?? []} tone="danger" />
        <InsightList title="Caveats" items={insights.data?.caveats ?? []} tone="violet" />
      </section>

      {/* Slide narrative */}
      <section className="panel p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="badge mb-4">Suggested slide narrative</div>
        <div className="space-y-4">
          {narrativeSteps.map((step, i) => (
            <div
              key={i}
              className="flex gap-4 animate-fade-in"
              style={{ animationDelay: `${0.25 + i * 0.08}s` }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-teal-300"
                style={{
                  background: 'rgba(94,234,212,0.1)',
                  border: '1px solid rgba(94,234,212,0.2)',
                }}
              >
                {i + 1}
              </div>
              <p className="text-sm leading-7 text-slate-300 pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section
        className="panel-muted flex items-start gap-3 px-4 py-3 animate-fade-in"
        style={{ animationDelay: '0.6s' }}
      >
        <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
        <p className="text-xs leading-5 text-slate-400">
          These insights are deterministically generated from your claims data — no LLM fabrication, no invented causality. All metrics are claims-only and should be treated as triage signals, not conclusive findings.
        </p>
      </section>
    </div>
  );
}
