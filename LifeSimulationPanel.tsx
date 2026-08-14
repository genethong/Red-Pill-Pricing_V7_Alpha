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
  Bar,
  Cell
} from 'recharts';
import { AlertTriangle, Activity, GitCompare, TrendingUp, FolderOpen, Info, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Button } from './ui';
import { SiteInputs } from '../types';
import {
  LifeSimMode,
  runLifeSimulation,
  sweepChangeYear,
  totalAverageLoadKw
} from '../lib/lifeSimulation';
import { chartAxis, chartGrid, chartTooltipStyle } from '../lib/chartTheme';
import { buildLifeSimSpreadsheetXml, downloadLifeSimExcel } from '../lib/lifeSimExcel';

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

function friendlyCapex(name: string): string {
  return name
    .replace(/\s*\(lot Y0\)\s*/gi, ' ')
    .replace(/\s*\(add-on Y(\d+)\)/gi, ' added (year $1)')
    .replace(/Battery Modules lot (Y\d+) \((\d+) modules, replacement\)/gi, 'Battery $1 replaced ($2 modules)')
    .replace(/Battery Modules \(Replacement[^)]*\)/gi, 'Battery replaced')
    .replace(/\s+replacement$/i, ' replaced')
    .replace(/\s+/g, ' ')
    .trim();
}

