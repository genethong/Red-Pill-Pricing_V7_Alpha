import { SiteInputs, BoQItem } from '../types';

export const FUEL_RATE_TABLE: Record<number, Record<number, number>> = {
  10: { 25: 0.45, 50: 0.3, 75: 0.283, 100: 0.263 },
  12: { 25: 0.4, 50: 0.28, 75: 0.28, 100: 0.26 },
  15: { 25: 0.433, 50: 0.3, 75: 0.289, 100: 0.267 },
  20: { 25: 0.425, 50: 0.3, 75: 0.292, 100: 0.269 },
  25: { 25: 0.42, 50: 0.3, 75: 0.287, 100: 0.27 },
  30: { 25: 0.433, 50: 0.3, 75: 0.289, 100: 0.267 },
  40: { 25: 0.425, 50: 0.3, 75: 0.292, 100: 0.269 },
  50: { 25: 0.43, 50: 0.3, 75: 0.287, 100: 0.268 },
  60: { 25: 0.43, 50: 0.3, 75: 0.287, 100: 0.268 },
};

export const DOD_CYCLES_TABLE: Record<number, number> = {
  5: 11050, 10: 10625, 15: 10200, 20: 9775, 25: 9225, 30: 8675, 35: 8188, 40: 7700,
  45: 7250, 50: 6800, 55: 6400, 60: 6000, 65: 5663, 70: 5325, 75: 5100, 80: 4875,
  85: 4513, 90: 4150, 95: 3788, 100: 3425
};

export const AVAILABLE_DG_KVA = [15, 20, 25, 30, 40, 50, 60, 80, 100, 125];

/** Snapshot of installed design quantities (Mode A lock / Mode B installed base). */
export interface DesignLock {
  adjustedBatteryCapacityAH: number;
  batteryModules: number;
  rectifierModules: number;
  coreCapacity: number;
  selectedDGKva: number;
  batteryCabinetQty: number;
  solarPanelQuantity?: number;
  solarChargerModuleQuantity?: number;
  actualSolarCapacity?: number;
  solarExpansionSubrackQty?: number;
}

export interface CashFlowYear {
  year: number;
  capex: number;
  opex: number;
  fuel: number;
  totalOutflow: number;
  totalSystemOutflow: number;
  details: {
    capexItems: { name: string; cost: number }[];
    opexItems: { name: string; cost: number }[];
  };
}

export interface EngineResult {
  totalRunningLoad: number;
  totalAverageLoad: number;
  actualSolarCapacity: number;
  breakevenMRR: number;
  initialCapex: number;
  npv: number;
  lcoe: number;
  cashFlows: CashFlowYear[];
  opexItemsYear1: { name: string; cost: number; derivation: string }[];
  boq: (BoQItem & { unitCost?: number; total?: number; lifespan?: number; derivation?: string })[];
  designLock: DesignLock;
  usefulLifeMap: Record<string, number>;
  rectifierStats: {
    systemEfficiency: number;
    actualSolarCapacity: number;
    requiredDGKva: number;
    batteryBackupHours: number | null;
    batteryModules: number;
    rectifierModules: number;
    coreCapacity: number;
    totalRectifierCapacityKW: number;
    dcRunningCurrent: number;
    actualDoD: number;
    dgRunningHoursPerDay: number;
    dgDailyEnergyGeneration: number;
    dgDailyFuel: number;
    dgFuelRate: number;
    batteryCyclesPerDay: number;
    batteryCycles: number;
    batteryRunningHourPerCycle: number;
    cdcPerDay: number;
    isMonteCarlo: boolean;
    batteryUsagePerHourAH: number;
    dailyGridEnergy: number;
    dailySolarEnergy: number;
    dailyLoadEnergy: number;
    dailyEnergyAC: number;
    dailyEnergyTotal: number;
    solarPanelQuantity: number;
    solarChargerModuleQuantity: number;
    solarExpansionSubrackQty: number;
    dailySolarGeneration: number;
    dailyExcessSolarKW: number;
    dailyExcessSolarAH: number;
    batteryRequiredForSolar: number;
    solarMaxChargingRate: number;
    solarAdjustedBatteryCapacityAH: number;
    adjustedBatteryCapacityAH: number;
    dgLoadRate: number;
    totalRectifierLoadKW: number;
    batteryLifeYears: number;
    dgLifeYears: number;
    batteryChargingLoadKW: number;
    totalRunningLoadWithFans: number;
    autonomyAtDoD: number;
  };
}

