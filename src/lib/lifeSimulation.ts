import { SiteInputs, GridCondition, TenantLoad } from '../types';
import {
  calculateAllStats,
  CashFlowYear,
  DesignLock,
  EngineResult,
  getCyclesForDoD
} from './dcEngine';

export type LifeSimMode = 'A' | 'B' | 'compare';

export interface EnvironmentChange {
  /** Operating year when new regime starts (1..tenure). */
  changeYear: number;
  /**
   * Full post-change site config (from a saved My Project).
   * After changeYear, grid / system / load come from this project.
   * Financials & costs stay from baseline for consistent commercial compare.
   */
  changeProject?: SiteInputs | null;
  gridCondition?: GridCondition;
  dailyOutages?: number | null;
  outageDuration?: number | null;
  /** Absolute tenant loads after change (if set, replaces all tenants). */
  tenantLoads?: TenantLoad[];
  /** Scale load on the active (post-change) regime. e.g. 1.3 = +30%. */
  loadScale?: number | null;
}

export interface LifeSimConfig {
  mode: LifeSimMode;
  change: EnvironmentChange;
}

export interface WearYearRow {
  year: number;
  regime: 'baseline' | 'changed';
  batteryCyclesAdded: number;
  batteryCyclesCumulative: number;
  batteryAvailableCycles: number;
  batteryYearsSinceInstall: number;
  batteryReplaced: boolean;
  dgHoursAdded: number;
  dgHoursCumulative: number;
  dgMaxHours: number;
  dgYearsSinceInstall: number;
  dgReplaced: boolean;
  actualDoD: number;
  batteryCyclesPerDay: number;
  dgRunningHoursPerDay: number;
  dailyEnergyAC: number;
  dgDailyFuel: number;
  dailyLoadEnergy: number;
  autonomyAtDoD: number;
  outageDuration: number;
  riskFlags: string[];
}

export interface CapexEvent {
  year: number;
  name: string;
  cost: number;
  kind: 'initial' | 'replacement' | 'upgrade';
}

export interface ModePathResult {
  mode: 'A' | 'B';
  cashFlows: CashFlowYear[];
  wearTable: WearYearRow[];
  capexEvents: CapexEvent[];
  upgradeBoq: { item: string; quantity: number; unitCost: number; total: number }[];
  riskFlags: string[];
  npvOperator: number;
  npvSystem: number;
  breakevenMRR: number;
  lcoe: number;
  initialCapex: number;
  totalCapex: number;
  totalOpexFuel: number;
}

export interface LifeSimResult {
  baseline: EngineResult;
  modeA?: ModePathResult;
  modeB?: ModePathResult;
  deltaA?: DeltaSummary;
  deltaB?: DeltaSummary;
  deltaBminusA?: DeltaSummary;
}

export interface DeltaSummary {
  npvOperator: number;
  npvSystem: number;
  breakevenMRR: number;
  lcoe: number;
  totalCapex: number;
  totalOpexFuel: number;
  yearly: {
    year: number;
    capex: number;
    opex: number;
    fuel: number;
    totalOutflow: number;
  }[];
}

function cloneInputs(inputs: SiteInputs): SiteInputs {
  return JSON.parse(JSON.stringify(inputs));
}

function scaleLoads(inputs: SiteInputs, loadScale: number | null | undefined): SiteInputs {
  if (loadScale == null || loadScale <= 0 || loadScale === 1) return inputs;
  const next = cloneInputs(inputs);
  next.tenantLoads = next.tenantLoads.map(t => ({
    peakLoad: (t.peakLoad || 0) * loadScale,
    averageLoad: (t.averageLoad || 0) * loadScale,
    runningLoad: (t.runningLoad || 0) * loadScale
  }));
  return next;
}

/**
 * Pre-change years: baseline project as-is.
 * Post-change years: use saved change project (config + grid + loads), keep baseline financials/costs/tenure.
 * Optional loadScale applies only after change.
 */
