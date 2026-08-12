import React, { useMemo, useState } from 'react';
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
import { AlertTriangle, Activity, GitCompare, TrendingUp } from 'lucide-react';
import { SiteInputs, GridCondition } from '../types';
import {
  LifeSimMode,
  runLifeSimulation,
  sweepChangeYear
} from '../lib/lifeSimulation';
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

interface Props {
  inputs: SiteInputs;
}

export function LifeSimulationPanel({ inputs }: Props) {
  const currency = getCurrencySymbol(inputs.financials.currency);
  const tenure = inputs.financials.tenure || 10;

  const [mode, setMode] = useState<LifeSimMode>('compare');
  const [changeYear, setChangeYear] = useState(Math.min(3, tenure));
  const [enableGridChange, setEnableGridChange] = useState(true);
  const [gridCondition, setGridCondition] = useState<GridCondition>('Bad');
  const [dailyOutages, setDailyOutages] = useState(inputs.dailyOutages ?? 3);
  const [outageDuration, setOutageDuration] = useState(inputs.outageDuration ?? 6);
  const [enableLoadChange, setEnableLoadChange] = useState(false);
  const [loadScalePct, setLoadScalePct] = useState(20); // +20%
  const [runSweep, setRunSweep] = useState(false);

  const simResult = useMemo(() => {
    return runLifeSimulation(inputs, {
      mode,
      change: {
        changeYear,
        ...(enableGridChange
          ? { gridCondition, dailyOutages, outageDuration }
          : {}),
        ...(enableLoadChange ? { loadScale: 1 + loadScalePct / 100 } : {})
      }
    });
  }, [
    inputs,
    mode,
    changeYear,
    enableGridChange,
    gridCondition,
    dailyOutages,
    outageDuration,
    enableLoadChange,
    loadScalePct
  ]);

  const sweep = useMemo(() => {
    if (!runSweep) return [];
    const m = mode === 'B' ? 'B' : 'A';
    return sweepChangeYear(
      inputs,
      {
        ...(enableGridChange
          ? { gridCondition, dailyOutages, outageDuration }
          : {}),
        ...(enableLoadChange ? { loadScale: 1 + loadScalePct / 100 } : {})
      },
      m
    );
  }, [
    runSweep,
    mode,
    inputs,
    enableGridChange,
    gridCondition,
    dailyOutages,
    outageDuration,
    enableLoadChange,
    loadScalePct
  ]);

  const activePath = mode === 'B' ? simResult.modeB : simResult.modeA;
  const comparePathA = simResult.modeA;
  const comparePathB = simResult.modeB;

  const cashChartData = useMemo(() => {
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

  const deltaCards = () => {
    if (mode === 'compare' && simResult.deltaA && simResult.deltaB && simResult.deltaBminusA) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DeltaCard title="Mode A vs Baseline" currency={currency} delta={simResult.deltaA} accent="amber" />
          <DeltaCard title="Mode B vs Baseline" currency={currency} delta={simResult.deltaB} accent="emerald" />
          <DeltaCard title="B − A (value of reinvest)" currency={currency} delta={simResult.deltaBminusA} accent="sky" />
        </div>
      );
    }
    const d = mode === 'B' ? simResult.deltaB : simResult.deltaA;
    if (!d) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-1 gap-3 max-w-md">
        <DeltaCard
          title={`${mode === 'B' ? 'Mode B' : 'Mode A'} vs Baseline`}
          currency={currency}
          delta={d}
          accent={mode === 'B' ? 'emerald' : 'amber'}
        />
      </div>
    );
  };

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
              Shock grid and/or load from a chosen year. Track cumulative battery cycles and DG hours,
              replacements, and commercial deltas. Mode A keeps Year-0 design; Mode B allows delta re-investment at the change year.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
          </div>

          {/* Change year + grid */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Change year</label>
              <input
                type="number"
                min={1}
                max={tenure}
                value={changeYear}
                onChange={(e) => setChangeYear(Math.min(tenure, Math.max(1, parseInt(e.target.value || '1', 10))))}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              />
              <p className="text-[10px] text-gray-500 mt-1">Tenure: {tenure} years · Shock applies from this year onward</p>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={enableGridChange}
                onChange={e => setEnableGridChange(e.target.checked)}
                className="accent-red-500"
              />
              Change grid assumption
            </label>
            {enableGridChange && (
              <div className="grid grid-cols-1 gap-2 pl-1">
                <select
                  value={gridCondition}
                  onChange={e => setGridCondition(e.target.value as GridCondition)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="Good">Good</option>
                  <option value="Poor">Poor</option>
                  <option value="Bad">Bad</option>
                  <option value="Off-grid">Off-grid</option>
                </select>
                {gridCondition !== 'Off-grid' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500">Daily outages</label>
                      <input
                        type="number"
                        min={0}
                        value={dailyOutages ?? ''}
                        onChange={e => setDailyOutages(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">Outage hours</label>
                      <input
                        type="number"
                        min={0}
                        value={outageDuration ?? ''}
                        onChange={e => setOutageDuration(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Load change */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={enableLoadChange}
                onChange={e => setEnableLoadChange(e.target.checked)}
                className="accent-red-500"
              />
              Change load
            </label>
            {enableLoadChange && (
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  Load change (%)
                </label>
                <input
                  type="number"
                  value={loadScalePct}
                  onChange={e => setLoadScalePct(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  e.g. 20 = +20% peak/avg/running on all tenants
                </p>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-300 mt-4">
              <input
                type="checkbox"
                checked={runSweep}
                onChange={e => setRunSweep(e.target.checked)}
                className="accent-red-500"
              />
              Change-year sweep chart ({mode === 'B' ? 'Mode B' : 'Mode A'})
            </label>

            <div className="text-[10px] text-gray-500 border border-white/5 rounded-lg p-2 bg-black/20">
              Baseline design: {simResult.baseline.rectifierStats.batteryModules} bat mod ·{' '}
              {simResult.baseline.rectifierStats.rectifierModules} rect mod ·{' '}
              {simResult.baseline.rectifierStats.requiredDGKva || 0} kVA DG ·{' '}
              {simResult.baseline.rectifierStats.adjustedBatteryCapacityAH} AH
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {deltaCards()}

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

      {/* Mode B upgrade BoQ */}
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
          Mode B: no capacity upgrade required for this shock (design still adequate).
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
              <Line type="monotone" dataKey="baseline" name="Baseline" stroke="#6b7280" strokeWidth={2} dot={false} />
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
            Cumulative battery cycles and DG hours. Highlighted rows = post-change regime.
            {mode === 'compare' && comparePathB ? ' Switch to Mode B alone to view B wear table.' : ''}
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
                  className={`border-b border-white/5 ${
                    row.regime === 'changed' ? 'bg-red-500/5' : ''
                  }`}
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

      {/* Capex events */}
      {wearPath && wearPath.capexEvents.length > 0 && (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-2">CAPEX events ({mode === 'compare' ? 'Mode A' : mode === 'B' ? 'Mode B' : 'Mode A'})</h3>
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

      {/* Mode B wear if compare — secondary table toggle via mode B only is enough; show B events when compare */}
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

      {/* Sweep */}
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
