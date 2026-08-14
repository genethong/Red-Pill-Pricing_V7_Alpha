import { SiteInputs } from '../types';
import { LifeSimResult, ModePathResult } from './lifeSimulation';
import { a1, buildXlsx, XCell } from './xlsxMinimal';

const S = (v: string): XCell => ({ t: 's', v });
const H = (v: string): XCell => ({ t: 's', v, s: 1 });
const T = (v: string): XCell => ({ t: 's', v, s: 3 });
const N = (v: number): XCell => ({ t: 'n', v: Number.isFinite(v) ? v : 0, s: 2 });
const F = (formula: string, cached = 0): XCell => ({ t: 'f', v: formula, cached, s: 2 });

function emptyPath(tenure: number): ModePathResult {
  const cashFlows = Array.from({ length: tenure + 1 }, (_, year) => ({
    year,
    capex: 0,
    opex: 0,
    fuel: 0,
    totalOutflow: 0,
    totalSystemOutflow: 0,
    details: { capexItems: [], opexItems: [] }
  }));
  return {
    mode: 'A',
    cashFlows,
    wearTable: [],
    capexEvents: [],
    upgradeBoq: [],
    riskFlags: [],
    npvOperator: 0,
    npvSystem: 0,
    breakevenMRR: 0,
    lcoe: 0,
    initialCapex: 0,
    totalCapex: 0,
    totalOpexFuel: 0,
    availability: {
      baselinePct: 0,
      preChangePct: 0,
      postChangePct: 0,
      tenurePct: 0,
      baselineResidualHoursPerDay: 0,
      postResidualHoursPerDay: 0,
      postResidualHoursPerYear: 0,
      postOutageHoursPerDay: 0,
      deltaPostVsBaselinePct: 0
    }
  };
}

export interface LifeSimExcelMeta {
  baselineName: string;
  changeName: string;
  gridChangeYear: number;
  loadChangeYear: number;
  loadDeltaKw: number;
  mode: string;
}