function yearSpend(cf: { details?: { capexItems?: { name: string; cost: number }[] } } | undefined): string {
  const items = (cf?.details?.capexItems || []).map(i => friendlyCapex(i.name)).filter(Boolean);
  if (items.length === 0) return '—';
  return items.slice(0, 2).join('; ') + (items.length > 2 ? '…' : '');
}

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
  const [runSweep, setRunSweep] = useState(true);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [openFold, setOpenFold] = useState<string | null>(null);

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
      mode: 'compare',
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
    const years = simResult.noShock.cashFlows.map(c => c.year);
    return years.map(y => {
      const row: Record<string, number> = { year: y };
      row.baseline = simResult.noShock.cashFlows[y]?.totalOutflow || 0;
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
              Grid and load can change in different years. Extra load is in kW. Keep this config leaves year-0 kit as-is. Upgrade may add kit at each change.
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
                { id: 'A' as const, label: 'Keep this config' },
                { id: 'B' as const, label: 'Upgrade at each change' },
                { id: 'compare' as const, label: 'Compare both' }
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
                ? 'Upgrade may add kit at the grid year and again at the load year if those years differ.'
                : mode === 'compare'
                  ? 'Keep this config leaves year-0 kit as-is. Upgrade may add kit when grid or load changes.'
                  : 'Keep this config leaves year-0 kit as-is. Grid and load follow the years you set. Hours the battery cannot cover stay unserved if there is no genset.'}
            </p>
            <label className="flex items-start gap-2 text-[length:var(--text-subhead-size)] text-[var(--label)] mt-3">
              <input
                type="checkbox"
                checked={runSweep}
                onChange={e => setRunSweep(e.target.checked)}
                className="accent-[var(--tint)] mt-0.5"
                disabled={!canRun}
              />
              <span>
                Show “what if the grid changes in a different year?”
                <span className="block text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] font-normal">
                  Scroll down for a year-by-year extra-cost table. Load year stays {loadChangeYear}.
                </span>
              </span>
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
          {simResult.deltaA && simResult.deltaB && simResult.deltaBminusA && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <DeltaCard title="Keep this config vs no change" currency={currency} delta={simResult.deltaA} accent="amber" />
              <DeltaCard title="Upgrade vs no change" currency={currency} delta={simResult.deltaB} accent="emerald" />
              <DeltaCard title="Upgrade − Keep (value of adding kit)" currency={currency} delta={simResult.deltaBminusA} accent="sky" />
            </div>
          )}
          <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] -mt-1">
            Δ CAPEX and Δ OPEX + Fuel are undiscounted sums (escalation is already in each year’s cheque). Replacing earlier can make Δ CAPEX negative because you avoid later inflated prices — not because spend is reversed. Δ NPV is discounted at WACC.
          </p>

          {(comparePathA?.availability || comparePathB?.availability || activePath?.availability) && (
            <Fold id="avail" title="Availability" open={openFold === 'avail'} onToggle={id => setOpenFold(id || null)}>
              <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mb-3 max-w-3xl">
                Time-based: (24 − unserved hours) / 24. Residual outage is grid-down time the kit cannot cover.
                Keep this config never adds a genset. Upgrade may add one when grid or load changes.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[640px]">
                  <thead>
                    <tr className="text-gray-500 border-b border-white/10">
                      <th className="text-left py-2 pr-3">Metric</th>
                      <th className="text-right py-2 pr-3">Baseline design</th>
                      {(mode === 'A' || mode === 'compare') && <th className="text-right py-2 pr-3 text-[var(--system-orange)]">Keep, after change</th>}
                      {(mode === 'B' || mode === 'compare') && <th className="text-right py-2 pr-3 text-emerald-400">Upgrade, after change</th>}
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
            </Fold>
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

          {(mode === 'B' || mode === 'compare') && comparePathB && comparePathB.upgradeBoq.length > 0 && (
            <Fold id="boq" title="Upgrade kit added" open={openFold === 'boq'} onToggle={id => setOpenFold(id || null)}>
              <div className="space-y-3">
              {comparePathB.upgradeBoq.map((set, sIdx) => (
                <div key={`${set.year}-${set.reason}-${sIdx}`}>
                  <h3 className="text-[length:var(--text-subhead-size)] font-semibold text-[var(--system-green)] mb-1">
                    Year {set.year}
                  </h3>
                  <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mb-2">
                    {set.reason === 'both'
                      ? 'Grid and load change in the same year. Kit added on top of the year-0 plant.'
                      : set.reason === 'load'
                        ? 'Load change. Extra batteries are added; the existing bank keeps its wear.'
                        : 'Grid change. Incremental kit on top of what is already installed.'}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 border-b border-white/10">
                          <th className="text-left py-2">Item</th>
                          <th className="text-right py-2">Qty</th>
                          <th className="text-right py-2">Unit</th>
                          <th className="text-right py-2">Total (Y0)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {set.items.map((u, i) => (
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
              ))}
              </div>
            </Fold>
          )}

          {simResult && (
            <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-4 shadow-[0_0_0_0.5px_var(--separator)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-[length:var(--text-subhead-size)] font-semibold text-[var(--label)]">Year by year</h3>
                  <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)]">
                    No change = same kit and grid forever. Keep = your years, no extra kit. Upgrade = may add kit. Expand a year for the cheques.
                  </p>
                </div>
                <Button
                  variant="gray"
                  size="compact"
                  onClick={() => {
                    if (!simResult || !baselineInputs) return;
                    const xml = buildLifeSimSpreadsheetXml(simResult, baselineInputs, {
                      baselineName: baselineProject?.name || 'Baseline',
                      changeName: changeProject?.name || 'Change',
                      gridChangeYear: changeYear,
                      loadChangeYear,
                      loadDeltaKw,
                      mode
                    });
                    const stamp = new Date().toISOString().slice(0, 10);
                    downloadLifeSimExcel(xml, `LifeSim_${baselineProject?.name || 'export'}_${stamp}.xlsx`);
                  }}
                >
                  <Download className="w-4 h-4" />
                  Excel (formulas)
                </Button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-[length:var(--text-footnote-size)] min-w-[720px]">
                    <thead>
                      <tr className="text-[var(--label-secondary)] shadow-[inset_0_-0.5px_0_var(--separator)]">
                        <th className="text-left py-3 pr-2 font-semibold">Year</th>
                        <th className="text-right py-3 px-2 font-semibold">No change</th>
                        <th className="text-right py-3 px-2 font-semibold text-[var(--system-orange)]">Keep this config</th>
                        <th className="text-right py-3 px-2 font-semibold text-[var(--system-green)]">Upgrade</th>
                        <th className="text-left py-3 px-2 font-semibold">Spend this year</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {simResult.noShock.cashFlows.map((bcf) => {
                        const a = comparePathA?.cashFlows[bcf.year];
                        const b = comparePathB?.cashFlows[bcf.year];
                        const spend = [yearSpend(a), yearSpend(b)].filter(s => s && s !== '—');
                        const spendText = bcf.year === 0
                          ? 'Year-0 kit (same on all paths)'
                          : (spend[0] && spend[0] !== spend[1] ? [...new Set(spend)].join(' · ') : (spend[0] || '—'));
                        return (
                          <React.Fragment key={bcf.year}>
                            <tr className="shadow-[inset_0_-0.5px_0_var(--separator)]">
                              <td className="py-3 font-medium text-[var(--label-secondary)]">T={bcf.year}</td>
                              <td className="py-3 text-right font-[family-name:var(--font-numeric)] text-[var(--label)]">{currency}{fmt(bcf.totalOutflow)}</td>
                              <td className="py-3 text-right font-[family-name:var(--font-numeric)] text-[var(--system-orange)]">{currency}{fmt(a?.totalOutflow)}</td>
                              <td className="py-3 text-right font-[family-name:var(--font-numeric)] text-[var(--system-green)]">{currency}{fmt(b?.totalOutflow)}</td>
                              <td className="py-3 text-[length:var(--text-caption-1-size)] text-[var(--label-secondary)] max-w-[220px]">{spendText}</td>
                              <td className="py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setExpandedYear(expandedYear === bcf.year ? null : bcf.year)}
                                  className="p-1 rounded-[var(--radius-control)] hover:bg-[var(--fill-tertiary)]"
                                >
                                  {expandedYear === bcf.year ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                              </td>
                            </tr>
                            {expandedYear === bcf.year && (
                              <tr>
                                <td colSpan={6} className="p-3">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                      { title: 'No change', cf: bcf },
                                      { title: 'Keep this config', cf: a },
                                      { title: 'Upgrade', cf: b }
                                    ].map(col => col.cf && (
                                      <div key={col.title}>
                                        <div className="font-semibold text-[var(--label)] mb-1">{col.title}</div>
                                        <div className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mb-1">
                                          CAPEX {currency}{fmt(col.cf.capex)} · OPEX {currency}{fmt(col.cf.opex)} · Fuel {currency}{fmt(col.cf.fuel)}
                                        </div>
                                        {(col.cf.details?.capexItems || []).length === 0 && (
                                          <div className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)]">No CAPEX this year</div>
                                        )}
                                        {(col.cf.details?.capexItems || []).map((item, i) => (
                                          <div key={`c-${i}`} className="flex justify-between text-[length:var(--text-caption-1-size)] gap-2">
                                            <span className="text-[var(--label-secondary)]">{friendlyCapex(item.name)}</span>
                                            <span className="font-[family-name:var(--font-numeric)] text-[var(--label)]">{currency}{fmt(item.cost)}</span>
                                          </div>
                                        ))}
                                        {(col.cf.details?.opexItems || []).map((item, i) => (
                                          <div key={`o-${i}`} className="flex justify-between text-[length:var(--text-caption-1-size)] gap-2">
                                            <span className="text-[var(--label-secondary)]">{item.name}</span>
                                            <span className="font-[family-name:var(--font-numeric)] text-[var(--label)]">{currency}{fmt(item.cost)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
              </div>
            </div>
          )}

          <Fold id="chart" title="Outflow chart" open={openFold === 'chart'} onToggle={id => setOpenFold(id || null)}>
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
                  <Line type="monotone" dataKey="baseline" name="No change" stroke="var(--label-tertiary)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="modeA" name="Keep this config" stroke="var(--system-orange)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="modeB" name="Upgrade" stroke="var(--system-green)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Fold>

          {wearPath && (
            <Fold id="wear" title="Wear and cycles" open={openFold === 'wear'} onToggle={id => setOpenFold(id || null)}>
              <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mb-3">
                Keep this config. Highlighted rows = after the first shock.
              </p>
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
                        {row.batteryReplaced && (
                          <span className="text-[var(--system-orange)] mr-1">
                            BAT-R{(row.batteryLotsReplaced || []).length ? ` ${row.batteryLotsReplaced.join(',')}` : ''}
                          </span>
                        )}
                        {row.dgReplaced && <span className="text-sky-400">DG-R</span>}
                        {!row.batteryReplaced && !row.dgReplaced && <span className="text-gray-600">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Fold>
          )}

          {comparePathB && (
            <Fold id="wearB" title="Wear and cycles (Upgrade)" open={openFold === 'wearB'} onToggle={id => setOpenFold(id || null)}>
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
                        {row.batteryReplaced && (
                          <span className="text-[var(--system-orange)] mr-1">
                            BAT-R{(row.batteryLotsReplaced || []).length ? ` ${row.batteryLotsReplaced.join(',')}` : ''}
                          </span>
                        )}
                        {row.dgReplaced && <span className="text-sky-400">DG-R</span>}
                        {!row.batteryReplaced && !row.dgReplaced && '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Fold>
          )}

          {runSweep && sweep.length > 0 && (
            <Fold id="sweep" title="What if the grid year is different?" open={openFold === 'sweep'} onToggle={id => setOpenFold(id || null)}>
              <div className="space-y-3">
              <div>
                <p className="text-[length:var(--text-footnote-size)] text-[var(--label-secondary)] mt-1 max-w-3xl">
                  Each bar is one full-life rerun. Taller bar = that timing costs you more over the tenure
                  (extra NPV outflow vs never changing the grid). Load still changes in year {loadChangeYear}.
                  The highlighted bar is the grid year you picked above ({changeYear}).
                </p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sweep} margin={{ top: 8, right: 8, left: 8, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis
                      dataKey="changeYear"
                      stroke={chartAxis}
                      tick={{ fontSize: 11 }}
                      label={{ value: 'Grid goes bad in year…', position: 'insideBottom', offset: -12, fontSize: 11, fill: 'var(--label-tertiary)' }}
                    />
                    <YAxis
                      stroke={chartAxis}
                      tick={{ fontSize: 11 }}
                      tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                      label={{ value: 'Extra lifetime cost', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--label-tertiary)' }}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v) => [`${currency}${fmt(Number(v))}`, 'Extra lifetime cost']}
                      labelFormatter={(y) => `If grid changes in year ${y}`}
                    />
                    <Bar dataKey="deltaNpvOperator" name="Extra lifetime cost" radius={[4, 4, 0, 0]}>
                      {sweep.map((row) => (
                        <Cell
                          key={row.changeYear}
                          fill={row.changeYear === changeYear ? 'var(--tint)' : 'var(--fill)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[length:var(--text-footnote-size)] min-w-[360px]">
                  <thead>
                    <tr className="text-[var(--label-secondary)] shadow-[inset_0_-0.5px_0_var(--separator)]">
                      <th className="text-left py-2 font-semibold">If grid changes in…</th>
                      <th className="text-right py-2 font-semibold">Extra lifetime cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sweep.map((row) => (
                      <tr
                        key={row.changeYear}
                        className={`shadow-[inset_0_-0.5px_0_var(--separator)] ${row.changeYear === changeYear ? 'bg-[var(--tint-soft)]' : ''}`}
                      >
                        <td className="py-1.5 text-[var(--label)]">
                          Year {row.changeYear}
                          {row.changeYear === changeYear ? ' (your pick)' : ''}
                        </td>
                        <td className="py-1.5 text-right font-[family-name:var(--font-numeric)] text-[var(--label)]">
                          {row.deltaNpvOperator >= 0 ? '+' : ''}{currency}{fmt(row.deltaNpvOperator)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            </Fold>
          )}
        </>
      )}
    </div>
  );
}

function Fold({
  id,
  title,
  open,
  onToggle,
  children
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-element)] bg-[var(--fill-quaternary)] shadow-[0_0_0_0.5px_var(--separator)]">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-[var(--space-4)] py-3 text-left"
        onClick={() => onToggle(open ? '' : id)}
      >
        <span className="text-[length:var(--text-subhead-size)] font-semibold text-[var(--label)]">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-[var(--label-tertiary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--label-tertiary)]" />}
      </button>
      {open && <div className="px-[var(--space-4)] pb-[var(--space-4)]">{children}</div>}
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
          <div className="text-[var(--label-tertiary)]">Δ NPV (operator, discounted)</div>
          <div className="font-[family-name:var(--font-numeric)] text-[var(--label)] text-[length:var(--text-subhead-size)]">{signed(delta.npvOperator)}</div>
        </div>
        <div>
          <div className="text-[var(--label-tertiary)]">Δ CAPEX (undiscounted)</div>
          <div className="font-[family-name:var(--font-numeric)] text-[var(--label)] text-[length:var(--text-subhead-size)]">{signed(delta.totalCapex)}</div>
        </div>
        <div>
          <div className="text-[var(--label-tertiary)]">Δ OPEX + Fuel (undiscounted)</div>
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