function applyEnvironment(base: SiteInputs, change: EnvironmentChange, active: boolean): SiteInputs {
  if (!active) return cloneInputs(base);

  let next: SiteInputs;

  if (change.changeProject) {
    next = cloneInputs(change.changeProject);
    // Commercial model anchored to baseline project
    next.financials = cloneInputs(base.financials);
    next.costs = cloneInputs(base.costs);
  } else {
    next = cloneInputs(base);
    if (change.gridCondition != null) next.gridCondition = change.gridCondition;
    if (change.dailyOutages != null) next.dailyOutages = change.dailyOutages;
    if (change.outageDuration != null) next.outageDuration = change.outageDuration;
    if (change.tenantLoads && change.tenantLoads.length > 0) {
      next.tenantLoads = change.tenantLoads.map(t => ({ ...t }));
      next.numTenants = change.tenantLoads.length;
    }
  }

  next = scaleLoads(next, change.loadScale);

  if (next.gridCondition === 'Off-grid') {
    next.dailyOutages = 1;
    next.outageDuration = 24;
  }

  return next;
}

function emptyCashFlows(tenure: number): CashFlowYear[] {
  return Array.from({ length: tenure + 1 }, (_, i) => ({
    year: i,
    capex: 0,
    opex: 0,
    fuel: 0,
    totalOutflow: 0,
    totalSystemOutflow: 0,
    details: { capexItems: [], opexItems: [] }
  }));
}

function getUnitCost(simInputs: SiteInputs, itemName: string): number {
  if (simInputs.costs.materials[itemName] !== undefined) {
    return simInputs.costs.materials[itemName] ?? 0;
  }
  const installCosts = simInputs.costs.installation;
  switch (itemName) {
    case 'DC Installation Service': return installCosts.dcBaseService ?? 0;
    case 'Solar Panel Structures + Footing': return installCosts.solarStructureSupply ?? 0;
    case 'Installation of Solar Panels': return installCosts.solarPanelInstall ?? 0;
    case 'Installation of Panel Structures': return installCosts.solarStructureInstall ?? 0;
    case 'Transport & Mobilisation (Solar)': return installCosts.transportSolar ?? 0;
    case 'Transport & Mobilisation (DC)': return installCosts.transportDC ?? 0;
    case 'Site Survey & Mobilisation': return installCosts.siteSurvey ?? 0;
    default: return 0;
  }
}

function buildRiskFlags(stats: EngineResult['rectifierStats'], inputs: SiteInputs, design: DesignLock): string[] {
  const flags: string[] = [];
  const outage = inputs.gridCondition === 'Off-grid' ? 24 : (inputs.outageDuration || 0);
  if (stats.autonomyAtDoD > 0 && outage > stats.autonomyAtDoD + 0.05) {
    flags.push(`Battery autonomy (${stats.autonomyAtDoD.toFixed(2)} h) < outage duration (${outage} h)`);
  }
  if (stats.actualDoD >= (inputs.battery.dod || 80)) {
    flags.push(`Actual DoD reaches design limit (${stats.actualDoD}%)`);
  }
  if (inputs.dg.enabled && design.selectedDGKva > 0 && stats.dgLoadRate > (inputs.dg.maxLoadRateOngrid || 80) + 1) {
    flags.push(`DG load rate ${stats.dgLoadRate.toFixed(1)}% exceeds design max ${inputs.dg.maxLoadRateOngrid}%`);
  }
  if (stats.totalRectifierLoadKW > stats.totalRectifierCapacityKW + 0.01) {
    flags.push(`Rectifier load ${stats.totalRectifierLoadKW.toFixed(2)} kW > installed ${stats.totalRectifierCapacityKW.toFixed(2)} kW`);
  }
  return flags;
}