export interface CalculateOptions {
  /** When set, keep installed design quantities and recompute ops only (Mode A). */
  designLock?: DesignLock;
  /** Reduce Monte Carlo samples for multi-year what-if (default 1000). */
  monteCarloSamples?: number;
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

export function getCyclesForDoD(actualDoD: number): number {
  const key = Math.min(100, Math.max(5, actualDoD));
  return DOD_CYCLES_TABLE[key] || 3425;
}

export function designLockFromResult(result: EngineResult): DesignLock {
  return { ...result.designLock };
}

/**
 * Full DC system design + daily ops + tenure cashflows (static single-regime).
 */
export function calculateAllStats(simInputs: SiteInputs, options?: CalculateOptions): EngineResult {
  const totalRunningLoad = simInputs.tenantLoads.reduce((acc, load) => acc + (load.runningLoad || 0), 0);
  const totalAverageLoad = simInputs.tenantLoads.reduce((acc, load) => acc + (load.averageLoad || 0), 0);
  const totalPeakLoad = simInputs.tenantLoads.reduce((acc, load) => acc + (load.peakLoad || 0), 0);

  // 1. Battery Calculation (Backup + Solar)
  const batteryDivisor = (simInputs.battery.ratedVoltage! * (simInputs.battery.dod! / 100) * (simInputs.battery.ageing! / 100));
  const rawBackupCapacity = batteryDivisor > 0 ? (totalAverageLoad * 1000 * (simInputs.battery.backupHours || 0)) / batteryDivisor : 0;
  let backupAdjustedCapacity = simInputs.battery.moduleCapacity! > 0
    ? Math.ceil((rawBackupCapacity - (simInputs.battery.toleranceMargin || 0)) / simInputs.battery.moduleCapacity!) * simInputs.battery.moduleCapacity!
    : 0;

  let solarPanelQuantity = 0;
  let actualSolarCapacity = 0;
  let solarChargerModuleQuantity = 0;
  let dailySolarPeakHour = 0;
  let dailySolarGeneration = 0;
  let dailyLoadEnergyDuringSolar = 0;
  let dailyExcessSolarKW = 0;
  let dailyExcessSolarAH = 0;
  let batteryRequiredForSolar = 0;
  let solarAdjustedBatteryCapacityAH = 0;

  if (simInputs.solar.enabled) {
    solarPanelQuantity = simInputs.solar.panelCapacity! > 0
      ? Math.ceil(((simInputs.solar.totalCapacity || 0) * 1000) / simInputs.solar.panelCapacity!)
      : 0;
    solarPanelQuantity = Math.ceil(solarPanelQuantity / 3) * 3;
    actualSolarCapacity = (solarPanelQuantity * simInputs.solar.panelCapacity!) / 1000;
    solarChargerModuleQuantity = simInputs.solar.chargerModuleCapacity! > 0
      ? Math.ceil((actualSolarCapacity * (simInputs.solar.overallEfficiency! / 100)) / simInputs.solar.chargerModuleCapacity!)
      : 0;
    dailySolarPeakHour = (simInputs.solar.annualPeakHours || 0) / 365;
    dailySolarGeneration = actualSolarCapacity * dailySolarPeakHour * (simInputs.solar.overallEfficiency! / 100);
    dailyLoadEnergyDuringSolar = totalAverageLoad * dailySolarPeakHour;
    dailyExcessSolarKW = Math.max(0, dailySolarGeneration - dailyLoadEnergyDuringSolar);
    dailyExcessSolarAH = simInputs.battery.ratedVoltage! > 0 ? (dailyExcessSolarKW * 1000) / simInputs.battery.ratedVoltage! : 0;
    const solarBatteryDivisor = (simInputs.battery.dod! / 100) * (simInputs.battery.ageing! / 100);
    batteryRequiredForSolar = solarBatteryDivisor > 0 ? dailyExcessSolarAH / solarBatteryDivisor : 0;
    if (batteryRequiredForSolar > backupAdjustedCapacity) {
      solarAdjustedBatteryCapacityAH = Math.ceil((batteryRequiredForSolar - (simInputs.battery.toleranceMargin || 0)) / 100) * 100;
    }
  }

  let adjustedBatteryCapacityAH = Math.max(backupAdjustedCapacity, solarAdjustedBatteryCapacityAH);
  let batteryModules = simInputs.battery.moduleCapacity! > 0
    ? Math.ceil((adjustedBatteryCapacityAH - (simInputs.battery.toleranceMargin || 0)) / simInputs.battery.moduleCapacity!)
    : 0;
  let batteryModulesForRectifierSizing = simInputs.battery.moduleCapacity! > 0
    ? Math.ceil((backupAdjustedCapacity - (simInputs.battery.toleranceMargin || 0)) / simInputs.battery.moduleCapacity!)
    : 0;
  let batteryChargingLoadKW = (batteryModulesForRectifierSizing * (simInputs.battery.moduleCapacity || 0) * (simInputs.rectifier.systemVoltage || 0) * (simInputs.rectifier.batteryChargingRate || 0)) / 1000;
  let totalRectifierLoadKW = totalPeakLoad + batteryChargingLoadKW;
  let rectifierModules = simInputs.rectifier.moduleCapacity! > 0
    ? Math.max(Math.ceil(totalRectifierLoadKW / simInputs.rectifier.moduleCapacity!), 2)
    : 2;
  if (simInputs.dg.enabled && simInputs.dg.phases === '3 Phase') {
    rectifierModules = Math.ceil(rectifierModules / 3) * 3;
  }

  // Rectifier Core Sizing
  let totalRequiredSlots = rectifierModules + solarChargerModuleQuantity;
  let totalRectifierCapacityKW = rectifierModules * (simInputs.rectifier.moduleCapacity || 0);
  let coreCapacity = 12;
  if (totalRectifierCapacityKW > 24) coreCapacity = 36;
  else if (totalRectifierCapacityKW > 12) coreCapacity = 24;
  if (totalRequiredSlots > 6) coreCapacity = 36;
  else if (totalRequiredSlots > 3 && coreCapacity < 24) coreCapacity = 24;

  let availableCoreSlots = coreCapacity / 4;
  let solarExpansionSubrackQty = 0;
  if (totalRequiredSlots > availableCoreSlots) {
    solarExpansionSubrackQty = Math.ceil((totalRequiredSlots - availableCoreSlots) / 3);
  }

  // Cabinet Quantities
  let batteryCabinetQty = 0;
  const remainingBatteryCapacityAH = Math.max(0, adjustedBatteryCapacityAH - (simInputs.cabinet.equipmentCabinetBatteryCapacity || 0));
  batteryCabinetQty = remainingBatteryCapacityAH > 0 && (simInputs.cabinet.batteryCabinetCapacity || 0) > 0
    ? Math.ceil(remainingBatteryCapacityAH / simInputs.cabinet.batteryCabinetCapacity!)
    : 0;
  const extraEquipmentCabinetQty = simInputs.cabinet.additionalEquipmentCabinet ? (simInputs.cabinet.additionalEquipmentCabinetCount || 0) : 0;
  let totalCabinetQty = 1 + batteryCabinetQty + extraEquipmentCabinetQty;
  let totalRunningLoadWithFans = totalRunningLoad + (totalCabinetQty * (simInputs.cabinet.fanPowerConsumption || 0) / 1000);

  // DG Sizing
  let selectedDGKva = 0;
  let requiredDGKva = 0;
  if (simInputs.dg.enabled) {
    const maxDCLoadKW = totalPeakLoad + batteryChargingLoadKW + (totalCabinetQty * (simInputs.cabinet.fanPowerConsumption || 0) / 1000);
    const maxACLoadKW = simInputs.rectifier.efficiency! > 0 ? maxDCLoadKW / (simInputs.rectifier.efficiency! / 100) : 0;
    const dgDivisor = (simInputs.dg.powerFactor || 0) * ((simInputs.dg.maxLoadRateOngrid || 0) / 100);
    requiredDGKva = dgDivisor > 0 ? maxACLoadKW / dgDivisor : 0;
    selectedDGKva = AVAILABLE_DG_KVA.find(dg => dg >= requiredDGKva) || 125;
  }

  // Apply design lock (Mode A: fixed installed kit)
  if (options?.designLock) {
    const lock = options.designLock;
    adjustedBatteryCapacityAH = lock.adjustedBatteryCapacityAH;
    batteryModules = lock.batteryModules;
    rectifierModules = lock.rectifierModules;
    coreCapacity = lock.coreCapacity;
    selectedDGKva = lock.selectedDGKva;
    batteryCabinetQty = lock.batteryCabinetQty;
    if (lock.solarPanelQuantity != null) solarPanelQuantity = lock.solarPanelQuantity;
    if (lock.solarChargerModuleQuantity != null) solarChargerModuleQuantity = lock.solarChargerModuleQuantity;
    if (lock.actualSolarCapacity != null) actualSolarCapacity = lock.actualSolarCapacity;
    if (lock.solarExpansionSubrackQty != null) solarExpansionSubrackQty = lock.solarExpansionSubrackQty;

    batteryModulesForRectifierSizing = batteryModules;
    batteryChargingLoadKW = (batteryModules * (simInputs.battery.moduleCapacity || 0) * (simInputs.rectifier.systemVoltage || 0) * (simInputs.rectifier.batteryChargingRate || 0)) / 1000;
    totalRectifierLoadKW = totalPeakLoad + batteryChargingLoadKW;
    totalRectifierCapacityKW = rectifierModules * (simInputs.rectifier.moduleCapacity || 0);
    totalCabinetQty = 1 + batteryCabinetQty + extraEquipmentCabinetQty;
    totalRunningLoadWithFans = totalRunningLoad + (totalCabinetQty * (simInputs.cabinet.fanPowerConsumption || 0) / 1000);
  }

  // Ops follow installed kit: a locked 0 kVA design cannot run a genset even if inputs.dg.enabled.
  const dgInstalled = !!(simInputs.dg.enabled && selectedDGKva > 0);

  const batteryAgeingFactor = (simInputs.battery.ageing || 0) / 100;
  const batteryDoDFactor = (simInputs.battery.dod || 0) / 100;
  const usableBatteryCapacityAH = adjustedBatteryCapacityAH * batteryDoDFactor * batteryAgeingFactor;
  const dcRunningCurrent = simInputs.battery.ratedVoltage! > 0
    ? (totalRunningLoadWithFans * 1000) / simInputs.battery.ratedVoltage!
    : 0;
  const autonomyAtDoD = dcRunningCurrent > 0 ? usableBatteryCapacityAH / dcRunningCurrent : 0;
  const batteryUsagePerHourAH = autonomyAtDoD > 0 ? 1 / autonomyAtDoD : 0;

  const outageDuration = simInputs.gridCondition === 'Off-grid' ? 24 : (simInputs.outageDuration || 0);
  const dailyOutages = simInputs.gridCondition === 'Off-grid' ? 1 : (simInputs.dailyOutages || 0);

  const dischargeDoD = (adjustedBatteryCapacityAH * batteryAgeingFactor) > 0
    ? (dcRunningCurrent * outageDuration) / (adjustedBatteryCapacityAH * batteryAgeingFactor) * 100
    : 0;
  const actualDoD = Math.min(simInputs.battery.dod || 100, Math.ceil(dischargeDoD / 5) * 5);
  const batteryCycles = getCyclesForDoD(actualDoD);

  // Simulation
  let dgRunningHoursPerDay = 0;
  let dgDailyFuel = 0;
  let dgDailyEnergyGeneration = 0;
  let dgFuelRate = 0;
  let cdcPerDay = 0;
  let batteryCyclesPerDay = 0;
  let batteryRunningHourPerCycle = 0;
  let dailyGridEnergy = 0;
  let dailySolarEnergy = 0;
  let dailyLoadEnergy = totalRunningLoadWithFans * 24;
  let dailyEnergyAC = 0;
  let dailyEnergyTotal = 0;
  let isMonteCarlo = false;

  const getFuelRate = (kw: number) => {
    if (selectedDGKva <= 0) return 0;
    const loadRate = (kw / (selectedDGKva * (simInputs.dg.powerFactor || 0.8))) * 100;
    const roundedLoad = Math.min(100, Math.max(25, Math.floor(loadRate / 25) * 25)) as 25 | 50 | 75 | 100;
    const table = FUEL_RATE_TABLE[selectedDGKva] || FUEL_RATE_TABLE[60] || FUEL_RATE_TABLE[15];
    return table[roundedLoad] || 0.3;
  };

  if (simInputs.solar.enabled) {
    isMonteCarlo = true;
    const N_SAMPLES = options?.monteCarloSamples ?? 1000;
    const SOC_MIN = 1 - batteryDoDFactor;
    const batteryCapacityKWh = (adjustedBatteryCapacityAH * batteryAgeingFactor * (simInputs.battery.ratedVoltage || 0)) / 1000;
    const chargeRateKW = (simInputs.rectifier.batteryChargingRate || 0) * batteryCapacityKWh;

    let totalGridEnergy = 0;
    let totalDgEnergy = 0;
    let totalEnergySupplied = 0;
    let totalSolarEnergyUsed = 0;
    let totalFuel = 0;
    let totalDgHours = 0;
    let totalDgStarts = 0;
    let totalBatteryDischargeKWh = 0;

    const totalDailyOutage = Math.min(24, dailyOutages * outageDuration);
    const gridInterval = (24 - totalDailyOutage) / Math.max(1, dailyOutages);
    const cycleDuration = outageDuration + gridInterval;

    for (let d = 0; d < N_SAMPLES; d++) {
      let currentSoc = 1.0;
      const outages = new Array(24).fill(false);
      const startOffset = Math.random() * 24;
      let isDgRunning = false;
      for (let h = 0; h < 24; h++) {
        const timeInCycle = (h + startOffset) % 24;
        if (totalDailyOutage >= 24) {
          outages[h] = true;
        } else if (dailyOutages > 0 && outageDuration > 0 && cycleDuration > 0) {
          if ((timeInCycle % cycleDuration) < outageDuration) outages[h] = true;
        }
      }

      for (let h = 0; h < 24; h++) {
        const solarNow = (h >= 6 && h < 18)
          ? actualSolarCapacity * ((simInputs.solar.overallEfficiency || 0) / 100) * Math.sin(Math.PI * (h - 6) / 12) * (Math.PI * dailySolarPeakHour / 24)
          : 0;
        const loadNow = totalRunningLoadWithFans;

        if (!outages[h]) {
          const solarToLoad = Math.min(loadNow, solarNow);
          const gridToLoad = loadNow - solarToLoad;
          const batteryChargeNeeded = batteryCapacityKWh > 0 ? (1.0 - currentSoc) * batteryCapacityKWh : 0;
          const chargeFromSolar = Math.min(Math.max(0, solarNow - solarToLoad), batteryChargeNeeded);
          const chargeFromGrid = Math.min(chargeRateKW, Math.max(0, batteryChargeNeeded - chargeFromSolar));
          totalSolarEnergyUsed += solarToLoad + chargeFromSolar;
          totalGridEnergy += gridToLoad + chargeFromGrid;
          totalEnergySupplied += loadNow;
          if (batteryCapacityKWh > 0) {
            currentSoc = Math.min(1.0, currentSoc + (chargeFromSolar + chargeFromGrid) / batteryCapacityKWh);
          }
          isDgRunning = false;
        } else {
          if (!dgInstalled || simInputs.dg.operationMethod === 'CDC') {
            const energyInBattery = batteryCapacityKWh > 0 ? (currentSoc - SOC_MIN) * batteryCapacityKWh : 0;
            if (solarNow >= loadNow) {
              const chargeFromSolar = batteryCapacityKWh > 0 ? Math.min(solarNow - loadNow, (1.0 - currentSoc) * batteryCapacityKWh) : 0;
              totalSolarEnergyUsed += loadNow + chargeFromSolar;
              totalEnergySupplied += loadNow;
              if (batteryCapacityKWh > 0) {
                currentSoc = Math.min(1.0, currentSoc + chargeFromSolar / batteryCapacityKWh);
              }
              isDgRunning = false;
            } else if (solarNow + energyInBattery >= loadNow) {
              totalSolarEnergyUsed += solarNow;
              const fromBattery = loadNow - solarNow;
              totalEnergySupplied += loadNow;
              if (batteryCapacityKWh > 0) {
                currentSoc -= fromBattery / batteryCapacityKWh;
              }
              totalBatteryDischargeKWh += fromBattery;
              isDgRunning = false;
            } else if (dgInstalled) {
              if (!isDgRunning) totalDgStarts++;
              isDgRunning = true;
              totalDgHours++;
              totalBatteryDischargeKWh += energyInBattery;
              currentSoc = SOC_MIN;
              const dgToBattery = batteryCapacityKWh > 0 ? Math.min(chargeRateKW, (1.0 - currentSoc) * batteryCapacityKWh) : 0;
              totalSolarEnergyUsed += solarNow;
              const netDgLoad = Math.max(0, loadNow - solarNow - (energyInBattery > 0 ? energyInBattery : 0));
              const dgPower = netDgLoad + dgToBattery;
              totalDgEnergy += dgPower;
              totalEnergySupplied += loadNow;
              if (batteryCapacityKWh > 0) {
                currentSoc = Math.min(1.0, currentSoc + dgToBattery / batteryCapacityKWh);
              }
              totalFuel += dgPower * getFuelRate(dgPower);
            } else {
              totalBatteryDischargeKWh += energyInBattery;
              currentSoc = SOC_MIN;
              totalSolarEnergyUsed += solarNow;
              totalEnergySupplied += solarNow + energyInBattery;
              isDgRunning = false;
            }
          } else {
            if (!isDgRunning) totalDgStarts++;
            isDgRunning = true;
            const solarToLoad = Math.min(loadNow, solarNow);
            const dgToLoad = loadNow - solarToLoad;
            const chargeFromSolar = batteryCapacityKWh > 0
              ? Math.min(Math.max(0, solarNow - solarToLoad), (1.0 - currentSoc) * batteryCapacityKWh)
              : 0;
            totalSolarEnergyUsed += solarToLoad + chargeFromSolar;
            totalDgEnergy += dgToLoad;
            totalEnergySupplied += loadNow;
            if (batteryCapacityKWh > 0) {
              currentSoc = Math.min(1.0, currentSoc + chargeFromSolar / batteryCapacityKWh);
            }
            totalDgHours++;
            totalFuel += dgToLoad * getFuelRate(dgToLoad);
          }
        }
      }
    }
    dgRunningHoursPerDay = totalDgHours / N_SAMPLES;
    dgDailyFuel = totalFuel / N_SAMPLES;
    dgDailyEnergyGeneration = totalDgEnergy / N_SAMPLES;
    dgFuelRate = totalDgEnergy > 0 ? totalFuel / totalDgEnergy : 0;
    cdcPerDay = totalDgStarts / N_SAMPLES;
    batteryCyclesPerDay = (batteryCapacityKWh > 0 && actualDoD > 0)
      ? (totalBatteryDischargeKWh / N_SAMPLES) / (batteryCapacityKWh * actualDoD / 100)
      : 0;
    batteryRunningHourPerCycle = autonomyAtDoD;
    dailyGridEnergy = totalGridEnergy / N_SAMPLES;
    dailySolarEnergy = totalSolarEnergyUsed / N_SAMPLES;
    dailyLoadEnergy = totalEnergySupplied / N_SAMPLES;
    dailyEnergyAC = (simInputs.rectifier.efficiency || 100) > 0
      ? dailyGridEnergy / (simInputs.rectifier.efficiency! / 100)
      : 0;
    dailyEnergyTotal = (dailyGridEnergy + dgDailyEnergyGeneration) / ((simInputs.rectifier.efficiency || 100) / 100) + dailySolarEnergy;
  } else {
    // Deterministic Logic
    const totalDailyOutageDuration = Math.min(24, dailyOutages * outageDuration);
    let totalBatteryHours = 0;
    if (totalDailyOutageDuration < 24) {
      const gridInterval = (24 - totalDailyOutageDuration) / Math.max(1, dailyOutages);
      const dischargeRate = (adjustedBatteryCapacityAH * batteryAgeingFactor) > 0
        ? (totalRunningLoadWithFans * 1000 / (simInputs.battery.ratedVoltage || 1)) / (adjustedBatteryCapacityAH * batteryAgeingFactor)
        : 0;
      const chargeRate = simInputs.rectifier.batteryChargingRate || 0;
      const dodLimit = 1 - batteryDoDFactor;
      let currentSoC = 1.0;
      let totalDgHours = 0;
      for (let j = 0; j < dailyOutages; j++) {
        const maxDischargeTime = (dischargeRate > 0 && currentSoC > dodLimit) ? (currentSoC - dodLimit) / dischargeRate : 0;
        const bTime = Math.max(0, Math.min(maxDischargeTime, outageDuration));
        const dTime = dgInstalled
          ? (simInputs.dg.operationMethod === 'Non-CDC' ? outageDuration : Math.max(0, outageDuration - bTime))
          : 0;
        currentSoC = Math.max(dodLimit, currentSoC - bTime * dischargeRate);
        totalDgHours += dTime;
        totalBatteryHours += bTime;
        if (dgInstalled && simInputs.dg.operationMethod === 'CDC' && dTime > 0) {
          currentSoC = Math.min(1.0, currentSoC + dTime * chargeRate);
        }
        currentSoC = Math.min(1.0, currentSoC + gridInterval * chargeRate);
      }
      dgRunningHoursPerDay = totalDgHours;
      cdcPerDay = dailyOutages;
    } else {
      if (!dgInstalled) {
        dgRunningHoursPerDay = 0;
        cdcPerDay = autonomyAtDoD > 0 ? 24 / autonomyAtDoD : 0;
      } else if (simInputs.dg.operationMethod === 'Non-CDC') {
        dgRunningHoursPerDay = 24;
        cdcPerDay = 0;
      } else {
        const chargeDuration = (simInputs.rectifier.batteryChargingRate || 0) > 0
          ? batteryDoDFactor / simInputs.rectifier.batteryChargingRate!
          : 0;
        cdcPerDay = (autonomyAtDoD + chargeDuration) > 0 ? 24 / (autonomyAtDoD + chargeDuration) : 0;
        dgRunningHoursPerDay = cdcPerDay * chargeDuration;
      }
      totalBatteryHours = 24 - dgRunningHoursPerDay;
    }
    batteryRunningHourPerCycle = autonomyAtDoD;

    const batteryDischargeDailyKWh = totalBatteryHours * totalRunningLoadWithFans;
    let dgChargingEnergy = 0;
    let gridChargingEnergy = 0;
    if (dgInstalled && simInputs.dg.operationMethod === 'CDC') {
      dgChargingEnergy = Math.min(batteryDischargeDailyKWh, dgRunningHoursPerDay * batteryChargingLoadKW);
      gridChargingEnergy = Math.max(0, batteryDischargeDailyKWh - dgChargingEnergy);
    } else {
      gridChargingEnergy = batteryDischargeDailyKWh;
    }

    if (totalDailyOutageDuration < 24) {
      dailyGridEnergy = (24 - totalDailyOutageDuration) * totalRunningLoadWithFans + gridChargingEnergy;
    } else {
      dailyGridEnergy = 0;
    }
    dgDailyEnergyGeneration = dgRunningHoursPerDay * totalRunningLoadWithFans + dgChargingEnergy;

    const powerDuringDG = simInputs.dg.operationMethod === 'CDC'
      ? (totalRunningLoadWithFans + batteryChargingLoadKW)
      : totalRunningLoadWithFans;
    dgFuelRate = getFuelRate(powerDuringDG);
    dgDailyFuel = dgDailyEnergyGeneration * dgFuelRate;
    batteryCyclesPerDay = (dgInstalled && simInputs.dg.operationMethod === 'Non-CDC') ? 0 : cdcPerDay;
    dailyEnergyAC = (simInputs.rectifier.efficiency || 100) > 0
      ? dailyGridEnergy / (simInputs.rectifier.efficiency! / 100)
      : 0;
    dailyEnergyTotal = (dailyGridEnergy + dgDailyEnergyGeneration) / ((simInputs.rectifier.efficiency || 100) / 100);
  }

  const batteryLifeYears = batteryCyclesPerDay > 0
    ? Math.floor(batteryCycles / batteryCyclesPerDay / 365)
    : (simInputs.battery.maxUsefulLife || 7);
  const dgLifeByHours = dgRunningHoursPerDay > 0
    ? Math.floor((simInputs.dg.maxUsefulHours || 20000) / (dgRunningHoursPerDay * 365))
    : (simInputs.dg.maxUsefulYears || 10);
  const dgLifeYears = Math.min(simInputs.dg.maxUsefulYears || 10, dgLifeByHours);

  const usefulLifeMap: Record<string, number> = {
    'Battery Modules': Math.min(simInputs.battery.maxUsefulLife || 7, batteryLifeYears),
    'Rectifier Modules': simInputs.rectifier.maxUsefulLife || 7,
    'Rectifier Core 12kW': simInputs.rectifier.maxUsefulLife || 7,
    'Rectifier Core 24kW': simInputs.rectifier.maxUsefulLife || 7,
    'Rectifier Core 36kW': simInputs.rectifier.maxUsefulLife || 7,
    'Power Equipment Cabinet': simInputs.cabinet.maxUsefulLife || 10,
    'Battery Cabinet': simInputs.cabinet.maxUsefulLife || 10,
    'Extra Equipment Cabinet': simInputs.cabinet.maxUsefulLife || 10,
    'Solar Panels': simInputs.solar.panelStructureMaxUsefulLife || 25,
    'Solar Charger Modules': simInputs.rectifier.maxUsefulLife || 7,
    'Diesel Generator 15kVA': dgLifeYears,
    'Diesel Generator 20kVA': dgLifeYears,
    'Diesel Generator 25kVA': dgLifeYears,
    'Diesel Generator 30kVA': dgLifeYears,
    'Diesel Generator 40kVA': dgLifeYears,
    'Diesel Generator 50kVA': dgLifeYears,
    'Diesel Generator 60kVA': dgLifeYears,
    'Diesel Generator 80kVA': dgLifeYears,
    'Diesel Generator 100kVA': dgLifeYears,
    'Diesel Generator 125kVA': dgLifeYears,
    'Remote Monitoring Unit': simInputs.remoteMonitoring.maxUsefulLife || 7,
    'ACDB': simInputs.acdb.maxUsefulLife || 10,
    'DC Installation Service': simInputs.rectifier.maxUsefulLife || 7,
    'Transport & Mobilisation (DC)': simInputs.rectifier.maxUsefulLife || 7,
    'Transport & Mobilisation (Solar)': simInputs.solar.panelStructureMaxUsefulLife || 25,
    'Installation of Solar Panels': simInputs.solar.panelStructureMaxUsefulLife || 25,
    'Installation of Panel Structures': simInputs.solar.panelStructureMaxUsefulLife || 25,
    'Site Survey & Mobilisation': 999
  };

  const boqItems: { item: string; quantity: number; unit: string; description: string }[] = [
    { item: 'Battery Modules', quantity: batteryModules, unit: 'Modules', description: `${simInputs.battery.moduleCapacity}AH ${simInputs.battery.ratedVoltage}V` },
    { item: 'Rectifier Modules', quantity: rectifierModules, unit: 'Modules', description: `${simInputs.rectifier.moduleCapacity}kW Modules` },
    { item: `Rectifier Core ${coreCapacity}kW`, quantity: 1, unit: 'Set', description: `${coreCapacity}kW Subrack` },
    { item: 'Power Equipment Cabinet', quantity: 1, unit: 'Set', description: 'Outdoor IP55 Cabinet' },
    { item: 'DC Installation Service', quantity: 1, unit: 'Lot', description: 'Installation & Commissioning' },
    { item: 'Transport & Mobilisation (DC)', quantity: 1, unit: 'Lot', description: 'Logistics to Site' },
    { item: 'Site Survey & Mobilisation', quantity: 1, unit: 'Lot', description: 'Technical Site Survey' }
  ];
  if (batteryCabinetQty > 0) {
    boqItems.push({ item: 'Battery Cabinet', quantity: batteryCabinetQty, unit: 'Set', description: 'Outdoor IP55 Battery Cabinet' });
  }
  if (extraEquipmentCabinetQty > 0) {
    boqItems.push({ item: 'Extra Equipment Cabinet', quantity: extraEquipmentCabinetQty, unit: 'Set', description: 'Outdoor IP55 Equipment Cabinet' });
  }
  if (simInputs.solar.enabled) {
    boqItems.push({ item: 'Solar Panels', quantity: solarPanelQuantity, unit: 'Panels', description: `${simInputs.solar.panelCapacity}Wp Mono-PERC` });
    boqItems.push({ item: 'Solar Charger Modules', quantity: solarChargerModuleQuantity, unit: 'Modules', description: `${simInputs.solar.chargerModuleCapacity}kW MPPT` });
    boqItems.push({ item: 'Solar Panel Structures + Footing', quantity: solarPanelQuantity, unit: 'Sets', description: 'Hot-dip Galvanized' });
    boqItems.push({ item: 'Installation of Solar Panels', quantity: solarPanelQuantity, unit: 'Panels', description: 'Mounting & Wiring' });
    boqItems.push({ item: 'Installation of Panel Structures', quantity: solarPanelQuantity, unit: 'Sets', description: 'Civil Works & Assembly' });
    boqItems.push({ item: 'Transport & Mobilisation (Solar)', quantity: 1, unit: 'Lot', description: 'Logistics for Solar' });
  }
  if (simInputs.dg.enabled && selectedDGKva > 0) {
    boqItems.push({ item: `Diesel Generator ${selectedDGKva}kVA`, quantity: 1, unit: 'Set', description: `${selectedDGKva} kVA Prime Power` });
  }
  if (simInputs.remoteMonitoring.enabled) {
    boqItems.push({ item: 'Remote Monitoring Unit', quantity: 1, unit: 'Set', description: 'Smart RMU with Cloud Access' });
  }
  if (simInputs.acdb.enabled) {
    boqItems.push({ item: 'ACDB', quantity: 1, unit: 'Set', description: 'AC Distribution Board' });
  }

  const tenure = simInputs.financials.tenure || 10;
  const wacc = (simInputs.financials.wacc || 0) / 100;
  const taxRate = (simInputs.financials.taxRate || 0) / 100;
  const escalation = (simInputs.financials.escalation || 0) / 100;
  const cashFlows: CashFlowYear[] = Array.from({ length: tenure + 1 }, (_, i) => ({
    year: i,
    capex: 0,
    opex: 0,
    fuel: 0,
    totalOutflow: 0,
    totalSystemOutflow: 0,
    details: {
      capexItems: [] as { name: string; cost: number }[],
      opexItems: [] as { name: string; cost: number }[]
    }
  }));

  boqItems.forEach(item => {
    const unitCost = getUnitCost(simInputs, item.item);
    const totalCapex = item.quantity * unitCost;
    cashFlows[0].capex += totalCapex;
    cashFlows[0].details.capexItems.push({ name: item.item, cost: totalCapex });
    const life = usefulLifeMap[item.item];
    if (life && life <= tenure) {
      for (let y = life; y <= tenure; y += life) {
        const replacementCost = totalCapex * Math.pow(1 + escalation, y);
        cashFlows[y].capex += replacementCost;
        cashFlows[y].details.capexItems.push({ name: `${item.item} (Replacement)`, cost: replacementCost });
      }
    }
  });

  const opexConfig = simInputs.costs.opex;
  for (let y = 1; y <= tenure; y++) {
    const esc = Math.pow(1 + escalation, y - 1);
    const annualPMCost = (opexConfig.annualPM || 0) * esc;
    const solarPMCost = (simInputs.solar.enabled ? (opexConfig.solarPM || 0) : 0) * esc;
    const fuelHaulingCost = simInputs.financials.dgFuelPassthrough ? 0 : ((opexConfig.fuelHaulingMonthly || 0) * 12) * esc;
    const gridElectricityCost = simInputs.financials.gridElectricityPassthrough
      ? 0
      : (dailyEnergyAC * 365 * (opexConfig.gridTariffPerKWh || 0)) * esc;

    const fuelHaulingCostFull = ((opexConfig.fuelHaulingMonthly || 0) * 12) * esc;
    const gridElectricityCostFull = (dailyEnergyAC * 365 * (opexConfig.gridTariffPerKWh || 0)) * esc;

    let dgMaintenanceCost = 0;
    if (dgInstalled) {
      const annualHours = dgRunningHoursPerDay * 365;
      dgMaintenanceCost += ((simInputs.dg.periodicMaintenanceHours || 1) > 0
        ? annualHours / simInputs.dg.periodicMaintenanceHours! * (opexConfig.dgPM || 0)
        : 0) * esc;
      dgMaintenanceCost += ((simInputs.dg.minorOverhaulHours || 1) > 0
        ? annualHours / simInputs.dg.minorOverhaulHours! * (opexConfig.dgMinorOverhaul || 0)
        : 0) * esc;
      dgMaintenanceCost += ((simInputs.dg.majorOverhaulHours || 1) > 0
        ? annualHours / simInputs.dg.majorOverhaulHours! * (opexConfig.dgMajorOverhaul || 0)
        : 0) * esc;
    }
    const fuelCost = simInputs.financials.dgFuelPassthrough
      ? 0
      : (dgDailyFuel * 365 * (opexConfig.fuelCostPerLiter || 0)) * esc;
    const fuelCostFull = (dgDailyFuel * 365 * (opexConfig.fuelCostPerLiter || 0)) * esc;

    cashFlows[y].opex = annualPMCost + solarPMCost + fuelHaulingCost + gridElectricityCost + dgMaintenanceCost;
    cashFlows[y].fuel = fuelCost;
    cashFlows[y].totalOutflow = cashFlows[y].capex + cashFlows[y].opex + cashFlows[y].fuel;
    cashFlows[y].totalSystemOutflow = cashFlows[y].capex + annualPMCost + solarPMCost + fuelHaulingCostFull + gridElectricityCostFull + dgMaintenanceCost + fuelCostFull;

    cashFlows[y].details.opexItems.push({ name: 'Annual PM', cost: annualPMCost });
    if (simInputs.solar.enabled && (opexConfig.solarPM || 0) > 0) {
      cashFlows[y].details.opexItems.push({ name: 'Annual Solar Preventive Maintenance', cost: solarPMCost });
    }
    if (!simInputs.financials.dgFuelPassthrough) {
      cashFlows[y].details.opexItems.push({ name: 'Fuel Hauling', cost: fuelHaulingCost });
    }
    if (!simInputs.financials.gridElectricityPassthrough) {
      cashFlows[y].details.opexItems.push({ name: 'Grid Electricity', cost: gridElectricityCost });
    }
    if (dgInstalled) {
      cashFlows[y].details.opexItems.push({ name: 'DG Maintenance', cost: dgMaintenanceCost });
    }
    if (!simInputs.financials.dgFuelPassthrough) {
      cashFlows[y].details.opexItems.push({ name: 'Fuel Cost', cost: fuelCost });
    }
  }
  cashFlows[0].totalOutflow = cashFlows[0].capex;
  cashFlows[0].totalSystemOutflow = cashFlows[0].capex;

  const npvLCOE = cashFlows.reduce((acc, cf) => acc + (cf.totalSystemOutflow / Math.pow(1 + wacc, cf.year)), 0);
  const npvMRR = cashFlows.reduce((acc, cf) => acc + (cf.totalOutflow / Math.pow(1 + wacc, cf.year)), 0);

  let annuityFactor = 0;
  for (let t = 1; t <= tenure; t++) annuityFactor += 1 / Math.pow(1 + wacc, t);
  const breakevenMRR = annuityFactor > 0 ? npvMRR / (12 * (1 - taxRate) * annuityFactor) : 0;
  let npvEnergy = 0;
  for (let t = 1; t <= tenure; t++) npvEnergy += (dailyLoadEnergy * 365) / Math.pow(1 + wacc, t);
  const lcoe = npvEnergy > 0 ? npvLCOE / npvEnergy : 0;

  const currency = simInputs.financials.currency;
  const opexItemsYear1 = [
    {
      name: 'Annual PM',
      cost: opexConfig.annualPM || 0,
      derivation: `Base Annual PM: ${currency} ${(opexConfig.annualPM || 0).toLocaleString()}`
    }
  ];

  if (simInputs.solar.enabled && (opexConfig.solarPM || 0) > 0) {
    opexItemsYear1.push({
      name: 'Annual Solar Preventive Maintenance',
      cost: opexConfig.solarPM || 0,
      derivation: `Solar Annual PM: ${currency} ${(opexConfig.solarPM || 0).toLocaleString()}`
    });
  }

  if (!simInputs.financials.dgFuelPassthrough) {
    opexItemsYear1.push({
      name: 'Fuel Hauling',
      cost: (opexConfig.fuelHaulingMonthly || 0) * 12,
      derivation: `${currency} ${(opexConfig.fuelHaulingMonthly || 0).toLocaleString()} / month x 12 months`
    });
  }

  if (!simInputs.financials.gridElectricityPassthrough) {
    opexItemsYear1.push({
      name: 'Grid Electricity',
      cost: dailyEnergyAC * 365 * (opexConfig.gridTariffPerKWh || 0),
      derivation: `${(dailyEnergyAC || 0).toFixed(2)} kWh/day (AC) x 365 days x ${currency} ${(opexConfig.gridTariffPerKWh || 0).toFixed(2)}/kWh`
    });
  }

  if (dgInstalled) {
    const annualHours = dgRunningHoursPerDay * 365;
    const pmCost = (simInputs.dg.periodicMaintenanceHours || 1) > 0
      ? annualHours / simInputs.dg.periodicMaintenanceHours! * (opexConfig.dgPM || 0)
      : 0;
    const minorCost = (simInputs.dg.minorOverhaulHours || 1) > 0
      ? annualHours / simInputs.dg.minorOverhaulHours! * (opexConfig.dgMinorOverhaul || 0)
      : 0;
    const majorCost = (simInputs.dg.majorOverhaulHours || 1) > 0
      ? annualHours / simInputs.dg.majorOverhaulHours! * (opexConfig.dgMajorOverhaul || 0)
      : 0;

    opexItemsYear1.push({
      name: 'DG Maintenance',
      cost: pmCost + minorCost + majorCost,
      derivation: `PM: (${(annualHours || 0).toFixed(0)}h / ${simInputs.dg.periodicMaintenanceHours}h) x ${currency} ${opexConfig.dgPM}\nMinor: (${(annualHours || 0).toFixed(0)}h / ${simInputs.dg.minorOverhaulHours}h) x ${currency} ${opexConfig.dgMinorOverhaul}\nMajor: (${(annualHours || 0).toFixed(0)}h / ${simInputs.dg.majorOverhaulHours}h) x ${currency} ${opexConfig.dgMajorOverhaul}`
    });
  }

  if (!simInputs.financials.dgFuelPassthrough) {
    opexItemsYear1.push({
      name: 'Fuel Cost',
      cost: dgDailyFuel * 365 * (opexConfig.fuelCostPerLiter || 0),
      derivation: `${(dgDailyFuel || 0).toFixed(2)} L/day x 365 days x ${currency} ${(opexConfig.fuelCostPerLiter || 0).toFixed(2)}/L`
    });
  }

  const designLock: DesignLock = {
    adjustedBatteryCapacityAH,
    batteryModules,
    rectifierModules,
    coreCapacity,
    selectedDGKva,
    batteryCabinetQty,
    solarPanelQuantity,
    solarChargerModuleQuantity,
    actualSolarCapacity,
    solarExpansionSubrackQty
  };

  return {
    totalRunningLoad,
    totalAverageLoad,
    actualSolarCapacity,
    breakevenMRR,
    initialCapex: cashFlows[0].capex,
    npv: npvLCOE,
    lcoe,
    cashFlows,
    opexItemsYear1,
    boq: boqItems.map(item => {
      const unitCost = getUnitCost(simInputs, item.item);
      return {
        ...item,
        unitCost,
        total: item.quantity * unitCost,
        lifespan: usefulLifeMap[item.item] || 0,
        derivation: `${item.quantity} ${item.unit} x ${currency} ${unitCost.toLocaleString()}`
      };
    }),
    designLock,
    usefulLifeMap,
    rectifierStats: {
      systemEfficiency: dailyEnergyTotal > 0 ? Math.min(100, (dailyLoadEnergy / dailyEnergyTotal) * 100) : 0,
      actualSolarCapacity,
      requiredDGKva: selectedDGKva,
      batteryBackupHours: simInputs.battery.backupHours,
      batteryModules,
      rectifierModules,
      coreCapacity,
      totalRectifierCapacityKW: rectifierModules * (simInputs.rectifier.moduleCapacity || 0),
      dcRunningCurrent,
      actualDoD,
      dgRunningHoursPerDay,
      dgDailyEnergyGeneration,
      dgDailyFuel,
      dgFuelRate,
      batteryCyclesPerDay,
      batteryCycles,
      batteryRunningHourPerCycle,
      cdcPerDay,
      isMonteCarlo,
      batteryUsagePerHourAH,
      dailyGridEnergy,
      dailySolarEnergy,
      dailyLoadEnergy,
      dailyEnergyAC,
      dailyEnergyTotal,
      solarPanelQuantity,
      solarChargerModuleQuantity,
      solarExpansionSubrackQty,
      dailySolarGeneration,
      dailyExcessSolarKW,
      dailyExcessSolarAH,
      batteryRequiredForSolar,
      solarMaxChargingRate: (actualSolarCapacity * ((simInputs.solar.overallEfficiency || 0) / 100)) / (adjustedBatteryCapacityAH * (simInputs.battery.ratedVoltage || 0) / 1000 || 1),
      solarAdjustedBatteryCapacityAH,
      adjustedBatteryCapacityAH,
      dgLoadRate: selectedDGKva > 0
        ? ((simInputs.dg.operationMethod === 'CDC' ? (totalRunningLoadWithFans + batteryChargingLoadKW) : totalRunningLoadWithFans) / (selectedDGKva * (simInputs.dg.powerFactor || 0.8))) * 100
        : 0,
      totalRectifierLoadKW,
      batteryLifeYears: Math.min(simInputs.battery.maxUsefulLife || 7, batteryLifeYears),
      dgLifeYears,
      batteryChargingLoadKW,
      totalRunningLoadWithFans,
      autonomyAtDoD
    }
  };
}
