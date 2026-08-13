import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { AlertTriangle, Activity, GitCompare, TrendingUp, FolderOpen, Info } from 'lucide-react';
import { Button } from './ui';
import { SiteInputs } from '../types';
import {
  LifeSimMode,
  runLifeSimulation,
  sweepChangeYear,
  totalAverageLoadKw
} from '../lib/lifeSimulation';
import { chartAxis, chartGrid, chartTooltipStyle } from '../lib/chartTheme';

/** Saved entry from MY PROJECT (user templates / projects). */
export type LifeSimProjectRef = {
  id: string;
  name: string;
  data: SiteInputs;
};

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'USD': return '$';
    case 'MYR': return 'RM ';
    case 'PHP': return '₱ ';
    case 'BDT': return '৳ ';
    case 'PKR': return 'Rs ';
    default: return '$';
  }
};

const fmt = (n: number | undefined, digits = 0) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });

const signedPp = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)} pp`;

function projectSummary(data: SiteInputs): string {
  const load = (data.tenantLoads || []).reduce((a, t) => a + (t.runningLoad || t.averageLoad || 0), 0);
  const outages = data.gridCondition === 'Off-grid'
    ? '24h outage'
    : `${data.dailyOutages || 0}×${data.outageDuration || 0}h`;
  const dg = data.dg?.enabled ? 'DG' : 'no DG';
  return `${data.gridCondition || '?'} · ${outages} · ${load.toFixed(1)} kW load · ${dg}`;
}

interface Props {
  projects: LifeSimProjectRef[];
  onSaveProject?: () => void;
}

export function LifeSimulationPanel({ projects, onSaveProject }: Props) {
  const [baselineId, setBaselineId] = useState<string>('');
  const [changeId, setChangeId] = useState<string>('');
  const [mode, setMode] = useState<LifeSimMode>('compare');
  const [changeYear, setChangeYear] = useState(3);
  const [loadChangeYear, setLoadChangeYear] = useState(3);
  const [loadDeltaKw, setLoadDeltaKw] = useState(0);
  const [runSweep, setRunSweep] = useState(false);

  // Keep selection valid when project list changes
  useEffect(() => {
    if (baselineId && !projects.find(p => p.id === baselineId)) setBaselineId('');
    if (changeId && !projects.find(p => p.id === changeId)) setChangeId('');
  }, [projects, baselineId, changeId]);

  const baselineProject = projects.find(p => p.id === baselineId) || null;
  const changeProject = projects.find(p => p.id === changeId) || null;

  const baselineInputs = baselineProject?.data || null;
  const changeInputs = changeProject?.data || null;

  const tenure = baselineInputs?.financials?.tenure || 10;
  const currency = getCurrencySymbol(baselineInputs?.financials?.currency || 'USD');

  useEffect(() => {
    if (changeYear > tenure) setChangeYear(Math.min(3, tenure));
    if (loadChangeYear > tenure) setLoadChangeYear(Math.min(3, tenure));
  }, [tenure, changeYear, loadChangeYear]);

  const canRun = !!(baselineInputs && changeInputs && baselineId !== changeId);

  const simResult = useMemo(() => {
    if (!canRun || !baselineInputs || !changeInputs) return null;
    return runLifeSimulation(baselineInputs, {
      mode,
      change: {
        changeYear,
        gridChangeYear: changeYear,
        loadChangeYear,
        changeProject: changeInputs,
        ...(loadDeltaKw !== 0 ? { loadDeltaKw } : {})
      }
    });
  }, [canRun, baselineInputs, changeInputs, mode, changeYear, loadChangeYear, loadDeltaKw]);

  const sweep = useMemo(() => {
    if (!runSweep || !canRun || !baselineInputs || !changeInputs) return [];
    const m = mode === 'B' ? 'B' : 'A';
    return sweepChangeYear(
      baselineInputs,
      {
        changeProject: changeInputs,
        loadChangeYear,
        ...(loadDeltaKw !== 0 ? { loadDeltaKw } : {})
      },
      m
    );
  }, [runSweep, canRun, baselineInputs, changeInputs, mode, loadChangeYear, loadDeltaKw]);

  const activePath = mode === 'B' ? simResult?.modeB : simResult?.modeA;
  const comparePathA = simResult?.modeA;
  const comparePathB = simResult?.modeB;

  const cashChartData = useMemo(() => {
    if (!simResult) return [];
    const years = simResult.baseline.cashFlows.map(c => c.year);
    return years.map(y => {
      const row: Record<string, number> = { year: y };
      row.baseline = simResult.baseline.cashFlows[y]?.totalOutflow || 0;
      if (comparePathA) row.modeA = comparePathA.cashFlows[y]?.totalOutflow || 0;
      if (comparePathB) row.modeB = comparePathB.cashFlows[y]?.totalOutflow || 0;
      if (mode === 'A' && activePath) row.scenario = activePath.cashFlows[y]?.totalOutflow || 0;
      if (mode === 'B' && activePath) row.scenario = activePath.cashFlows[y]?.totalOutflow || 0;
      return row;
    });
  }, [simResult, comparePathA, comparePathB, activePath, mode]);

  const wearPath = mode === 'compare' ? comparePathA : activePath;

  const selectClass =
    'w-full h-[var(--control-height)] bg-[var(--fill-tertiary)] rounded-[var(--radius-control)] px-[var(--space-3)] text-[var(--label)] text-[length:var(--text-body-size)] outline-none shadow-[0_0_0_0.5px_var(--separator)] focus:shadow-[0_0_0_2px_var(--tint-soft),0_0_0_0.5px_var(--tint)] disabled:opacity-40';

  return (
    <div className="life-sim space-y-6">
      <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-[var(--space-5)] shadow-[0_0_0_0.5px_var(--separator)]">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-[var(--radius-control)] bg-[var(--tint-soft)] text-[var(--tint)]">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-[length:var(--text-title-3-size)] leading-[var(--text-title-3-line)] font-semibold text-[var(--label)]">Life simulation</h2>
            <p className="text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] font-medium text-[var(--label-secondary)] mt-1 max-w-3xl">
              Pick a <strong className="text-[var(--label)] font-medium">baseline</strong> and a <strong className="text-[var(--label)] font-medium">change</strong> from Projects.
              Grid and load can change in different years. Extra load is in kW. Mode A keeps this plant. Mode B may add kit at each change.
            </p>
          </div>
        </div>

        {projects.length < 2 && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-[var(--radius-element)] bg-[var(--fill-tertiary)] p-4">
            <Info size={16} className="shrink-0 text-[var(--tint)]" />
            <p className="flex-1 text-[length:var(--text-subhead-size)] text-[var(--label)]">
              Save two projects to compare a baseline and a change.
            </p>
            {onSaveProject && (
              <Button variant="filled" size="compact" onClick={onSaveProject}>
                Save as project
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Project pickers */}
          <div className="space-y-3 lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[length:var(--text-footnote-size)] text-[var(--label-secondary)] flex items-center gap-1.5">
                  <FolderOpen size={12} /> Baseline (year 0 plant and grid)
                </label>
                <select
                  value={baselineId}
                  onChange={e => setBaselineId(e.target.value)}
                  className={`mt-1 ${selectClass}`}
                >
                  <option value="">Choose a project…</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {baselineProject && (
                  <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mt-1 font-[family-name:var(--font-numeric)]">{projectSummary(baselineProject.data)}</p>
                )}
              </div>
              <div>
                <label className="text-[length:var(--text-footnote-size)] text-[var(--label-secondary)] flex items-center gap-1.5">
                  <FolderOpen size={12} /> Change (new grid; its loads start at the load year)
                </label>
                <select
                  value={changeId}
                  onChange={e => setChangeId(e.target.value)}
                  className={`mt-1 ${selectClass}`}
                >
                  <option value="">Choose a project…</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id} disabled={p.id === baselineId}>{p.name}</option>
                  ))}
                </select>
                {changeProject && (
                  <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mt-1 font-[family-name:var(--font-numeric)]">{projectSummary(changeProject.data)}</p>
                )}
              </div>
            </div>

            {baselineId && changeId && baselineId === changeId && (
              <p className="text-[length:var(--text-footnote-size)] text-[var(--system-red)]">Pick two different projects.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[length:var(--text-footnote-size)] text-[var(--label-secondary)]">Grid change year</label>
                <input
                  type="number"
                  min={1}
                  max={tenure}
                  value={changeYear}
                  onChange={(e) => setChangeYear(Math.min(tenure, Math.max(1, parseInt(e.target.value || '1', 10))))}
                  className={`mt-1 ${selectClass}`}
                  disabled={!canRun}
                />
                <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mt-1">
                  Change project’s grid from this year. Tenure {tenure} y.
                </p>
              </div>
              <div>
                <label className="text-[length:var(--text-footnote-size)] text-[var(--label-secondary)]">Load change year</label>
                <input
                  type="number"
                  min={1}
                  max={tenure}
                  value={loadChangeYear}
                  onChange={(e) => setLoadChangeYear(Math.min(tenure, Math.max(1, parseInt(e.target.value || '1', 10))))}
                  className={`mt-1 ${selectClass}`}
                  disabled={!canRun}
                />
                <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mt-1">
                  Change project’s loads + extra kW from this year.
                </p>
              </div>
              <div>
                <label className="text-[length:var(--text-footnote-size)] text-[var(--label-secondary)]">Extra load (kW)</label>
                <input
                  type="number"
                  step={0.1}
                  value={loadDeltaKw}
                  onChange={e => setLoadDeltaKw(parseFloat(e.target.value) || 0)}
                  className={`mt-1 ${selectClass}`}
                  disabled={!canRun}
                />
                <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mt-1">
                  {(() => {
                    const changeKw = changeInputs ? totalAverageLoadKw(changeInputs) : (baselineInputs ? totalAverageLoadKw(baselineInputs) : 0);
                    const after = Math.max(0, changeKw + loadDeltaKw);
                    return `Average load ${changeKw.toFixed(1)} kW + ${loadDeltaKw >= 0 ? '+' : ''}${loadDeltaKw} = ${after.toFixed(1)} kW. Peak and running scale with it.`;
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Mode */}
          <div className="space-y-2">
            <label className="text-[length:var(--text-footnote-size)] text-[var(--label-secondary)]">Commercial response</label>
            <div className="flex flex-col gap-1">
              {([
                { id: 'A' as const, label: 'Mode A — Keep this plant' },
                { id: 'B' as const, label: 'Mode B — Resize at each change' },
                { id: 'compare' as const, label: 'Compare A and B' }
              ]).map(opt => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-control)] cursor-pointer text-[length:var(--text-subhead-size)] ${
                    mode === opt.id
                      ? 'bg-[var(--tint-soft)] text-[var(--tint)]'
                      : 'text-[var(--label-secondary)] hover:bg-[var(--fill-quaternary)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="lifeMode"
                    checked={mode === opt.id}
                    onChange={() => setMode(opt.id)}
                    className="accent-[var(--tint)]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] leading-relaxed">
              {mode === 'B'
                ? 'Mode B may add kit at the grid year and again at the load year if those years differ.'
                : mode === 'compare'
                  ? 'A keeps year-0 kit. B may add kit when grid or load changes.'
                  : 'Mode A keeps the year-0 plant. Grid and load follow the years you set. Hours the battery cannot cover stay unserved if there is no genset.'}
            </p>
            <label className="flex items-center gap-2 text-[length:var(--text-subhead-size)] text-[var(--label)] mt-3">
              <input
                type="checkbox"
                checked={runSweep}
                onChange={e => setRunSweep(e.target.checked)}
                className="accent-[var(--tint)]"
                disabled={!canRun}
              />
              Sweep grid change year ({mode === 'B' ? 'Mode B' : 'Mode A'})
            </label>
            {simResult && (
              <div className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] rounded-[var(--radius-control)] p-2 bg-[var(--fill-tertiary)] mt-2">
                Baseline design: {simResult.baseline.rectifierStats.batteryModules} bat ·{' '}
                {simResult.baseline.rectifierStats.rectifierModules} rect ·{' '}
                {simResult.baseline.rectifierStats.requiredDGKva || 0} kVA DG ·{' '}
                {simResult.baseline.rectifierStats.adjustedBatteryCapacityAH} AH
              </div>
            )}
          </div>
        </div>
      </div>

      {!canRun && projects.length >= 2 && (
        <div className="text-center text-[length:var(--text-subhead-size)] text-[var(--label-secondary)] py-12 rounded-[var(--radius-element)] shadow-[0_0_0_0.5px_var(--separator)]">
          Choose two different projects above.
        </div>
      )}

      {canRun && simResult && (
        <>
          {/* Delta cards */}
          {mode === 'compare' && simResult.deltaA && simResult.deltaB && simResult.deltaBminusA ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <DeltaCard title="Mode A vs Baseline" currency={currency} delta={simResult.deltaA} accent="amber" />
              <DeltaCard title="Mode B vs Baseline" currency={currency} delta={simResult.deltaB} accent="emerald" />
              <DeltaCard title="B − A (value of resizing)" currency={currency} delta={simResult.deltaBminusA} accent="sky" />
            </div>
          ) : (
            (mode === 'B' ? simResult.deltaB : simResult.deltaA) && (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-3 max-w-md">
                <DeltaCard
                  title={`${mode === 'B' ? 'Mode B' : 'Mode A'} vs Baseline`}
                  currency={currency}
                  delta={(mode === 'B' ? simResult.deltaB : simResult.deltaA)!}
                  accent={mode === 'B' ? 'emerald' : 'amber'}
                />
              </div>
            )
          )}

          {/* DC availability */}
          {(comparePathA?.availability || comparePathB?.availability || activePath?.availability) && (
            <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-4 shadow-[0_0_0_0.5px_var(--separator)]">
              <h3 className="text-[length:var(--text-subhead-size)] font-semibold text-[var(--label)] mb-1">DC availability</h3>
              <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mb-3 max-w-3xl">
                Time-based: (24 − unserved hours) / 24. Residual outage is grid-down time the plant cannot cover.
                Mode A never adds a genset. Mode B may add one when grid or load changes.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[640px]">
                  <thead>
                    <tr className="text-gray-500 border-b border-white/10">
                      <th className="text-left py-2 pr-3">Metric</th>
                      <th className="text-right py-2 pr-3">Baseline design</th>
                      {(mode === 'A' || mode === 'compare') && <th className="text-right py-2 pr-3 text-[var(--system-orange)]">Mode A post-change</th>}
                      {(mode === 'B' || mode === 'compare') && <th className="text-right py-2 pr-3 text-emerald-400">Mode B post-change</th>}
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-white/5">
                      <td className="py-1.5">DC availability</td>
                      <td className="text-right font-mono">{(simResult.baseline.rectifierStats.dcAvailabilityPct ?? 100).toFixed(2)}%</td>
                      {(mode === 'A' || mode === 'compare') && comparePathA && (
                        <td className="text-right font-mono text-[var(--system-orange)]">{comparePathA.availability.postChangePct.toFixed(2)}%</td>
                      )}
                      {(mode === 'B' || mode === 'compare') && comparePathB && (
                        <td className="text-right font-mono text-emerald-300">{comparePathB.availability.postChangePct.toFixed(2)}%</td>
                      )}
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-1.5">Δ availability vs baseline</td>
                      <td className="text-right font-mono text-gray-600">—</td>
                      {(mode === 'A' || mode === 'compare') && comparePathA && (
                        <td className={`text-right font-mono ${comparePathA.availability.deltaPostVsBaselinePct < -0.01 ? 'text-red-400' : 'text-gray-300'}`}>
                          {signedPp(comparePathA.availability.deltaPostVsBaselinePct)}
                        </td>
                      )}
                      {(mode === 'B' || mode === 'compare') && comparePathB && (
                        <td className={`text-right font-mono ${comparePathB.availability.deltaPostVsBaselinePct < -0.01 ? 'text-red-400' : 'text-gray-300'}`}>
                          {signedPp(comparePathB.availability.deltaPostVsBaselinePct)}
                        </td>
                      )}
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-1.5">Grid outage</td>
                      <td className="text-right font-mono">{(simResult.baseline.rectifierStats.dailyOutageHours ?? 0).toFixed(2)} h/day</td>
                      {(mode === 'A' || mode === 'compare') && comparePathA && (
                        <td className="text-right font-mono">{comparePathA.availability.postOutageHoursPerDay.toFixed(2)} h/day</td>
                      )}
                      {(mode === 'B' || mode === 'compare') && comparePathB && (
                        <td className="text-right font-mono">{comparePathB.availability.postOutageHoursPerDay.toFixed(2)} h/day</td>
                      )}
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-1.5">Residual unserved outage</td>
                      <td className="text-right font-mono">{(simResult.baseline.rectifierStats.dailyUnservedHours ?? 0).toFixed(2)} h/day</td>
                      {(mode === 'A' || mode === 'compare') && comparePathA && (
                        <td className={`text-right font-mono ${comparePathA.availability.postResidualHoursPerDay > 0.01 ? 'text-red-400' : 'text-gray-300'}`}>
                          {comparePathA.availability.postResidualHoursPerDay.toFixed(2)} h/day
                          <span className="text-gray-500 ml-1">({fmt(comparePathA.availability.postResidualHoursPerYear, 0)} h/y)</span>
                        </td>
                      )}
                      {(mode === 'B' || mode === 'compare') && comparePathB && (
                        <td className={`text-right font-mono ${comparePathB.availability.postResidualHoursPerDay > 0.01 ? 'text-red-400' : 'text-gray-300'}`}>
                          {comparePathB.availability.postResidualHoursPerDay.toFixed(2)} h/day
                          <span className="text-gray-500 ml-1">({fmt(comparePathB.availability.postResidualHoursPerYear, 0)} h/y)</span>
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td className="py-1.5">Tenure-average availability</td>
                      <td className="text-right font-mono text-gray-500">same every year if no shock</td>
                      {(mode === 'A' || mode === 'compare') && comparePathA && (
                        <td className="text-right font-mono">{comparePathA.availability.tenurePct.toFixed(2)}%</td>
                      )}
                      {(mode === 'B' || mode === 'compare') && comparePathB && (
                        <td className="text-right font-mono">{comparePathB.availability.tenurePct.toFixed(2)}%</td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Risk flags */}
          {(comparePathA?.riskFlags?.length || comparePathB?.riskFlags?.length || activePath?.riskFlags?.length) ? (
            <div className="bg-[color-mix(in_srgb,var(--system-orange)_12%,transparent)] rounded-[var(--radius-element)] p-4">
              <div className="flex items-center gap-2 text-[var(--system-orange)] text-[length:var(--text-subhead-size)] font-semibold mb-2">
                <AlertTriangle size={16} /> Design / ops risk flags
              </div>
              <ul className="text-[length:var(--text-footnote-size)] text-[var(--label)] space-y-1 list-disc pl-5">
                {mode === 'compare' ? (
                  <>
                    {comparePathA?.riskFlags.map((f, i) => (
                      <li key={`a-${i}`}><span className="text-[var(--system-orange)] font-mono">A:</span> {f}</li>
                    ))}
                    {comparePathB?.riskFlags.map((f, i) => (
                      <li key={`b-${i}`}><span className="text-emerald-500 font-mono">B:</span> {f}</li>
                    ))}
                  </>
                ) : (
                  activePath?.riskFlags.map((f, i) => <li key={i}>{f}</li>)
                )}
              </ul>
            </div>
          ) : null}

          {/* Mode B upgrade */}
          {(mode === 'B' || mode === 'compare') && comparePathB && comparePathB.upgradeBoq.length > 0 && (
            <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-4 shadow-[0_0_0_0.5px_var(--separator)]">
              <h3 className="text-[length:var(--text-subhead-size)] font-semibold text-[var(--system-green)] mb-2 flex items-center gap-2">
                <TrendingUp size={16} /> Mode B upgrade BoQ at year {changeYear}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-white/10">
                      <th className="text-left py-2">Item</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Unit</th>
                      <th className="text-right py-2">Total (Y0 $)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparePathB.upgradeBoq.map((u, i) => (
                      <tr key={i} className="border-b border-white/5 text-gray-300">
                        <td className="py-1.5">{u.item}</td>
                        <td className="text-right font-mono">{u.quantity}</td>
                        <td className="text-right font-mono">{currency}{fmt(u.unitCost)}</td>
                        <td className="text-right font-mono text-emerald-400">{currency}{fmt(u.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {(mode === 'B' || mode === 'compare') && comparePathB && comparePathB.upgradeBoq.length === 0 && (
            <div className="text-[length:var(--text-footnote-size)] text-[var(--label-tertiary)] bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-3 shadow-[0_0_0_0.5px_var(--separator)]">
              Mode B: no capacity upgrade required for this shock (baseline design still adequate under change project).
            </div>
          )}

          {/* Cashflow chart */}
          <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-4 shadow-[0_0_0_0.5px_var(--separator)]">
            <h3 className="text-[length:var(--text-subhead-size)] font-semibold text-[var(--label)] mb-3 flex items-center gap-2">
              <GitCompare size={16} className="text-[var(--tint)]" /> Annual total outflow
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="year" stroke={chartAxis} tick={{ fontSize: 11 }} />
                  <YAxis stroke={chartAxis} tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(v) => `${currency}${fmt(Number(v))}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="baseline" name="Baseline project" stroke="var(--label-tertiary)" strokeWidth={2} dot={false} />
                  {(mode === 'A' || mode === 'compare') && (
                    <Line type="monotone" dataKey={mode === 'compare' ? 'modeA' : 'scenario'} name="Mode A" stroke="var(--system-orange)" strokeWidth={2} dot={false} />
                  )}
                  {(mode === 'B' || mode === 'compare') && (
                    <Line type="monotone" dataKey={mode === 'compare' ? 'modeB' : 'scenario'} name="Mode B" stroke="var(--system-green)" strokeWidth={2} dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Wear table */}
          {wearPath && (
            <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-4 overflow-x-auto shadow-[0_0_0_0.5px_var(--separator)]">
              <h3 className="text-[length:var(--text-subhead-size)] font-semibold text-[var(--label)] mb-1">
                Wear ledger {mode === 'compare' ? '(Mode A)' : mode === 'B' ? '(Mode B)' : '(Mode A)'}
              </h3>
              <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mb-3">
                Highlighted rows = after the first shock. Regime shows grid, load, or both.
              </p>
              <table className="w-full text-[11px] min-w-[900px]">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="text-left py-2 pr-2">Y</th>
                    <th className="text-left py-2 pr-2">Regime</th>
                    <th className="text-right py-2 pr-2">DoD%</th>
                    <th className="text-right py-2 pr-2">Cyc/day</th>
                    <th className="text-right py-2 pr-2">Cyc +</th>
                    <th className="text-right py-2 pr-2">Cyc cum</th>
                    <th className="text-right py-2 pr-2">Cyc max</th>
                    <th className="text-right py-2 pr-2">Bat life y</th>
                    <th className="text-right py-2 pr-2">Avail%</th>
                    <th className="text-right py-2 pr-2">Unsrv h/d</th>
                    <th className="text-right py-2 pr-2">DG h/day</th>
                    <th className="text-right py-2 pr-2">DG h +</th>
                    <th className="text-right py-2 pr-2">DG h cum</th>
                    <th className="text-right py-2 pr-2">DG max h</th>
                    <th className="text-center py-2">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {wearPath.wearTable.map(row => (
                    <tr
                      key={row.year}
                      className={`border-b border-white/5 ${row.regime === 'changed' ? 'bg-red-500/5' : ''}`}
                    >
                      <td className="py-1.5 font-mono text-white">{row.year}</td>
                      <td className="text-gray-400">{row.regimeDetail === 'both' ? 'grid+load' : row.regimeDetail}</td>
                      <td className="text-right font-mono text-red-400">{row.actualDoD}</td>
                      <td className="text-right font-mono">{row.batteryCyclesPerDay.toFixed(2)}</td>
                      <td className="text-right font-mono">{fmt(row.batteryCyclesAdded, 0)}</td>
                      <td className="text-right font-mono text-[var(--system-orange)]">{fmt(row.batteryCyclesCumulative, 0)}</td>
                      <td className="text-right font-mono text-gray-500">{fmt(row.batteryAvailableCycles, 0)}</td>
                      <td className="text-right font-mono">{row.batteryYearsSinceInstall}</td>
                      <td className={`text-right font-mono ${row.dcAvailabilityPct < 99.99 ? 'text-[var(--system-orange)]' : 'text-emerald-400'}`}>
                        {row.dcAvailabilityPct.toFixed(2)}
                      </td>
                      <td className={`text-right font-mono ${row.dailyUnservedHours > 0.01 ? 'text-red-400' : 'text-gray-500'}`}>
                        {row.dailyUnservedHours.toFixed(2)}
                      </td>
                      <td className="text-right font-mono">{row.dgRunningHoursPerDay.toFixed(2)}</td>
                      <td className="text-right font-mono">{fmt(row.dgHoursAdded, 0)}</td>
                      <td className="text-right font-mono text-sky-300">{fmt(row.dgHoursCumulative, 0)}</td>
                      <td className="text-right font-mono text-gray-500">{fmt(row.dgMaxHours, 0)}</td>
                      <td className="text-center text-[10px]">
                        {row.batteryReplaced && <span className="text-[var(--system-orange)] mr-1">BAT-R</span>}
                        {row.dgReplaced && <span className="text-sky-400">DG-R</span>}
                        {!row.batteryReplaced && !row.dgReplaced && <span className="text-gray-600">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {wearPath && wearPath.capexEvents.length > 0 && (
            <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-4 shadow-[0_0_0_0.5px_var(--separator)]">
              <h3 className="text-[length:var(--text-subhead-size)] font-semibold text-[var(--label)] mb-2">
                CAPEX events ({mode === 'compare' ? 'Mode A' : mode === 'B' ? 'Mode B' : 'Mode A'})
              </h3>
              <div className="max-h-48 overflow-y-auto text-[length:var(--text-footnote-size)] space-y-1">
                {wearPath.capexEvents.map((e, i) => (
                  <div key={i} className="flex justify-between gap-4 text-[var(--label)] shadow-[inset_0_-0.5px_0_var(--separator)] py-1">
                    <span>
                      <span className="text-gray-500 font-mono mr-2">Y{e.year}</span>
                      <span className={
                        e.kind === 'upgrade' ? 'text-emerald-400' :
                        e.kind === 'replacement' ? 'text-[var(--system-orange)]' : 'text-gray-400'
                      }>[{e.kind}]</span>{' '}
                      {e.name}
                    </span>
                    <span className="font-mono">{currency}{fmt(e.cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'compare' && comparePathB && (
            <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-4 overflow-x-auto shadow-[0_0_0_0.5px_var(--separator)]">
              <h3 className="text-[length:var(--text-subhead-size)] font-semibold text-[var(--system-green)] mb-2">Wear ledger (Mode B)</h3>
              <table className="w-full text-[11px] min-w-[700px]">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="text-left py-2">Y</th>
                    <th className="text-right py-2">Cyc cum</th>
                    <th className="text-right py-2">DG h cum</th>
                    <th className="text-right py-2">DoD%</th>
                    <th className="text-right py-2">Avail%</th>
                    <th className="text-right py-2">Unsrv h/d</th>
                    <th className="text-right py-2">DG h/day</th>
                    <th className="text-center py-2">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {comparePathB.wearTable.map(row => (
                    <tr key={row.year} className={`border-b border-white/5 ${row.regime === 'changed' ? 'bg-emerald-500/5' : ''}`}>
                      <td className="py-1 font-mono">{row.year}</td>
                      <td className="text-right font-mono text-[var(--system-orange)]">{fmt(row.batteryCyclesCumulative, 0)}</td>
                      <td className="text-right font-mono text-sky-300">{fmt(row.dgHoursCumulative, 0)}</td>
                      <td className="text-right font-mono">{row.actualDoD}</td>
                      <td className={`text-right font-mono ${row.dcAvailabilityPct < 99.99 ? 'text-[var(--system-orange)]' : 'text-emerald-400'}`}>
                        {row.dcAvailabilityPct.toFixed(2)}
                      </td>
                      <td className={`text-right font-mono ${row.dailyUnservedHours > 0.01 ? 'text-red-400' : 'text-gray-500'}`}>
                        {row.dailyUnservedHours.toFixed(2)}
                      </td>
                      <td className="text-right font-mono">{row.dgRunningHoursPerDay.toFixed(2)}</td>
                      <td className="text-center text-[10px]">
                        {row.batteryReplaced && <span className="text-[var(--system-orange)] mr-1">BAT-R</span>}
                        {row.dgReplaced && <span className="text-sky-400">DG-R</span>}
                        {!row.batteryReplaced && !row.dgReplaced && '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {runSweep && sweep.length > 0 && (
            <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-4 shadow-[0_0_0_0.5px_var(--separator)]">
              <h3 className="text-[length:var(--text-subhead-size)] font-semibold text-[var(--label)] mb-3">
                Δ NPV vs grid change year (load year {loadChangeYear} fixed)
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sweep}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis dataKey="changeYear" stroke={chartAxis} tick={{ fontSize: 11 }} />
                    <YAxis stroke={chartAxis} tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v) => `${currency}${fmt(Number(v))}`}
                    />
                    <Bar dataKey="deltaNpvOperator" name="Δ NPV operator" fill="var(--tint)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DeltaCard({
  title,
  currency,
  delta,
  accent
}: {
  title: string;
  currency: string;
  delta: {
    npvOperator: number;
    totalCapex: number;
    totalOpexFuel: number;
    breakevenMRR: number;
  };
  accent: 'amber' | 'emerald' | 'sky';
}) {
  const titleColor =
    accent === 'amber' ? 'text-[var(--system-orange)]' :
    accent === 'emerald' ? 'text-[var(--system-green)]' : 'text-[var(--system-blue)]';
  const signed = (n: number) => `${n >= 0 ? '+' : ''}${currency}${fmt(n)}`;

  return (
    <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-4 shadow-[0_0_0_0.5px_var(--separator)]">
      <div className={`text-[length:var(--text-footnote-size)] font-semibold ${titleColor} mb-3`}>{title}</div>
      <div className="grid grid-cols-2 gap-2 text-[length:var(--text-footnote-size)]">
        <div>
          <div className="text-[var(--label-tertiary)]">Δ NPV (operator)</div>
          <div className="font-[family-name:var(--font-numeric)] text-[var(--label)] text-[length:var(--text-subhead-size)]">{signed(delta.npvOperator)}</div>
        </div>
        <div>
          <div className="text-[var(--label-tertiary)]">Δ Total CAPEX</div>
          <div className="font-[family-name:var(--font-numeric)] text-[var(--label)] text-[length:var(--text-subhead-size)]">{signed(delta.totalCapex)}</div>
        </div>
        <div>
          <div className="text-[var(--label-tertiary)]">Δ OPEX + Fuel</div>
          <div className="font-[family-name:var(--font-numeric)] text-[var(--label)] text-[length:var(--text-subhead-size)]">{signed(delta.totalOpexFuel)}</div>
        </div>
        <div>
          <div className="text-[var(--label-tertiary)]">Δ Breakeven MRR</div>
          <div className="font-[family-name:var(--font-numeric)] text-[var(--label)] text-[length:var(--text-subhead-size)]">{signed(delta.breakevenMRR)}</div>
        </div>
      </div>
    </div>
  );
}
