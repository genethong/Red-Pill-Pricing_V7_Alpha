import { SiteInputs } from '../types';
import { LifeSimResult, ModePathResult } from './lifeSimulation';

function xmlEscape(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cellS(text: string, style = 's'): string {
  return `<Cell ss:StyleID="${style}"><Data ss:Type="String">${xmlEscape(text)}</Data></Cell>`;
}

function cellN(n: number, style = 'n'): string {
  const v = Number.isFinite(n) ? n : 0;
  return `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${v}</Data></Cell>`;
}

function cellF(formula: string, cached = 0, style = 'n'): string {
  const v = Number.isFinite(cached) ? cached : 0;
  return `<Cell ss:StyleID="${style}" ss:Formula="${xmlEscape(formula)}"><Data ss:Type="Number">${v}</Data></Cell>`;
}

function row(cells: string[]): string {
  return `<Row>${cells.join('')}</Row>`;
}

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
): string {
  const tenure = inputs.financials.tenure || 10;
  const waccPct = inputs.financials.wacc || 0;
  const taxPct = inputs.financials.taxRate || 0;
  const escPct = inputs.financials.escalation || 0;
  const currency = inputs.financials.currency || 'USD';
  const keep = result.noShock;
  const a = result.modeA || emptyPath(tenure);
  const b = result.modeB || emptyPath(tenure);
  const hasA = !!result.modeA;
  const hasB = !!result.modeB;
  const last = 2 + tenure;
  const tot = last + 1;
  const wacc = waccPct / 100;
  const tax = taxPct / 100;

  let annuity = 0;
  for (let t = 1; t <= tenure; t++) annuity += 1 / Math.pow(1 + wacc, t);

  const styles = `
  <Styles>
    <Style ss:ID="Default"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>
    <Style ss:ID="s"><Font ss:FontName="Calibri" ss:Size="11"/></Style>
    <Style ss:ID="h"><Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1"/></Style>
    <Style ss:ID="th"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0A6B0C" ss:Pattern="Solid"/></Style>
    <Style ss:ID="n"><NumberFormat ss:Format="#,##0.00"/></Style>
    <Style ss:ID="nb"><Font ss:Bold="1"/><NumberFormat ss:Format="#,##0.00"/></Style>
    <Style ss:ID="note"><Font ss:FontName="Calibri" ss:Size="10" ss:Color="#53565A"/></Style>
  </Styles>`;

  const readMe = `
  <Worksheet ss:Name="Read_me">
    <Table ss:DefaultColumnWidth="110">
      <Column ss:Width="280"/>
      <Column ss:Width="420"/>
      ${row([cellS('Life simulation — how the commercial numbers are built', 'h')])}
      ${row([cellS('')])}
      ${row([cellS('Sheet'), cellS('What to open')])}
      ${row([cellS('Assumptions'), cellS('Project names, change years, WACC, tax, tenure. Other sheets point here.')])}
      ${row([cellS('Cashflows'), cellS('Year-by-year CAPEX, OPEX, fuel. Outflow and delta columns are Excel formulas.')])}
      ${row([cellS('Deltas'), cellS('Δ NPV, Δ CAPEX, Δ OPEX+Fuel, Δ MRR. Totals are formulas on Cashflows / NPV / MRR.')])}
      ${row([cellS('NPV'), cellS('Each year discounted at WACC. NPV is SUM of present values.')])}
      ${row([cellS('MRR'), cellS('Breakeven MRR = NPV ÷ (12 × (1 − tax) × annuity factor).')])}
      ${row([cellS('CAPEX_lines'), cellS('Every CAPEX cheque (year 0, add-on, replacement) so you can see which lot created the spend.')])}
      ${row([cellS('')])}
      ${row([cellS('What “Keep-this-grid” means'), cellS('Same Life Sim wear engine as Mode A, but the baseline grid and load never change. It is NOT the Costs-tab calendar model.')])}
      ${row([cellS('Mode A'), cellS('Year-0 plant stays. Grid/load follow the change years. Extra CAPEX is only earlier/later replacements, not a new design.')])}
      ${row([cellS('Mode B'), cellS('May add kit at each change year. Those add-ons are extra CAPEX on top of year 0.')])}
      ${row([cellS('Δ CAPEX'), cellS('SUM(path CAPEX) − SUM(Keep-this-grid CAPEX). Undiscounted. Escalation is already in each year amount. WACC is not applied.')])}
      ${row([cellS('Δ NPV'), cellS('NPV(path outflows) − NPV(Keep-this-grid). Discounted at WACC. Includes CAPEX + OPEX + fuel.')])}
      ${row([cellS('Δ OPEX+Fuel'), cellS('SUM(opex+fuel) − SUM(keep). Undiscounted.')])}
      ${row([cellS('Δ MRR'), cellS('Breakeven monthly rent on the path minus keep-this-grid. Built from NPV, not from Δ CAPEX alone.')])}
      ${row([cellS('')])}
      ${row([cellS('Yellow cells'), cellS('Typed inputs / engine outputs. Green-header columns with formulas you can click in Excel.')])}
    </Table>
  </Worksheet>`;

  const assumptions = `
  <Worksheet ss:Name="Assumptions">
    <Table ss:DefaultColumnWidth="160">
      <Column ss:Width="200"/>
      <Column ss:Width="280"/>
      ${row([cellS('Assumptions', 'h')])}
      ${row([cellS('Field'), cellS('Value', 'th')])}
      ${row([cellS('Baseline project'), cellS(meta.baselineName)])}
      ${row([cellS('Change project'), cellS(meta.changeName)])}
      ${row([cellS('Grid change year'), cellN(meta.gridChangeYear)])}
      ${row([cellS('Load change year'), cellN(meta.loadChangeYear)])}
      ${row([cellS('Extra load (kW)'), cellN(meta.loadDeltaKw)])}
      ${row([cellS('UI mode'), cellS(meta.mode)])}
      ${row([cellS('Currency'), cellS(currency)])}
      ${row([cellS('Tenure (years)'), cellN(tenure)])}
      ${row([cellS('WACC %'), cellN(waccPct)])}
      ${row([cellS('Escalation %'), cellN(escPct)])}
      ${row([cellS('Tax %'), cellN(taxPct)])}
      ${row([cellS('WACC (decimal)'), cellF('=B11/100', wacc)])}
      ${row([cellS('Tax (decimal)'), cellF('=B13/100', tax)])}
      ${row([cellS('')])}
      ${row([cellS('Keep-this-grid'), cellS('Same plant as baseline project. Grid and load never switch to the change project.')])}
    </Table>
  </Worksheet>`;

  const cfRows: string[] = [];
  cfRows.push(row([
    cellS('Year', 'th'),
    cellS('Keep_CAPEX', 'th'), cellS('Keep_OPEX', 'th'), cellS('Keep_Fuel', 'th'), cellS('Keep_Outflow', 'th'),
    cellS('A_CAPEX', 'th'), cellS('A_OPEX', 'th'), cellS('A_Fuel', 'th'), cellS('A_Outflow', 'th'),
    cellS('B_CAPEX', 'th'), cellS('B_OPEX', 'th'), cellS('B_Fuel', 'th'), cellS('B_Outflow', 'th'),
    cellS('dA_CAPEX', 'th'), cellS('dA_OPEX_Fuel', 'th'), cellS('dA_Outflow', 'th'),
    cellS('dB_CAPEX', 'th'), cellS('dB_OPEX_Fuel', 'th'), cellS('dB_Outflow', 'th'),
    cellS('dBmA_CAPEX', 'th'), cellS('dBmA_OPEX_Fuel', 'th'), cellS('dBmA_Outflow', 'th'),
    cellS('Keep_SysOut', 'th'), cellS('A_SysOut', 'th'), cellS('B_SysOut', 'th')
  ]));

  for (let y = 0; y <= tenure; y++) {
    const k = keep.cashFlows[y];
    const pa = a.cashFlows[y];
    const pb = b.cashFlows[y];
    const r = y + 2;
    cfRows.push(row([
      cellN(y),
      cellN(k.capex), cellN(k.opex), cellN(k.fuel),
      cellF(`=B${r}+C${r}+D${r}`, k.totalOutflow),
      cellN(hasA ? pa.capex : 0), cellN(hasA ? pa.opex : 0), cellN(hasA ? pa.fuel : 0),
      cellF(`=F${r}+G${r}+H${r}`, hasA ? pa.totalOutflow : 0),
      cellN(hasB ? pb.capex : 0), cellN(hasB ? pb.opex : 0), cellN(hasB ? pb.fuel : 0),
      cellF(`=J${r}+K${r}+L${r}`, hasB ? pb.totalOutflow : 0),
      cellF(`=F${r}-B${r}`, (hasA ? pa.capex : 0) - k.capex),
      cellF(`=(G${r}+H${r})-(C${r}+D${r})`, (hasA ? pa.opex + pa.fuel : 0) - (k.opex + k.fuel)),
      cellF(`=I${r}-E${r}`, (hasA ? pa.totalOutflow : 0) - k.totalOutflow),
      cellF(`=J${r}-B${r}`, (hasB ? pb.capex : 0) - k.capex),
      cellF(`=(K${r}+L${r})-(C${r}+D${r})`, (hasB ? pb.opex + pb.fuel : 0) - (k.opex + k.fuel)),
      cellF(`=M${r}-E${r}`, (hasB ? pb.totalOutflow : 0) - k.totalOutflow),
      cellF(`=J${r}-F${r}`, (hasB ? pb.capex : 0) - (hasA ? pa.capex : 0)),
      cellF(`=(K${r}+L${r})-(G${r}+H${r})`, (hasB ? pb.opex + pb.fuel : 0) - (hasA ? pa.opex + pa.fuel : 0)),
      cellF(`=M${r}-I${r}`, (hasB ? pb.totalOutflow : 0) - (hasA ? pa.totalOutflow : 0)),
      cellN(k.totalSystemOutflow),
      cellN(hasA ? pa.totalSystemOutflow : 0),
      cellN(hasB ? pb.totalSystemOutflow : 0)
    ]));
  }

  cfRows.push(row([
    cellS('TOTAL (undiscounted)', 'nb'),
    cellF(`=SUM(B2:B${last})`, keep.totalCapex, 'nb'),
    cellF(`=SUM(C2:C${last})`, keep.cashFlows.reduce((s, c) => s + c.opex, 0), 'nb'),
    cellF(`=SUM(D2:D${last})`, keep.cashFlows.reduce((s, c) => s + c.fuel, 0), 'nb'),
    cellF(`=SUM(E2:E${last})`, keep.cashFlows.reduce((s, c) => s + c.totalOutflow, 0), 'nb'),
    cellF(`=SUM(F2:F${last})`, a.totalCapex, 'nb'),
    cellF(`=SUM(G2:G${last})`, a.cashFlows.reduce((s, c) => s + c.opex, 0), 'nb'),
    cellF(`=SUM(H2:H${last})`, a.cashFlows.reduce((s, c) => s + c.fuel, 0), 'nb'),
    cellF(`=SUM(I2:I${last})`, a.cashFlows.reduce((s, c) => s + c.totalOutflow, 0), 'nb'),
    cellF(`=SUM(J2:J${last})`, b.totalCapex, 'nb'),
    cellF(`=SUM(K2:K${last})`, b.cashFlows.reduce((s, c) => s + c.opex, 0), 'nb'),
    cellF(`=SUM(L2:L${last})`, b.cashFlows.reduce((s, c) => s + c.fuel, 0), 'nb'),
    cellF(`=SUM(M2:M${last})`, b.cashFlows.reduce((s, c) => s + c.totalOutflow, 0), 'nb'),
    cellF(`=SUM(N2:N${last})`, a.totalCapex - keep.totalCapex, 'nb'),
    cellF(`=SUM(O2:O${last})`, a.totalOpexFuel - keep.totalOpexFuel, 'nb'),
    cellF(`=SUM(P2:P${last})`, 0, 'nb'),
    cellF(`=SUM(Q2:Q${last})`, b.totalCapex - keep.totalCapex, 'nb'),
    cellF(`=SUM(R2:R${last})`, b.totalOpexFuel - keep.totalOpexFuel, 'nb'),
    cellF(`=SUM(S2:S${last})`, 0, 'nb'),
    cellF(`=SUM(T2:T${last})`, b.totalCapex - a.totalCapex, 'nb'),
    cellF(`=SUM(U2:U${last})`, b.totalOpexFuel - a.totalOpexFuel, 'nb'),
    cellF(`=SUM(V2:V${last})`, 0, 'nb'),
    cellF(`=SUM(W2:W${last})`, 0, 'nb'),
    cellF(`=SUM(X2:X${last})`, 0, 'nb'),
    cellF(`=SUM(Y2:Y${last})`, 0, 'nb')
  ]));

  const cashflows = `
  <Worksheet ss:Name="Cashflows">
    <Table ss:DefaultColumnWidth="88">
      ${cfRows.join('\n')}
    </Table>
  </Worksheet>`;

  const npvRows: string[] = [];
  npvRows.push(row([
    cellS('Year', 'th'),
    cellS('Keep_Outflow', 'th'), cellS('DF', 'th'), cellS('PV_Keep', 'th'),
    cellS('A_Outflow', 'th'), cellS('PV_A', 'th'),
    cellS('B_Outflow', 'th'), cellS('PV_B', 'th'),
    cellS('dA_PV', 'th'), cellS('dB_PV', 'th'), cellS('dBmA_PV', 'th'),
    cellS('Keep_SysOut', 'th'), cellS('PV_Keep_Sys', 'th'),
    cellS('A_SysOut', 'th'), cellS('PV_A_Sys', 'th'),
    cellS('B_SysOut', 'th'), cellS('PV_B_Sys', 'th'),
    cellS('Energy_kWh', 'th'), cellS('PV_Energy', 'th')
  ]));

  let npvK = 0;
  let npvA = 0;
  let npvB = 0;
  let npvKs = 0;
  let npvAs = 0;
  let npvBs = 0;
  let npvE = 0;
  for (let y = 0; y <= tenure; y++) {
    const r = y + 2;
    const df = 1 / Math.pow(1 + wacc, y);
    const kOut = keep.cashFlows[y].totalOutflow;
    const aOut = hasA ? a.cashFlows[y].totalOutflow : 0;
    const bOut = hasB ? b.cashFlows[y].totalOutflow : 0;
    const kSys = keep.cashFlows[y].totalSystemOutflow;
    const aSys = hasA ? a.cashFlows[y].totalSystemOutflow : 0;
    const bSys = hasB ? b.cashFlows[y].totalSystemOutflow : 0;
    const wear = (hasA ? a.wearTable : keep.wearTable).find(w => w.year === y);
    const energy = y === 0 ? 0 : (wear?.dailyLoadEnergy || 0) * 365;
    npvK += kOut * df;
    npvA += aOut * df;
    npvB += bOut * df;
    npvKs += kSys * df;
    npvAs += aSys * df;
    npvBs += bSys * df;
    npvE += energy * df;
    npvRows.push(row([
      cellN(y),
      cellF(`=Cashflows!E${r}`, kOut),
      cellF(`=1/(1+Assumptions!B14)^A${r}`, df),
      cellF(`=B${r}*C${r}`, kOut * df),
      cellF(`=Cashflows!I${r}`, aOut),
      cellF(`=E${r}*C${r}`, aOut * df),
      cellF(`=Cashflows!M${r}`, bOut),
      cellF(`=G${r}*C${r}`, bOut * df),
      cellF(`=F${r}-D${r}`, aOut * df - kOut * df),
      cellF(`=H${r}-D${r}`, bOut * df - kOut * df),
      cellF(`=H${r}-F${r}`, bOut * df - aOut * df),
      cellF(`=Cashflows!W${r}`, kSys),
      cellF(`=L${r}*C${r}`, kSys * df),
      cellF(`=Cashflows!X${r}`, aSys),
      cellF(`=N${r}*C${r}`, aSys * df),
      cellF(`=Cashflows!Y${r}`, bSys),
      cellF(`=P${r}*C${r}`, bSys * df),
      cellN(energy),
      cellF(`=R${r}*C${r}`, energy * df)
    ]));
  }
  npvRows.push(row([
    cellS('NPV / totals', 'nb'),
    cellS(''), cellS(''),
    cellF(`=SUM(D2:D${last})`, npvK, 'nb'),
    cellS(''),
    cellF(`=SUM(F2:F${last})`, npvA, 'nb'),
    cellS(''),
    cellF(`=SUM(H2:H${last})`, npvB, 'nb'),
    cellF(`=F${tot}-D${tot}`, npvA - npvK, 'nb'),
    cellF(`=H${tot}-D${tot}`, npvB - npvK, 'nb'),
    cellF(`=H${tot}-F${tot}`, npvB - npvA, 'nb'),
    cellS(''),
    cellF(`=SUM(M2:M${last})`, npvKs, 'nb'),
    cellS(''),
    cellF(`=SUM(O2:O${last})`, npvAs, 'nb'),
    cellS(''),
    cellF(`=SUM(Q2:Q${last})`, npvBs, 'nb'),
    cellS(''),
    cellF(`=SUM(S2:S${last})`, npvE, 'nb')
  ]));

  const npvSheet = `
  <Worksheet ss:Name="NPV">
    <Table ss:DefaultColumnWidth="90">
      ${npvRows.join('\n')}
    </Table>
  </Worksheet>`;

  const mrrRows: string[] = [];
  mrrRows.push(row([cellS('Annuity factor (t = 1 … tenure)', 'h')]));
  mrrRows.push(row([cellS('t', 'th'), cellS('DF_t = 1/(1+WACC)^t', 'th')]));
  for (let t = 1; t <= tenure; t++) {
    const df = 1 / Math.pow(1 + wacc, t);
    mrrRows.push(row([cellN(t), cellF(`=1/(1+Assumptions!B14)^A${t + 2}`, df)]));
  }
  const afRow = 3 + tenure;
  mrrRows.push(row([cellS('Annuity factor'), cellF(`=SUM(B3:B${2 + tenure})`, annuity, 'nb')]));
  mrrRows.push(row([cellS('')]));
  mrrRows.push(row([cellS('MRR = NPV_operator ÷ (12 × (1 − tax) × annuity)', 'h')]));
  mrrRows.push(row([cellS('Path', 'th'), cellS('NPV (from NPV sheet)', 'th'), cellS('Breakeven MRR', 'th'), cellS('Formula', 'th')]));
  const denom = 12 * (1 - tax) * annuity;
  mrrRows.push(row([
    cellS('Keep-this-grid'),
    cellF(`=NPV!D${tot}`, npvK),
    cellF(`=B${afRow + 4}/(12*(1-Assumptions!B15)*$B$${afRow})`, denom > 0 ? npvK / denom : 0, 'nb'),
    cellS('= NPV / (12 × (1-tax) × annuity)')
  ]));
  mrrRows.push(row([
    cellS('Mode A'),
    cellF(`=NPV!F${tot}`, npvA),
    cellF(`=B${afRow + 5}/(12*(1-Assumptions!B15)*$B$${afRow})`, denom > 0 ? npvA / denom : 0, 'nb'),
    cellS('same')
  ]));
  mrrRows.push(row([
    cellS('Mode B'),
    cellF(`=NPV!H${tot}`, npvB),
    cellF(`=B${afRow + 6}/(12*(1-Assumptions!B15)*$B$${afRow})`, denom > 0 ? npvB / denom : 0, 'nb'),
    cellS('same')
  ]));
  mrrRows.push(row([
    cellS('Δ A vs Keep'),
    cellF(`=B${afRow + 5}-B${afRow + 4}`, npvA - npvK),
    cellF(`=C${afRow + 5}-C${afRow + 4}`, denom > 0 ? (npvA - npvK) / denom : 0, 'nb'),
    cellS('Mode A MRR − Keep MRR')
  ]));
  mrrRows.push(row([
    cellS('Δ B vs Keep'),
    cellF(`=B${afRow + 6}-B${afRow + 4}`, npvB - npvK),
    cellF(`=C${afRow + 6}-C${afRow + 4}`, denom > 0 ? (npvB - npvK) / denom : 0, 'nb'),
    cellS('Mode B MRR − Keep MRR')
  ]));
  mrrRows.push(row([
    cellS('Δ B vs A'),
    cellF(`=B${afRow + 6}-B${afRow + 5}`, npvB - npvA),
    cellF(`=C${afRow + 6}-C${afRow + 5}`, denom > 0 ? (npvB - npvA) / denom : 0, 'nb'),
    cellS('Mode B MRR − Mode A MRR')
  ]));

  const mrrSheet = `
  <Worksheet ss:Name="MRR">
    <Table ss:DefaultColumnWidth="140">
      ${mrrRows.join('\n')}
    </Table>
  </Worksheet>`;

  const lcoeK = npvE > 0 ? npvKs / npvE : 0;
  const lcoeA = npvE > 0 ? npvAs / npvE : 0;
  const lcoeB = npvE > 0 ? npvBs / npvE : 0;

  const deltas = `
  <Worksheet ss:Name="Deltas">
    <Table ss:DefaultColumnWidth="130">
      <Column ss:Width="180"/>
      <Column ss:Width="120"/>
      <Column ss:Width="120"/>
      <Column ss:Width="120"/>
      <Column ss:Width="130"/>
      <Column ss:Width="130"/>
      <Column ss:Width="130"/>
      <Column ss:Width="280"/>
      ${row([cellS('Commercial deltas (formulas)', 'h')])}
      ${row([cellS('Keep-this-grid = baseline grid/load for the whole tenure, same wear engine as Mode A. Not the Costs tab.')])}
      ${row([cellS('')])}
      ${row([
        cellS('Metric', 'th'),
        cellS('Keep-this-grid', 'th'),
        cellS('Mode A', 'th'),
        cellS('Mode B', 'th'),
        cellS('Δ A vs Keep', 'th'),
        cellS('Δ B vs Keep', 'th'),
        cellS('Δ B vs A', 'th'),
        cellS('How the delta is made', 'th')
      ])}
      ${row([
        cellS('Total CAPEX (undiscounted)'),
        cellF(`=Cashflows!B${tot}`, keep.totalCapex, 'nb'),
        cellF(`=Cashflows!F${tot}`, a.totalCapex, 'nb'),
        cellF(`=Cashflows!J${tot}`, b.totalCapex, 'nb'),
        cellF(`=C5-B5`, a.totalCapex - keep.totalCapex, 'nb'),
        cellF(`=D5-B5`, b.totalCapex - keep.totalCapex, 'nb'),
        cellF(`=D5-C5`, b.totalCapex - a.totalCapex, 'nb'),
        cellS('SUM of yearly CAPEX. Not NPV. Click Cashflows column B/F/J.')
      ])}
      ${row([
        cellS('OPEX + Fuel (undiscounted)'),
        cellF(`=Cashflows!C${tot}+Cashflows!D${tot}`, keep.totalOpexFuel, 'nb'),
        cellF(`=Cashflows!G${tot}+Cashflows!H${tot}`, a.totalOpexFuel, 'nb'),
        cellF(`=Cashflows!K${tot}+Cashflows!L${tot}`, b.totalOpexFuel, 'nb'),
        cellF(`=C6-B6`, a.totalOpexFuel - keep.totalOpexFuel, 'nb'),
        cellF(`=D6-B6`, b.totalOpexFuel - keep.totalOpexFuel, 'nb'),
        cellF(`=D6-C6`, b.totalOpexFuel - a.totalOpexFuel, 'nb'),
        cellS('SUM of OPEX and fuel. Not discounted.')
      ])}
      ${row([
        cellS('NPV operator (discounted outflow)'),
        cellF(`=NPV!D${tot}`, npvK, 'nb'),
        cellF(`=NPV!F${tot}`, npvA, 'nb'),
        cellF(`=NPV!H${tot}`, npvB, 'nb'),
        cellF(`=C7-B7`, npvA - npvK, 'nb'),
        cellF(`=D7-B7`, npvB - npvK, 'nb'),
        cellF(`=D7-C7`, npvB - npvA, 'nb'),
        cellS('SUM of PV(CAPEX+OPEX+fuel). WACC from Assumptions.')
      ])}
      ${row([
        cellS('Breakeven MRR'),
        cellF(`=MRR!C${afRow + 4}`, denom > 0 ? npvK / denom : 0, 'nb'),
        cellF(`=MRR!C${afRow + 5}`, denom > 0 ? npvA / denom : 0, 'nb'),
        cellF(`=MRR!C${afRow + 6}`, denom > 0 ? npvB / denom : 0, 'nb'),
        cellF(`=C8-B8`, denom > 0 ? (npvA - npvK) / denom : 0, 'nb'),
        cellF(`=D8-B8`, denom > 0 ? (npvB - npvK) / denom : 0, 'nb'),
        cellF(`=D8-C8`, denom > 0 ? (npvB - npvA) / denom : 0, 'nb'),
        cellS('From NPV via MRR sheet. Not a CAPEX minus.')
      ])}
      ${row([
        cellS('LCOE'),
        cellF(`=NPV!M${tot}/NPV!S${tot}`, lcoeK, 'nb'),
        cellF(`=NPV!O${tot}/NPV!S${tot}`, lcoeA, 'nb'),
        cellF(`=NPV!Q${tot}/NPV!S${tot}`, lcoeB, 'nb'),
        cellF(`=C9-B9`, lcoeA - lcoeK, 'nb'),
        cellF(`=D9-B9`, lcoeB - lcoeK, 'nb'),
        cellF(`=D9-C9`, lcoeB - lcoeA, 'nb'),
        cellS('NPV of system outflows ÷ NPV of load energy (kWh).')
      ])}
      ${row([cellS('')])}
      ${row([cellS('If Mode A or B was not run in the UI, those columns are zero. Switch to Compare A and B and download again for a full set.')])}
    </Table>
  </Worksheet>`;

  const lineRows: string[] = [
    row([
      cellS('Path', 'th'),
      cellS('Year', 'th'),
      cellS('Kind', 'th'),
      cellS('Item', 'th'),
      cellS('Amount', 'th'),
      cellS('Note', 'th')
    ])
  ];
  const pushLines = (pathName: string, path: ModePathResult) => {
    path.cashFlows.forEach(cf => {
      (cf.details.capexItems || []).forEach(item => {
        lineRows.push(row([
          cellS(pathName),
          cellN(cf.year),
          cellS(cf.year === 0 ? 'initial' : 'in-year'),
          cellS(item.name),
          cellN(item.cost),
          cellS('One cheque. SUMIF this column by Path to rebuild total CAPEX.')
        ]));
      });
    });
  };
  pushLines('Keep-this-grid', keep);
  if (hasA) pushLines('Mode A', a);
  if (hasB) pushLines('Mode B', b);

  const capexLines = `
  <Worksheet ss:Name="CAPEX_lines">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="120"/>
      <Column ss:Width="50"/>
      <Column ss:Width="80"/>
      <Column ss:Width="320"/>
      <Column ss:Width="100"/>
      <Column ss:Width="280"/>
      ${row([cellS('Every CAPEX cheque. Amounts are engine outputs. Add them with SUMIF to rebuild a year or a path.')])}
      ${row([cellS('Example'), cellS('=SUMIF(A:A,"Mode A",E:E)  should match Deltas Mode A total CAPEX (if you exclude the duplicate event-log rows).')])}
      ${lineRows.join('\n')}
    </Table>
  </Worksheet>`;

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  ${styles}
  ${readMe}
  ${assumptions}
  ${deltas}
  ${cashflows}
  ${npvSheet}
  ${mrrSheet}
  ${capexLines}
</Workbook>`;
}

export function downloadLifeSimExcel(xml: string, filename: string) {
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