/** Delta BoQ: positive quantity increases only; DG step-up replaces with larger unit. */
export function computeDeltaBoq(
  installed: DesignLock,
  required: DesignLock,
  inputs: SiteInputs
): { item: string; quantity: number; unitCost: number; total: number }[] {
  const deltas: { item: string; quantity: number; unitCost: number; total: number }[] = [];

  const batDelta = Math.max(0, required.batteryModules - installed.batteryModules);
  if (batDelta > 0) {
    const unit = getUnitCost(inputs, 'Battery Modules');
    deltas.push({ item: 'Battery Modules', quantity: batDelta, unitCost: unit, total: batDelta * unit });
  }

  const rectDelta = Math.max(0, required.rectifierModules - installed.rectifierModules);
  if (rectDelta > 0) {
    const unit = getUnitCost(inputs, 'Rectifier Modules');
    deltas.push({ item: 'Rectifier Modules', quantity: rectDelta, unitCost: unit, total: rectDelta * unit });
  }

  if (required.coreCapacity > installed.coreCapacity) {
    const item = `Rectifier Core ${required.coreCapacity}kW`;
    const unit = getUnitCost(inputs, item);
    deltas.push({ item: `${item} (upgrade)`, quantity: 1, unitCost: unit, total: unit });
  }

  const cabDelta = Math.max(0, required.batteryCabinetQty - installed.batteryCabinetQty);
  if (cabDelta > 0) {
    const unit = getUnitCost(inputs, 'Battery Cabinet');
    deltas.push({ item: 'Battery Cabinet', quantity: cabDelta, unitCost: unit, total: cabDelta * unit });
  }

  if (inputs.dg.enabled && required.selectedDGKva > installed.selectedDGKva) {
    const item = `Diesel Generator ${required.selectedDGKva}kVA`;
    const unit = getUnitCost(inputs, item);
    deltas.push({ item: `${item} (upgrade)`, quantity: 1, unitCost: unit, total: unit });
  }

  const solarModDelta = Math.max(0, (required.solarChargerModuleQuantity || 0) - (installed.solarChargerModuleQuantity || 0));
  if (solarModDelta > 0) {
    const unit = getUnitCost(inputs, 'Solar Charger Modules');
    deltas.push({ item: 'Solar Charger Modules', quantity: solarModDelta, unitCost: unit, total: solarModDelta * unit });
  }

  const panelDelta = Math.max(0, (required.solarPanelQuantity || 0) - (installed.solarPanelQuantity || 0));
  if (panelDelta > 0) {
    const unit = getUnitCost(inputs, 'Solar Panels');
    deltas.push({ item: 'Solar Panels', quantity: panelDelta, unitCost: unit, total: panelDelta * unit });
  }

  return deltas;
}

function mergeDesignLock(base: DesignLock, required: DesignLock, inputs: SiteInputs): DesignLock {
  return {
    adjustedBatteryCapacityAH: Math.max(base.adjustedBatteryCapacityAH, required.adjustedBatteryCapacityAH),
    batteryModules: Math.max(base.batteryModules, required.batteryModules),
    rectifierModules: Math.max(base.rectifierModules, required.rectifierModules),
    coreCapacity: Math.max(base.coreCapacity, required.coreCapacity),
    selectedDGKva: inputs.dg.enabled
      ? Math.max(base.selectedDGKva, required.selectedDGKva)
      : base.selectedDGKva,
    batteryCabinetQty: Math.max(base.batteryCabinetQty, required.batteryCabinetQty),
    solarPanelQuantity: Math.max(base.solarPanelQuantity || 0, required.solarPanelQuantity || 0),
    solarChargerModuleQuantity: Math.max(base.solarChargerModuleQuantity || 0, required.solarChargerModuleQuantity || 0),
    actualSolarCapacity: Math.max(base.actualSolarCapacity || 0, required.actualSolarCapacity || 0),
    solarExpansionSubrackQty: Math.max(base.solarExpansionSubrackQty || 0, required.solarExpansionSubrackQty || 0)
  };
}

function calendarLifeForItem(item: string, baseline: EngineResult, inputs: SiteInputs): number {
  if (item.startsWith('Battery Modules')) return inputs.battery.maxUsefulLife || 7;
  if (item.startsWith('Diesel Generator')) return inputs.dg.maxUsefulYears || 10;
  if (item.includes('Rectifier Core') || item.startsWith('Rectifier')) return inputs.rectifier.maxUsefulLife || 7;
  if (item.includes('Cabinet')) return inputs.cabinet.maxUsefulLife || 10;
  if (item.startsWith('Solar')) return inputs.solar.panelStructureMaxUsefulLife || 25;
  if (item === 'Remote Monitoring Unit') return inputs.remoteMonitoring.maxUsefulLife || 7;
  if (item === 'ACDB') return inputs.acdb.maxUsefulLife || 10;
  return baseline.usefulLifeMap[item] || 999;
}

