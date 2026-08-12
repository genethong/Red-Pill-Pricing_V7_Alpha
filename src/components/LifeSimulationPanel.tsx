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
import { SiteInputs } from '../types';
import {
  LifeSimMode,
  runLifeSimulation,
  sweepChangeYear
} from '../lib/lifeSimulation';

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

function projectSummary(data: SiteInputs): string {
  const load = (data.tenantLoads || []).reduce((a, t) => a + (t.runningLoad || t.averageLoad || 0), 0);
  const outages = data.gridCondition === 'Off-grid'
    ? '24h outage'
    : `${data.dailyOutages || 0}×${data.outageDuration || 0}h`;
  return `${data.gridCondition || '?'} · ${outages} · ${load.toFixed(1)} kW load`;
}

interface Props {
  /** Saved projects from MY PROJECT for the current user */
  projects: LifeSimProjectRef[];
}

export function LifeSimulationPanel({ projects }: Props) {
  const [baselineId, setBaselineId] = useState<string>('');
  const [changeId, setChangeId] = useState<string>('');
  const [mode, setMode] = useState<LifeSimMode>('compare');
  const [changeYear, setChangeYear] = useState(3);
  const [enableLoadChange, setEnableLoadChange] = useState(false);
  const [loadScalePct, setLoadScalePct] = useState(0);
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
  }, [tenure, changeYear]);

  const canRun = !!(baselineInputs && changeInputs && baselineId !== changeId);

  const simResult = useMemo(() => {
    if (!canRun || !baselineInputs || !changeInputs) return null;
    return runLifeSimulation(baselineInputs, {
      mode,
      change: {
        changeYear,
        changeProject: changeInputs,
        ...(enableLoadChange && loadScalePct !== 0
          ? { loadScale: 1 + loadScalePct / 100 }
          : {})
      }
    });
  }, [canRun, baselineInputs, changeInputs, mode, changeYear, enableLoadChange, loadScalePct]);

  const sweep = useMemo(() => {
    if (!runSweep || !canRun || !baselineInputs || !changeInputs) return [];
    const m = mode === 'B' ? 'B' : 'A';
    return sweepChangeYear(
      baselineInputs,
      {
        changeProject: changeInputs,
        ...(enableLoadChange && loadScalePct !== 0
          ? { loadScale: 1 + loadScalePct / 100 }
          : {})
      },
      m
    );
  }, [runSweep, canRun, baselineInputs, changeInputs, mode, enableLoadChange, loadScalePct]);

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
    'w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50';

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Life Simulation — Environment What-If</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-3xl">
              Compare a <strong className="text-gray-300">baseline</strong> and a <strong className="text-gray-300">change</strong> scenario
              from <strong className="text-red-400">MY PROJECT</strong>. Save two projects first (different grid/config as needed).
              Here you only set <strong className="text-gray-300">change year</strong> and optional <strong className="text-gray-300">load change</strong>.
            </p>
          </div>
        </div>

        {projects.length < 2 && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200/90">
            <Info size={16} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">Save at least two projects under MY PROJECT</p>
              <p className="mt-1 text-amber-200/70">
                1) Configure baseline site (grid, load, power system, costs) → Save project.<br />
                2) Configure the post-change scenario (e.g. worse grid) → Save as a second project.<br />
                3) Return here, pick both, set change year (± load), then review Mode A / B.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Project pickers */}
          <div className="space-y-3 lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1.5">
                  <FolderOpen size={12} /> Baseline project (Year 0 design & grid)
                </label>
                <select
                  value={baselineId}
                  onChange={e => setBaselineId(e.target.value)}
                  className={`mt-1 ${selectClass}`}
                >
                  <option value="">— Select saved project —</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {baselineProject && (
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">{projectSummary(baselineProject.data)}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1.5">
                  <FolderOpen size={12} /> Change project (post-shock config & grid)
                </label>
                <select
                  value={changeId}
                  onChange={e => setChangeId(e.target.value)}
                  className={`mt-1 ${selectClass}`}
                >
                  <option value="">— Select saved project —</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id} disabled={p.id === baselineId}>{p.name}</option>
                  ))}
                </select>
                {changeProject && (
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">{projectSummary(changeProject.data)}</p>
                )}
              </div>
            </div>

            {baselineId && changeId && baselineId === changeId && (
              <p className="text-xs text-red-400">Baseline and change must be two different saved projects.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Change year</label>
                <input
                  type="number"
                  min={1}
                  max={tenure}
                  value={changeYear}
                  onChange={(e) => setChangeYear(Math.min(tenure, Math.max(1, parseInt(e.target.value || '1', 10))))}
                  className={`mt-1 ${selectClass}`}
                  disabled={!canRun}
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Tenure from baseline: {tenure} years · Shock applies from this year onward
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-300 mt-5">
                  <input
                    type="checkbox"
                    checked={enableLoadChange}
                    onChange={e => setEnableLoadChange(e.target.checked)}
                    className="accent-red-500"
                    disabled={!canRun}
                  />
                  Additional load change on post-shock years
                </label>
                {enableLoadChange && (
                  <div className="mt-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                      Load change (%)
                    </label>
                    <input
                      type="number"
                      value={loadScalePct}
                      onChange={e => setLoadScalePct(parseFloat(e.target.value) || 0)}
                      className={`mt-1 ${selectClass}`}
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Applied on top of the change project loads (e.g. 20 = +20%). Grid/config still from change project.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mode */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Commercial response</label>
            <div className="flex flex-col gap-2">
              {([
                { id: 'A' as const, label: 'Mode A — Operate as designed' },
                { id: 'B' as const, label: 'Mode B — Adaptive re-investment' },
                { id: 'compare' as const, label: 'Compare A vs B' }
              ]).map(opt => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                    mode === opt.id
                      ? 'border-red-500/50 bg-red-500/10 text-white'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="lifeMode"
                    checked={mode === opt.id}
                    onChange={() => setMode(opt.id)}
                    className="accent-red-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mt-3">
              <input
                type="checkbox"
                checked={runSweep}
                onChange={e => setRunSweep(e.target.checked)}
                className="accent-red-500"
                disabled={!canRun}
              />
              Change-year sweep ({mode === 'B' ? 'Mode B' : 'Mode A'})
            </label>
            {simResult && (
              <div className="text-[10px] text-gray-500 border border-white/5 rounded-lg p-2 bg-black/20 mt-2">
                Baseline design: {simResult.baseline.rectifierStats.batteryModules} bat ·{' '}
                {simResult.baseline.rectifierStats.rectifierModules} rect ·{' '}
                {simResult.baseline.rectifierStats.requiredDGKva || 0} kVA DG ·{' '}
                {simResult.baseline.rectifierStats.adjustedBatteryCapacityAH} AH
              </div>
            )}
          </div>
        </div>
      </div>

      {!canRun && (
        <div className="text-center text-sm text-gray-500 py-12 border border-dashed border-white/10 rounded-xl">
          Select two different saved projects from MY PROJECT to run life simulation.
        </div>
      )}

      {canRun && simResult && (
        <>
          {/* Delta cards */}
          {mode === 'compare' && simResult.deltaA && simResult.deltaB && simResult.deltaBminusA ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <DeltaCard title="Mode A vs Baseline" currency={currency} delta={simResult.deltaA} accent="amber" />
              <DeltaCard title="Mode B vs Baseline" currency={currency} delta={simResult.deltaB} accent="emerald" />
              <DeltaCard title="B − A (value of reinvest)" currency={currency} delta={simResult.deltaBminusA} accent="sky" />
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

          {/* Risk flags */}
          {(comparePathA?.riskFlags?.length || comparePathB?.riskFlags?.length || activePath?.riskFlags?.length) ? (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-2">
                <AlertTriangle size={16} /> Design / ops risk flags
              </div>
              <ul className="text-xs text-amber-200/80 space-y-1 list-disc pl-5">
                {mode === 'compare' ? (
                  <>
                    {comparePathA?.riskFlags.map((f, i) => (
                      <li key={`a-${i}`}><span className="text-amber-500 font-mono">A:</span> {f}</li>
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
            <div className="bg-[#1a1a1a] border border-emerald-500/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
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
            <div className="text-xs text-gray-500 bg-[#1a1a1a] border border-white/10 rounded-xl p-3">
              Mode B: no capacity upgrade required for this shock (baseline design still adequate under change project).
            </div>
          )}

          {/* Cashflow chart */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <GitCompare size={16} className="text-red-400" /> Annual total outflow
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="year" stroke="#666" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#666" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid #333', fontSize: 12 }}
                    formatter={(v) => `${currency}${fmt(Number(v))}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="baseline" name="Baseline project" stroke="#6b7280" strokeWidth={2} dot={false} />
                  {(mode === 'A' || mode === 'compare') && (
                    <Line type="monotone" dataKey={mode === 'compare' ? 'modeA' : 'scenario'} name="Mode A" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  )}
                  {(mode === 'B' || mode === 'compare') && (
                    <Line type="monotone" dataKey={mode === 'compare' ? 'modeB' : 'scenario'} name="Mode B" stroke="#10b981" strokeWidth={2} dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Wear table */}
          {wearPath && (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 overflow-x-auto">
              <h3 className="text-sm font-semibold text-white mb-1">
                Wear ledger {mode === 'compare' ? '(Mode A)' : mode === 'B' ? '(Mode B)' : '(Mode A)'}
              </h3>
              <p className="text-[10px] text-gray-500 mb-3">
                Cumulative battery cycles and DG hours. Highlighted rows = post-change regime (change project).
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
                      <td className="text-gray-400">{row.regime}</td>
                      <td className="text-right font-mono text-red-400">{row.actualDoD}</td>
                      <td className="text-right font-mono">{row.batteryCyclesPerDay.toFixed(2)}</td>
                      <td className="text-right font-mono">{fmt(row.batteryCyclesAdded, 0)}</td>
                      <td className="text-right font-mono text-amber-300">{fmt(row.batteryCyclesCumulative, 0)}</td>
                      <td className="text-right font-mono text-gray-500">{fmt(row.batteryAvailableCycles, 0)}</td>
                      <td className="text-right font-mono">{row.batteryYearsSinceInstall}</td>
                      <td className="text-right font-mono">{row.dgRunningHoursPerDay.toFixed(2)}</td>
                      <td className="text-right font-mono">{fmt(row.dgHoursAdded, 0)}</td>
                      <td className="text-right font-mono text-sky-300">{fmt(row.dgHoursCumulative, 0)}</td>
                      <td className="text-right font-mono text-gray-500">{fmt(row.dgMaxHours, 0)}</td>
                      <td className="text-center text-[10px]">
                        {row.batteryReplaced && <span className="text-amber-400 mr-1">BAT-R</span>}
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
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">
                CAPEX events ({mode === 'compare' ? 'Mode A' : mode === 'B' ? 'Mode B' : 'Mode A'})
              </h3>
              <div className="max-h-48 overflow-y-auto text-xs space-y-1">
                {wearPath.capexEvents.map((e, i) => (
                  <div key={i} className="flex justify-between gap-4 text-gray-300 border-b border-white/5 py-1">
                    <span>
                      <span className="text-gray-500 font-mono mr-2">Y{e.year}</span>
                      <span className={
                        e.kind === 'upgrade' ? 'text-emerald-400' :
                        e.kind === 'replacement' ? 'text-amber-400' : 'text-gray-400'
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
            <div className="bg-[#1a1a1a] border border-emerald-500/15 rounded-xl p-4 overflow-x-auto">
              <h3 className="text-sm font-semibold text-emerald-400 mb-2">Wear ledger (Mode B)</h3>
              <table className="w-full text-[11px] min-w-[700px]">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="text-left py-2">Y</th>
                    <th className="text-right py-2">Cyc cum</th>
                    <th className="text-right py-2">DG h cum</th>
                    <th className="text-right py-2">DoD%</th>
                    <th className="text-right py-2">DG h/day</th>
                    <th className="text-center py-2">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {comparePathB.wearTable.map(row => (
                    <tr key={row.year} className={`border-b border-white/5 ${row.regime === 'changed' ? 'bg-emerald-500/5' : ''}`}>
                      <td className="py-1 font-mono">{row.year}</td>
                      <td className="text-right font-mono text-amber-300">{fmt(row.batteryCyclesCumulative, 0)}</td>
                      <td className="text-right font-mono text-sky-300">{fmt(row.dgHoursCumulative, 0)}</td>
                      <td className="text-right font-mono">{row.actualDoD}</td>
                      <td className="text-right font-mono">{row.dgRunningHoursPerDay.toFixed(2)}</td>
                      <td className="text-center text-[10px]">
                        {row.batteryReplaced && <span className="text-amber-400 mr-1">BAT-R</span>}
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
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Δ NPV operator vs change year ({mode === 'B' ? 'Mode B' : 'Mode A'})
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sweep}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="changeYear" stroke="#666" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#666" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#111', border: '1px solid #333', fontSize: 12 }}
                      formatter={(v) => `${currency}${fmt(Number(v))}`}
                    />
                    <Bar dataKey="deltaNpvOperator" name="Δ NPV operator" fill="#ef4444" radius={[4, 4, 0, 0]} />
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
  const border =
    accent === 'amber' ? 'border-amber-500/30' :
    accent === 'emerald' ? 'border-emerald-500/30' : 'border-sky-500/30';
  const titleColor =
    accent === 'amber' ? 'text-amber-400' :
    accent === 'emerald' ? 'text-emerald-400' : 'text-sky-400';
  const signed = (n: number) => `${n >= 0 ? '+' : ''}${currency}${fmt(n)}`;

  return (
    <div className={`bg-[#1a1a1a] border ${border} rounded-xl p-4`}>
      <div className={`text-xs font-semibold ${titleColor} mb-3`}>{title}</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-gray-500">Δ NPV (operator)</div>
          <div className="font-mono text-white text-sm">{signed(delta.npvOperator)}</div>
        </div>
        <div>
          <div className="text-gray-500">Δ Total CAPEX</div>
          <div className="font-mono text-white text-sm">{signed(delta.totalCapex)}</div>
        </div>
        <div>
          <div className="text-gray-500">Δ OPEX + Fuel</div>
          <div className="font-mono text-white text-sm">{signed(delta.totalOpexFuel)}</div>
        </div>
        <div>
          <div className="text-gray-500">Δ Breakeven MRR</div>
          <div className="font-mono text-white text-sm">{signed(delta.breakevenMRR)}</div>
        </div>
      </div>
    </div>
  );
}