export function buildLifeSimSpreadsheetXml(
  result: LifeSimResult,
  inputs: SiteInputs,
  meta: LifeSimExcelMeta
): Uint8Array {
  const tenure = inputs.financials.tenure || 10;
  const waccPct = inputs.financials.wacc || 0;
  const taxPct = inputs.financials.taxRate || 0;
  const escPct = inputs.financials.escalation || 0;
  const currency = inputs.financials.currency || 'USD';
  const keep = result.noShock;
  const pathA = result.modeA || emptyPath(tenure);
  const pathB = result.modeB || emptyPath(tenure);
  const hasA = !!result.modeA;
  const hasB = !!result.modeB;
  const last = 2 + tenure;
  const tot = last + 1;
  const wacc = waccPct / 100;
  const tax = taxPct / 100;

  let annuity = 0;
  for (let t = 1; t <= tenure; t++) annuity += 1 / Math.pow(1 + wacc, t);
  const denom = 12 * (1 - tax) * annuity;

  const readMe: (XCell | null)[][] = [
    [T('Life simulation — how the commercial numbers are built')],
    [],
    [S('Sheet'), S('What to open')],
    [S('Assumptions'), S('Project names, change years, WACC, tax, tenure.')],
    [S('Deltas'), S('Δ NPV, Δ CAPEX, Δ OPEX+Fuel, Δ MRR. Click a cell to see =C5-B5 style formulas.')],
    [S('Cashflows'), S('Year-by-year CAPEX, OPEX, fuel. Outflow and delta columns are formulas.')],
    [S('NPV'), S('Each year × 1/(1+WACC)^year. NPV is SUM of present values.')],
    [S('MRR'), S('Breakeven MRR = NPV / (12 × (1 − tax) × annuity factor).')],
    [S('CAPEX_lines'), S('Every CAPEX cheque (year 0, add-on, replacement).')],
    [],
    [S('Keep-this-grid'), S('Same wear engine as Mode A, but grid and load never change. Not the Costs-tab calendar model.')],
    [S('Δ CAPEX'), S('SUM(path CAPEX) − SUM(Keep). Undiscounted. Escalation is already in each year.')],
    [S('Δ NPV'), S('Discounted CAPEX+OPEX+fuel at WACC. Not the same as Δ CAPEX.')],
    [S('Δ OPEX+Fuel'), S('SUM(opex+fuel) − SUM(keep). Undiscounted.')],
    [S('Δ MRR'), S('From NPV, not from subtracting CAPEX.')]
  ];

  const assumptions: (XCell | null)[][] = [
    [T('Assumptions')],
    [H('Field'), H('Value')],
    [S('Baseline project'), S(meta.baselineName)],
    [S('Change project'), S(meta.changeName)],
    [S('Grid change year'), N(meta.gridChangeYear)],
    [S('Load change year'), N(meta.loadChangeYear)],
    [S('Extra load (kW)'), N(meta.loadDeltaKw)],
    [S('UI mode'), S(meta.mode)],
    [S('Currency'), S(currency)],
    [S('Tenure (years)'), N(tenure)],
    [S('WACC %'), N(waccPct)],
    [S('Escalation %'), N(escPct)],
    [S('Tax %'), N(taxPct)],
    [S('WACC (decimal)'), F(`${a1(11, 2)}/100`, wacc)],
    [S('Tax (decimal)'), F(`${a1(13, 2)}/100`, tax)],
    [],
    [S('Keep-this-grid'), S('Same plant as the baseline project. Grid and load never switch.')]
  ];

  const cf: (XCell | null)[][] = [[
    H('Year'),
    H('Keep_CAPEX'), H('Keep_OPEX'), H('Keep_Fuel'), H('Keep_Outflow'),
    H('KeepCfg_CAPEX'), H('KeepCfg_OPEX'), H('KeepCfg_Fuel'), H('KeepCfg_Outflow'),
    H('Upgrade_CAPEX'), H('Upgrade_OPEX'), H('Upgrade_Fuel'), H('Upgrade_Outflow'),
    H('dKeep_CAPEX'), H('dKeep_OPEX_Fuel'), H('dKeep_Outflow'),
    H('dUpg_CAPEX'), H('dUpg_OPEX_Fuel'), H('dUpg_Outflow'),
    H('dUpgMinusKeep_CAPEX'), H('dUpgMinusKeep_OPEX_Fuel'), H('dUpgMinusKeep_Outflow'),
    H('Keep_SysOut'), H('KeepCfg_SysOut'), H('Upgrade_SysOut')
  ]];

  for (let y = 0; y <= tenure; y++) {
    const k = keep.cashFlows[y];
    const pa = pathA.cashFlows[y];
    const pb = pathB.cashFlows[y];
    const r = y + 2;
    cf.push([
      N(y),
      N(k.capex), N(k.opex), N(k.fuel),
      F(`${a1(r, 2)}+${a1(r, 3)}+${a1(r, 4)}`, k.totalOutflow),
      N(hasA ? pa.capex : 0), N(hasA ? pa.opex : 0), N(hasA ? pa.fuel : 0),
      F(`${a1(r, 6)}+${a1(r, 7)}+${a1(r, 8)}`, hasA ? pa.totalOutflow : 0),
      N(hasB ? pb.capex : 0), N(hasB ? pb.opex : 0), N(hasB ? pb.fuel : 0),
      F(`${a1(r, 10)}+${a1(r, 11)}+${a1(r, 12)}`, hasB ? pb.totalOutflow : 0),
      F(`${a1(r, 6)}-${a1(r, 2)}`, (hasA ? pa.capex : 0) - k.capex),
      F(`(${a1(r, 7)}+${a1(r, 8)})-(${a1(r, 3)}+${a1(r, 4)})`, (hasA ? pa.opex + pa.fuel : 0) - (k.opex + k.fuel)),
      F(`${a1(r, 9)}-${a1(r, 5)}`, (hasA ? pa.totalOutflow : 0) - k.totalOutflow),
      F(`${a1(r, 10)}-${a1(r, 2)}`, (hasB ? pb.capex : 0) - k.capex),
      F(`(${a1(r, 11)}+${a1(r, 12)})-(${a1(r, 3)}+${a1(r, 4)})`, (hasB ? pb.opex + pb.fuel : 0) - (k.opex + k.fuel)),
      F(`${a1(r, 13)}-${a1(r, 5)}`, (hasB ? pb.totalOutflow : 0) - k.totalOutflow),
      F(`${a1(r, 10)}-${a1(r, 6)}`, (hasB ? pb.capex : 0) - (hasA ? pa.capex : 0)),
      F(`(${a1(r, 11)}+${a1(r, 12)})-(${a1(r, 7)}+${a1(r, 8)})`, (hasB ? pb.opex + pb.fuel : 0) - (hasA ? pa.opex + pa.fuel : 0)),
      F(`${a1(r, 13)}-${a1(r, 9)}`, (hasB ? pb.totalOutflow : 0) - (hasA ? pa.totalOutflow : 0)),
      N(k.totalSystemOutflow),
      N(hasA ? pa.totalSystemOutflow : 0),
      N(hasB ? pb.totalSystemOutflow : 0)
    ]);
  }

  const sumCol = (col: number, cached: number): XCell =>
    F(`SUM(${a1(2, col)}:${a1(last, col)})`, cached);

  cf.push([
    S('TOTAL (undiscounted)'),
    sumCol(2, keep.totalCapex),
    sumCol(3, keep.cashFlows.reduce((s, c) => s + c.opex, 0)),
    sumCol(4, keep.cashFlows.reduce((s, c) => s + c.fuel, 0)),
    sumCol(5, keep.cashFlows.reduce((s, c) => s + c.totalOutflow, 0)),
    sumCol(6, pathA.totalCapex),
    sumCol(7, pathA.cashFlows.reduce((s, c) => s + c.opex, 0)),
    sumCol(8, pathA.cashFlows.reduce((s, c) => s + c.fuel, 0)),
    sumCol(9, pathA.cashFlows.reduce((s, c) => s + c.totalOutflow, 0)),
    sumCol(10, pathB.totalCapex),
    sumCol(11, pathB.cashFlows.reduce((s, c) => s + c.opex, 0)),
    sumCol(12, pathB.cashFlows.reduce((s, c) => s + c.fuel, 0)),
    sumCol(13, pathB.cashFlows.reduce((s, c) => s + c.totalOutflow, 0)),
    sumCol(14, pathA.totalCapex - keep.totalCapex),
    sumCol(15, pathA.totalOpexFuel - keep.totalOpexFuel),
    sumCol(16, 0),
    sumCol(17, pathB.totalCapex - keep.totalCapex),
    sumCol(18, pathB.totalOpexFuel - keep.totalOpexFuel),
    sumCol(19, 0),
    sumCol(20, pathB.totalCapex - pathA.totalCapex),
    sumCol(21, pathB.totalOpexFuel - pathA.totalOpexFuel),
    sumCol(22, 0),
    sumCol(23, 0),
    sumCol(24, 0),
    sumCol(25, 0)
  ]);

  let npvK = 0;
  let npvA = 0;
  let npvB = 0;
  let npvKs = 0;
  let npvAs = 0;
  let npvBs = 0;
  let npvE = 0;

  const npv: (XCell | null)[][] = [[
    S('Year'),
    S('Keep_Outflow'), S('DF'), S('PV_Keep'),
    S('A_Outflow'), S('PV_A'),
    S('B_Outflow'), S('PV_B'),
    S('dA_PV'), S('dB_PV'), S('dBmA_PV'),
    S('Keep_SysOut'), S('PV_Keep_Sys'),
    S('A_SysOut'), S('PV_A_Sys'),
    S('B_SysOut'), S('PV_B_Sys'),
    S('Energy_kWh'), S('PV_Energy')
  ]];

  for (let y = 0; y <= tenure; y++) {
    const r = y + 2;
    const df = 1 / Math.pow(1 + wacc, y);
    const kOut = keep.cashFlows[y].totalOutflow;
    const aOut = hasA ? pathA.cashFlows[y].totalOutflow : 0;
    const bOut = hasB ? pathB.cashFlows[y].totalOutflow : 0;
    const kSys = keep.cashFlows[y].totalSystemOutflow;
    const aSys = hasA ? pathA.cashFlows[y].totalSystemOutflow : 0;
    const bSys = hasB ? pathB.cashFlows[y].totalSystemOutflow : 0;
    const wear = (hasA ? pathA.wearTable : keep.wearTable).find(w => w.year === y);
    const energy = y === 0 ? 0 : (wear?.dailyLoadEnergy || 0) * 365;
    npvK += kOut * df;
    npvA += aOut * df;
    npvB += bOut * df;
    npvKs += kSys * df;
    npvAs += aSys * df;
    npvBs += bSys * df;
    npvE += energy * df;
    npv.push([
      N(y),
      F(a1(r, 5, 'Cashflows'), kOut),
      F(`1/(1+${a1(14, 2, 'Assumptions')})^${a1(r, 1)}`, df),
      F(`${a1(r, 2)}*${a1(r, 3)}`, kOut * df),
      F(a1(r, 9, 'Cashflows'), aOut),
      F(`${a1(r, 5)}*${a1(r, 3)}`, aOut * df),
      F(a1(r, 13, 'Cashflows'), bOut),
      F(`${a1(r, 7)}*${a1(r, 3)}`, bOut * df),
      F(`${a1(r, 6)}-${a1(r, 4)}`, aOut * df - kOut * df),
      F(`${a1(r, 8)}-${a1(r, 4)}`, bOut * df - kOut * df),
      F(`${a1(r, 8)}-${a1(r, 6)}`, bOut * df - aOut * df),
      F(a1(r, 23, 'Cashflows'), kSys),
      F(`${a1(r, 12)}*${a1(r, 3)}`, kSys * df),
      F(a1(r, 24, 'Cashflows'), aSys),
      F(`${a1(r, 14)}*${a1(r, 3)}`, aSys * df),
      F(a1(r, 25, 'Cashflows'), bSys),
      F(`${a1(r, 16)}*${a1(r, 3)}`, bSys * df),
      N(energy),
      F(`${a1(r, 18)}*${a1(r, 3)}`, energy * df)
    ]);
  }

  npv.push([
    S('NPV / totals'),
    null, null,
    F(`SUM(${a1(2, 4)}:${a1(last, 4)})`, npvK),
    null,
    F(`SUM(${a1(2, 6)}:${a1(last, 6)})`, npvA),
    null,
    F(`SUM(${a1(2, 8)}:${a1(last, 8)})`, npvB),
    F(`${a1(tot, 6)}-${a1(tot, 4)}`, npvA - npvK),
    F(`${a1(tot, 8)}-${a1(tot, 4)}`, npvB - npvK),
    F(`${a1(tot, 8)}-${a1(tot, 6)}`, npvB - npvA),
    null,
    F(`SUM(${a1(2, 13)}:${a1(last, 13)})`, npvKs),
    null,
    F(`SUM(${a1(2, 15)}:${a1(last, 15)})`, npvAs),
    null,
    F(`SUM(${a1(2, 17)}:${a1(last, 17)})`, npvBs),
    null,
    F(`SUM(${a1(2, 19)}:${a1(last, 19)})`, npvE)
  ]);

  const mrr: (XCell | null)[][] = [
    [S('Annuity factor (t = 1 … tenure)')],
    [S('t'), S('DF_t = 1/(1+WACC)^t')]
  ];
  for (let t = 1; t <= tenure; t++) {
    const df = 1 / Math.pow(1 + wacc, t);
    mrr.push([N(t), F(`1/(1+${a1(14, 2, 'Assumptions')})^${a1(t + 2, 1)}`, df)]);
  }
  const afRow = 3 + tenure;
  mrr.push([S('Annuity factor'), F(`SUM(${a1(3, 2)}:${a1(2 + tenure, 2)})`, annuity)]);
  mrr.push([]);
  mrr.push([S('MRR = NPV_operator / (12 × (1 − tax) × annuity)')]);
  mrr.push([S('Path'), S('NPV (from NPV sheet)'), S('Breakeven MRR'), S('Formula')]);
  const keepRow = afRow + 4;
  const aRow = afRow + 5;
  const bRow = afRow + 6;
  mrr.push([
    S('Keep-this-grid'),
    F(a1(tot, 4, 'NPV'), npvK),
    F(`${a1(keepRow, 2)}/(12*(1-${a1(15, 2, 'Assumptions')})*${a1(afRow, 2)})`, denom > 0 ? npvK / denom : 0),
    S('= NPV / (12 × (1-tax) × annuity)')
  ]);
  mrr.push([
    S('Mode A'),
    F(a1(tot, 6, 'NPV'), npvA),
    F(`${a1(aRow, 2)}/(12*(1-${a1(15, 2, 'Assumptions')})*${a1(afRow, 2)})`, denom > 0 ? npvA / denom : 0),
    S('same')
  ]);
  mrr.push([
    S('Mode B'),
    F(a1(tot, 8, 'NPV'), npvB),
    F(`${a1(bRow, 2)}/(12*(1-${a1(15, 2, 'Assumptions')})*${a1(afRow, 2)})`, denom > 0 ? npvB / denom : 0),
    S('same')
  ]);
  mrr.push([
    S('Δ A vs Keep'),
    F(`${a1(aRow, 2)}-${a1(keepRow, 2)}`, npvA - npvK),
    F(`${a1(aRow, 3)}-${a1(keepRow, 3)}`, denom > 0 ? (npvA - npvK) / denom : 0),
    S('Mode A MRR − Keep MRR')
  ]);
  mrr.push([
    S('Δ B vs Keep'),
    F(`${a1(bRow, 2)}-${a1(keepRow, 2)}`, npvB - npvK),
    F(`${a1(bRow, 3)}-${a1(keepRow, 3)}`, denom > 0 ? (npvB - npvK) / denom : 0),
    S('Mode B MRR − Keep MRR')
  ]);
  mrr.push([
    S('Δ B vs A'),
    F(`${a1(bRow, 2)}-${a1(aRow, 2)}`, npvB - npvA),
    F(`${a1(bRow, 3)}-${a1(aRow, 3)}`, denom > 0 ? (npvB - npvA) / denom : 0),
    S('Mode B MRR − Mode A MRR')
  ]);

  const lcoeK = npvE > 0 ? npvKs / npvE : 0;
  const lcoeA = npvE > 0 ? npvAs / npvE : 0;
  const lcoeB = npvE > 0 ? npvBs / npvE : 0;

  const deltas: (XCell | null)[][] = [
    [S('Commercial deltas (formulas)')],
    [S('Keep-this-grid = baseline grid/load for the whole tenure, same wear engine as Mode A. Not the Costs tab.')],
    [],
    [H('Metric'), H('No change'), H('Keep this config'), H('Upgrade'), H('Δ Keep vs no change'), H('Δ Upgrade vs no change'), H('Δ Upgrade vs Keep'), H('How the delta is made')],
    [
      S('Total CAPEX (undiscounted)'),
      F(a1(tot, 2, 'Cashflows'), keep.totalCapex),
      F(a1(tot, 6, 'Cashflows'), pathA.totalCapex),
      F(a1(tot, 10, 'Cashflows'), pathB.totalCapex),
      F(`${a1(5, 3)}-${a1(5, 2)}`, pathA.totalCapex - keep.totalCapex),
      F(`${a1(5, 4)}-${a1(5, 2)}`, pathB.totalCapex - keep.totalCapex),
      F(`${a1(5, 4)}-${a1(5, 3)}`, pathB.totalCapex - pathA.totalCapex),
      S('SUM of yearly CAPEX. Not NPV.')
    ],
    [
      S('OPEX + Fuel (undiscounted)'),
      F(`${a1(tot, 3, 'Cashflows')}+${a1(tot, 4, 'Cashflows')}`, keep.totalOpexFuel),
      F(`${a1(tot, 7, 'Cashflows')}+${a1(tot, 8, 'Cashflows')}`, pathA.totalOpexFuel),
      F(`${a1(tot, 11, 'Cashflows')}+${a1(tot, 12, 'Cashflows')}`, pathB.totalOpexFuel),
      F(`${a1(6, 3)}-${a1(6, 2)}`, pathA.totalOpexFuel - keep.totalOpexFuel),
      F(`${a1(6, 4)}-${a1(6, 2)}`, pathB.totalOpexFuel - keep.totalOpexFuel),
      F(`${a1(6, 4)}-${a1(6, 3)}`, pathB.totalOpexFuel - pathA.totalOpexFuel),
      S('SUM of OPEX and fuel. Not discounted.')
    ],
    [
      S('NPV operator (discounted outflow)'),
      F(a1(tot, 4, 'NPV'), npvK),
      F(a1(tot, 6, 'NPV'), npvA),
      F(a1(tot, 8, 'NPV'), npvB),
      F(`${a1(7, 3)}-${a1(7, 2)}`, npvA - npvK),
      F(`${a1(7, 4)}-${a1(7, 2)}`, npvB - npvK),
      F(`${a1(7, 4)}-${a1(7, 3)}`, npvB - npvA),
      S('SUM of PV(CAPEX+OPEX+fuel). WACC from Assumptions.')
    ],
    [
      S('Breakeven MRR'),
      F(a1(keepRow, 3, 'MRR'), denom > 0 ? npvK / denom : 0),
      F(a1(aRow, 3, 'MRR'), denom > 0 ? npvA / denom : 0),
      F(a1(bRow, 3, 'MRR'), denom > 0 ? npvB / denom : 0),
      F(`${a1(8, 3)}-${a1(8, 2)}`, denom > 0 ? (npvA - npvK) / denom : 0),
      F(`${a1(8, 4)}-${a1(8, 2)}`, denom > 0 ? (npvB - npvK) / denom : 0),
      F(`${a1(8, 4)}-${a1(8, 3)}`, denom > 0 ? (npvB - npvA) / denom : 0),
      S('From NPV via MRR sheet.')
    ],
    [
      S('LCOE'),
      F(`${a1(tot, 13, 'NPV')}/${a1(tot, 19, 'NPV')}`, lcoeK),
      F(`${a1(tot, 15, 'NPV')}/${a1(tot, 19, 'NPV')}`, lcoeA),
      F(`${a1(tot, 17, 'NPV')}/${a1(tot, 19, 'NPV')}`, lcoeB),
      F(`${a1(9, 3)}-${a1(9, 2)}`, lcoeA - lcoeK),
      F(`${a1(9, 4)}-${a1(9, 2)}`, lcoeB - lcoeK),
      F(`${a1(9, 4)}-${a1(9, 3)}`, lcoeB - lcoeA),
      S('NPV of system outflows / NPV of load energy (kWh).')
    ],
    [],
    [S('If Mode A or B was not run, those columns are zero. Use Compare A and B, then download again.')]
  ];

  const lines: (XCell | null)[][] = [
    [S('Path'), S('Year'), S('Kind'), S('Item'), S('Amount'), S('Note')],
    [S('SUMIF Path "Mode A" on Amount should match Deltas Mode A total CAPEX.')]
  ];
  const pushLines = (pathName: string, path: ModePathResult) => {
    path.cashFlows.forEach(cfRow => {
      (cfRow.details.capexItems || []).forEach(item => {
        lines.push([
          S(pathName),
          N(cfRow.year),
          S(cfRow.year === 0 ? 'initial' : 'in-year'),
          S(item.name),
          N(item.cost),
          S('One cheque.')
        ]);
      });
    });
  };
  pushLines('Keep-this-grid', keep);
  if (hasA) pushLines('Mode A', pathA);
  if (hasB) pushLines('Mode B', pathB);

  return buildXlsx([
    { name: 'Read_me', rows: readMe },
    { name: 'Assumptions', rows: assumptions },
    { name: 'Deltas', rows: deltas },
    { name: 'Cashflows', rows: cf },
    { name: 'NPV', rows: npv },
    { name: 'MRR', rows: mrr },
    { name: 'CAPEX_lines', rows: lines }
  ]);
}

export function downloadLifeSimExcel(data: Uint8Array | string, filename: string) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const name = filename.replace(/\.xls$/i, '.xlsx');
  a.download = name.endsWith('.xlsx') ? name : `${name}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