function isWearTrackedBattery(item: string): boolean {
  return item.startsWith('Battery Modules');
}

function isWearTrackedDg(item: string): boolean {
  return item.startsWith('Diesel Generator');
}

function runModePath(
  baseInputs: SiteInputs,
  baseline: EngineResult,
  change: EnvironmentChange,
  mode: 'A' | 'B'
): ModePathResult {
  const tenure = baseInputs.financials.tenure || 10;
  const wacc = (baseInputs.financials.wacc || 0) / 100;
  const taxRate = (baseInputs.financials.taxRate || 0) / 100;
  const escalation = (baseInputs.financials.escalation || 0) / 100;
  const changeYear = Math.min(Math.max(1, change.changeYear || 1), tenure);

  const cashFlows = emptyCashFlows(tenure);
  const wearTable: WearYearRow[] = [];
  const capexEvents: CapexEvent[] = [];
  const allRiskFlags = new Set<string>();
  let upgradeBoq: ModePathResult['upgradeBoq'] = [];

  // Year-0 CAPEX from baseline BoQ
  baseline.boq.forEach(item => {
    const cost = item.total || 0;
    cashFlows[0].capex += cost;
    cashFlows[0].details.capexItems.push({ name: item.item, cost });
    capexEvents.push({ year: 0, name: item.item, cost, kind: 'initial' });
  });
  cashFlows[0].totalOutflow = cashFlows[0].capex;
  cashFlows[0].totalSystemOutflow = cashFlows[0].capex;

  // Asset state for calendar replacements (non-wear items)
  type AssetState = {
    item: string;
    quantity: number;
    unitCost: number;
    installYear: number;
    calendarLife: number;
  };
  const assets: AssetState[] = baseline.boq
    .filter(b => b.quantity > 0 && !isWearTrackedBattery(b.item) && !isWearTrackedDg(b.item))
    .map(b => ({
      item: b.item,
      quantity: b.quantity,
      unitCost: b.unitCost || getUnitCost(baseInputs, b.item),
      installYear: 0,
      calendarLife: calendarLifeForItem(b.item, baseline, baseInputs)
    }));

  // Wear state
  let design = { ...baseline.designLock };
  let batteryCyclesCum = 0;
  let batteryYearsSinceInstall = 0;
  let dgHoursCum = 0;
  let dgYearsSinceInstall = 0;
  // Base CAPEX amounts for wear-asset replacements
  const batteryUnitCost = getUnitCost(baseInputs, 'Battery Modules');
  let batteryModulesInstalled = design.batteryModules;
  let dgKvaInstalled = design.selectedDGKva;
  let dgUnitCost = dgKvaInstalled > 0 ? getUnitCost(baseInputs, `Diesel Generator ${dgKvaInstalled}kVA`) : 0;

  const mcSamples = baseInputs.solar.enabled ? 200 : 1000;

  for (let y = 1; y <= tenure; y++) {
    const changed = y >= changeYear;
    const yearInputs = applyEnvironment(baseInputs, change, changed);

    // Mode B: re-size at change year and apply delta CAPEX
    if (mode === 'B' && y === changeYear) {
      const resized = calculateAllStats(yearInputs, { monteCarloSamples: mcSamples });
      upgradeBoq = computeDeltaBoq(design, resized.designLock, yearInputs);
      const upgraded = mergeDesignLock(design, resized.designLock, yearInputs);

      if (upgradeBoq.length > 0) {
        const esc = Math.pow(1 + escalation, y);
        upgradeBoq.forEach(u => {
          const cost = u.total * esc;
          cashFlows[y].capex += cost;
          cashFlows[y].details.capexItems.push({ name: `${u.item} (Upgrade)`, cost });
          capexEvents.push({ year: y, name: `${u.item} (Upgrade)`, cost, kind: 'upgrade' });
        });

        // If battery modules added, treat pack as partially renewed: reset cycles for simplicity when modules increase
        if (upgraded.batteryModules > batteryModulesInstalled) {
          batteryCyclesCum = 0;
          batteryYearsSinceInstall = 0;
          batteryModulesInstalled = upgraded.batteryModules;
        }
        if (upgraded.selectedDGKva > dgKvaInstalled) {
          dgHoursCum = 0;
          dgYearsSinceInstall = 0;
          dgKvaInstalled = upgraded.selectedDGKva;
          dgUnitCost = getUnitCost(yearInputs, `Diesel Generator ${dgKvaInstalled}kVA`);
        }
        // Core upgrade — add as asset if new core size
        if (upgraded.coreCapacity > design.coreCapacity) {
          assets.push({
            item: `Rectifier Core ${upgraded.coreCapacity}kW`,
            quantity: 1,
            unitCost: getUnitCost(yearInputs, `Rectifier Core ${upgraded.coreCapacity}kW`),
            installYear: y,
            calendarLife: yearInputs.rectifier.maxUsefulLife || 7
          });
        }
        if (upgraded.rectifierModules > design.rectifierModules) {
          const add = upgraded.rectifierModules - design.rectifierModules;
          assets.push({
            item: 'Rectifier Modules',
            quantity: add,
            unitCost: getUnitCost(yearInputs, 'Rectifier Modules'),
            installYear: y,
            calendarLife: yearInputs.rectifier.maxUsefulLife || 7
          });
        }
        if (upgraded.batteryCabinetQty > design.batteryCabinetQty) {
          const add = upgraded.batteryCabinetQty - design.batteryCabinetQty;
          assets.push({
            item: 'Battery Cabinet',
            quantity: add,
            unitCost: getUnitCost(yearInputs, 'Battery Cabinet'),
            installYear: y,
            calendarLife: yearInputs.cabinet.maxUsefulLife || 10
          });
        }
      }
      design = upgraded;
    }

    // Ops with locked design
    const ops = calculateAllStats(yearInputs, {
      designLock: design,
      monteCarloSamples: mcSamples
    });
    const rs = ops.rectifierStats;
    const flags = buildRiskFlags(rs, yearInputs, design);
    flags.forEach(f => allRiskFlags.add(f));

    const cyclesPerDay = rs.batteryCyclesPerDay || 0;
    const hoursPerDay = rs.dgRunningHoursPerDay || 0;
    const availableCycles = rs.batteryCycles || getCyclesForDoD(rs.actualDoD || 80);
    const maxDgHours = yearInputs.dg.maxUsefulHours || 20000;
    const maxBatYears = yearInputs.battery.maxUsefulLife || 7;
    const maxDgYears = yearInputs.dg.maxUsefulYears || 10;

    const cyclesAdded = cyclesPerDay * 365;
    const hoursAdded = hoursPerDay * 365;
    batteryCyclesCum += cyclesAdded;
    dgHoursCum += hoursAdded;
    batteryYearsSinceInstall += 1;
    dgYearsSinceInstall += 1;

    let batteryReplaced = false;
    let dgReplaced = false;

    // Battery wear / calendar replacement
    if (
      batteryModulesInstalled > 0 &&
      (batteryCyclesCum >= availableCycles || batteryYearsSinceInstall >= maxBatYears)
    ) {
      const esc = Math.pow(1 + escalation, y);
      const cost = batteryModulesInstalled * batteryUnitCost * esc;
      cashFlows[y].capex += cost;
      cashFlows[y].details.capexItems.push({ name: 'Battery Modules (Replacement)', cost });
      capexEvents.push({ year: y, name: 'Battery Modules (Replacement)', cost, kind: 'replacement' });
      batteryCyclesCum = 0;
      batteryYearsSinceInstall = 0;
      batteryReplaced = true;
    }

    // DG wear / calendar replacement
    if (
      yearInputs.dg.enabled &&
      dgKvaInstalled > 0 &&
      (dgHoursCum >= maxDgHours || dgYearsSinceInstall >= maxDgYears)
    ) {
      const esc = Math.pow(1 + escalation, y);
      const cost = dgUnitCost * esc;
      cashFlows[y].capex += cost;
      cashFlows[y].details.capexItems.push({ name: `Diesel Generator ${dgKvaInstalled}kVA (Replacement)`, cost });
      capexEvents.push({
        year: y,
        name: `Diesel Generator ${dgKvaInstalled}kVA (Replacement)`,
        cost,
        kind: 'replacement'
      });
      dgHoursCum = 0;
      dgYearsSinceInstall = 0;
      dgReplaced = true;
    }

    // Calendar replacements for other assets
    assets.forEach(asset => {
      if (asset.calendarLife >= 999) return;
      const age = y - asset.installYear;
      if (age > 0 && age % asset.calendarLife === 0) {
        const esc = Math.pow(1 + escalation, y);
        const cost = asset.quantity * asset.unitCost * esc;
        cashFlows[y].capex += cost;
        cashFlows[y].details.capexItems.push({ name: `${asset.item} (Replacement)`, cost });
        capexEvents.push({ year: y, name: `${asset.item} (Replacement)`, cost, kind: 'replacement' });
        asset.installYear = y;
      }
    });

    // OPEX for this year from ops
    const esc = Math.pow(1 + escalation, y - 1);
    const opexConfig = yearInputs.costs.opex;
    const annualPMCost = (opexConfig.annualPM || 0) * esc;
    const solarPMCost = (yearInputs.solar.enabled ? (opexConfig.solarPM || 0) : 0) * esc;
    const fuelHaulingCost = yearInputs.financials.dgFuelPassthrough
      ? 0
      : ((opexConfig.fuelHaulingMonthly || 0) * 12) * esc;
    const gridElectricityCost = yearInputs.financials.gridElectricityPassthrough
      ? 0
      : (rs.dailyEnergyAC * 365 * (opexConfig.gridTariffPerKWh || 0)) * esc;
    const fuelHaulingCostFull = ((opexConfig.fuelHaulingMonthly || 0) * 12) * esc;
    const gridElectricityCostFull = (rs.dailyEnergyAC * 365 * (opexConfig.gridTariffPerKWh || 0)) * esc;

    let dgMaintenanceCost = 0;
    if (yearInputs.dg.enabled) {
      const annualHours = hoursPerDay * 365;
      dgMaintenanceCost += ((yearInputs.dg.periodicMaintenanceHours || 1) > 0
        ? annualHours / yearInputs.dg.periodicMaintenanceHours! * (opexConfig.dgPM || 0)
        : 0) * esc;
      dgMaintenanceCost += ((yearInputs.dg.minorOverhaulHours || 1) > 0
        ? annualHours / yearInputs.dg.minorOverhaulHours! * (opexConfig.dgMinorOverhaul || 0)
        : 0) * esc;
      dgMaintenanceCost += ((yearInputs.dg.majorOverhaulHours || 1) > 0
        ? annualHours / yearInputs.dg.majorOverhaulHours! * (opexConfig.dgMajorOverhaul || 0)
        : 0) * esc;
    }
    const fuelCost = yearInputs.financials.dgFuelPassthrough
      ? 0
      : (rs.dgDailyFuel * 365 * (opexConfig.fuelCostPerLiter || 0)) * esc;
    const fuelCostFull = (rs.dgDailyFuel * 365 * (opexConfig.fuelCostPerLiter || 0)) * esc;

    cashFlows[y].opex = annualPMCost + solarPMCost + fuelHaulingCost + gridElectricityCost + dgMaintenanceCost;
    cashFlows[y].fuel = fuelCost;
    cashFlows[y].totalOutflow = cashFlows[y].capex + cashFlows[y].opex + cashFlows[y].fuel;
    cashFlows[y].totalSystemOutflow =
      cashFlows[y].capex + annualPMCost + solarPMCost + fuelHaulingCostFull + gridElectricityCostFull + dgMaintenanceCost + fuelCostFull;

    cashFlows[y].details.opexItems.push({ name: 'Annual PM', cost: annualPMCost });
    if (yearInputs.solar.enabled && (opexConfig.solarPM || 0) > 0) {
      cashFlows[y].details.opexItems.push({ name: 'Annual Solar Preventive Maintenance', cost: solarPMCost });
    }
    if (!yearInputs.financials.dgFuelPassthrough) {
      cashFlows[y].details.opexItems.push({ name: 'Fuel Hauling', cost: fuelHaulingCost });
    }
    if (!yearInputs.financials.gridElectricityPassthrough) {
      cashFlows[y].details.opexItems.push({ name: 'Grid Electricity', cost: gridElectricityCost });
    }
    if (yearInputs.dg.enabled) {
      cashFlows[y].details.opexItems.push({ name: 'DG Maintenance', cost: dgMaintenanceCost });
    }
    if (!yearInputs.financials.dgFuelPassthrough) {
      cashFlows[y].details.opexItems.push({ name: 'Fuel Cost', cost: fuelCost });
    }

    wearTable.push({
      year: y,
      regime: changed ? 'changed' : 'baseline',
      batteryCyclesAdded: cyclesAdded,
      batteryCyclesCumulative: batteryCyclesCum,
      batteryAvailableCycles: availableCycles,
      batteryYearsSinceInstall,
      batteryReplaced,
      dgHoursAdded: hoursAdded,
      dgHoursCumulative: dgHoursCum,
      dgMaxHours: maxDgHours,
      dgYearsSinceInstall,
      dgReplaced,
      actualDoD: rs.actualDoD,
      batteryCyclesPerDay: cyclesPerDay,
      dgRunningHoursPerDay: hoursPerDay,
      dailyEnergyAC: rs.dailyEnergyAC,
      dgDailyFuel: rs.dgDailyFuel,
      dailyLoadEnergy: rs.dailyLoadEnergy,
      autonomyAtDoD: rs.autonomyAtDoD,
      outageDuration: yearInputs.gridCondition === 'Off-grid' ? 24 : (yearInputs.outageDuration || 0),
      riskFlags: flags
    });
  }

  const npvOperator = cashFlows.reduce((acc, cf) => acc + cf.totalOutflow / Math.pow(1 + wacc, cf.year), 0);
  const npvSystem = cashFlows.reduce((acc, cf) => acc + cf.totalSystemOutflow / Math.pow(1 + wacc, cf.year), 0);
  let annuityFactor = 0;
  for (let t = 1; t <= tenure; t++) annuityFactor += 1 / Math.pow(1 + wacc, t);
  const breakevenMRR = annuityFactor > 0 ? npvOperator / (12 * (1 - taxRate) * annuityFactor) : 0;

  // LCOE uses average daily load energy path (simple: baseline daily load if no scale)
  let npvEnergy = 0;
  for (const row of wearTable) {
    npvEnergy += (row.dailyLoadEnergy * 365) / Math.pow(1 + wacc, row.year);
  }
  const lcoe = npvEnergy > 0 ? npvSystem / npvEnergy : 0;

  const totalCapex = cashFlows.reduce((a, c) => a + c.capex, 0);
  const totalOpexFuel = cashFlows.reduce((a, c) => a + c.opex + c.fuel, 0);

  return {
    mode,
    cashFlows,
    wearTable,
    capexEvents,
    upgradeBoq,
    riskFlags: Array.from(allRiskFlags),
    npvOperator,
    npvSystem,
    breakevenMRR,
    lcoe,
    initialCapex: cashFlows[0].capex,
    totalCapex,
    totalOpexFuel
  };
}

function npvOf(cashFlows: CashFlowYear[], wacc: number, field: 'totalOutflow' | 'totalSystemOutflow'): number {
  return cashFlows.reduce((acc, cf) => acc + (cf[field] / Math.pow(1 + wacc, cf.year)), 0);
}

/**
 * Run life simulation: baseline + Mode A and/or Mode B for a single environment shock.
 */
export function runLifeSimulation(baseInputs: SiteInputs, config: LifeSimConfig): LifeSimResult {
  const inputs = cloneInputs(baseInputs);
  const mcSamples = inputs.solar.enabled ? 200 : 1000;
  const baseline = calculateAllStats(inputs, { monteCarloSamples: mcSamples });
  const wacc = (inputs.financials.wacc || 0) / 100;
  const baselineNpvOp = npvOf(baseline.cashFlows, wacc, 'totalOutflow');
  const baselineNpvSys = npvOf(baseline.cashFlows, wacc, 'totalSystemOutflow');
  const baselineTotalCapex = baseline.cashFlows.reduce((a, c) => a + c.capex, 0);
  const baselineTotalOpexFuel = baseline.cashFlows.reduce((a, c) => a + c.opex + c.fuel, 0);

  const result: LifeSimResult = { baseline };

  const buildDelta = (path: ModePathResult): DeltaSummary => ({
    npvOperator: path.npvOperator - baselineNpvOp,
    npvSystem: path.npvSystem - baselineNpvSys,
    breakevenMRR: path.breakevenMRR - baseline.breakevenMRR,
    lcoe: path.lcoe - baseline.lcoe,
    totalCapex: path.totalCapex - baselineTotalCapex,
    totalOpexFuel: path.totalOpexFuel - baselineTotalOpexFuel,
    yearly: path.cashFlows.map((cf, i) => {
      const b = baseline.cashFlows[i] || { capex: 0, opex: 0, fuel: 0, totalOutflow: 0 };
      return {
        year: cf.year,
        capex: cf.capex - (b.capex || 0),
        opex: cf.opex - (b.opex || 0),
        fuel: cf.fuel - (b.fuel || 0),
        totalOutflow: cf.totalOutflow - (b.totalOutflow || 0)
      };
    })
  });

  if (config.mode === 'A' || config.mode === 'compare') {
    result.modeA = runModePath(inputs, baseline, config.change, 'A');
    result.deltaA = buildDelta(result.modeA);
  }
  if (config.mode === 'B' || config.mode === 'compare') {
    result.modeB = runModePath(inputs, baseline, config.change, 'B');
    result.deltaB = buildDelta(result.modeB);
  }
  if (result.modeA && result.modeB) {
    result.deltaBminusA = {
      npvOperator: result.modeB.npvOperator - result.modeA.npvOperator,
      npvSystem: result.modeB.npvSystem - result.modeA.npvSystem,
      breakevenMRR: result.modeB.breakevenMRR - result.modeA.breakevenMRR,
      lcoe: result.modeB.lcoe - result.modeA.lcoe,
      totalCapex: result.modeB.totalCapex - result.modeA.totalCapex,
      totalOpexFuel: result.modeB.totalOpexFuel - result.modeA.totalOpexFuel,
      yearly: result.modeB.cashFlows.map((cf, i) => {
        const a = result.modeA!.cashFlows[i];
        return {
          year: cf.year,
          capex: cf.capex - a.capex,
          opex: cf.opex - a.opex,
          fuel: cf.fuel - a.fuel,
          totalOutflow: cf.totalOutflow - a.totalOutflow
        };
      })
    };
  }

  return result;
}

/** Sweep change year 1..tenure for Mode A NPV delta (quick chart). */
export function sweepChangeYear(
  baseInputs: SiteInputs,
  changeTemplate: Omit<EnvironmentChange, 'changeYear'>,
  mode: 'A' | 'B' = 'A'
): { changeYear: number; deltaNpvOperator: number; deltaTotalCapex: number; deltaOpexFuel: number }[] {
  const tenure = baseInputs.financials.tenure || 10;
  const out: { changeYear: number; deltaNpvOperator: number; deltaTotalCapex: number; deltaOpexFuel: number }[] = [];
  for (let y = 1; y <= tenure; y++) {
    const sim = runLifeSimulation(baseInputs, {
      mode,
      change: { ...changeTemplate, changeYear: y }
    });
    const delta = mode === 'A' ? sim.deltaA : sim.deltaB;
    if (delta) {
      out.push({
        changeYear: y,
        deltaNpvOperator: delta.npvOperator,
        deltaTotalCapex: delta.totalCapex,
        deltaOpexFuel: delta.totalOpexFuel
      });
    }
  }
  return out;
}
