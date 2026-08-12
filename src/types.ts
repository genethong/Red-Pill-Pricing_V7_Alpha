export type GridCondition = 'Good' | 'Poor' | 'Bad' | 'Off-grid';

export interface TenantLoad {
  peakLoad: number | null;
  averageLoad: number | null;
  runningLoad: number | null;
}

export interface BatteryDetails {
  backupHours: number | null;
  toleranceMargin: number | null; // AH
  dod: number | null; // %
  ageing: number | null; // %
  moduleCapacity: number | null; // AH
  ratedVoltage: number | null; // V
  maxUsefulLife: number | null; // Years
}

export type DGOperationMethod = 'CDC' | 'Non-CDC';
export type DGPhases = '1 Phase' | '3 Phase';

export interface DGDetails {
  enabled: boolean;
  operationMethod: DGOperationMethod;
  phases: DGPhases;
  maxLoadRateOffgrid: number | null; // %
  maxLoadRateOngrid: number | null; // %
  powerFactor: number | null;
  majorOverhaulHours: number | null;
  minorOverhaulHours: number | null;
  periodicMaintenanceHours: number | null;
  maxUsefulHours: number | null;
  maxUsefulYears: number | null;
  pmPeriodMonths: number | null;
}

export interface CabinetDetails {
  fanPowerConsumption: number | null; // W
  equipmentCabinetBatteryCapacity: number | null; // AH
  batteryCabinetCapacity: number | null; // AH
  maxUsefulLife: number | null; // Years
  additionalEquipmentCabinet: boolean;
  additionalEquipmentCabinetCount: number | null;
}

export interface RectifierDetails {
  moduleCapacity: number | null; // kW
  efficiency: number | null; // %
  systemVoltage: number | null; // V
  batteryChargingRate: number | null; // C
  maxUsefulLife: number | null; // Years
  slots: number | null;
}

export interface SolarDetails {
  enabled: boolean;
  totalCapacity: number | null; // kWp
  panelCapacity: number | null; // Wp
  chargerModuleCapacity: number | null; // kW
  yieldType: 'annual_yield' | 'efficiency_peak_hours';
  annualYield: number | null; // kWh/m2
  overallEfficiency: number | null; // %
  annualPeakHours: number | null; // kWh/m2
  panelStructureMaxUsefulLife: number | null; // Years
  rectifierMaxUsefulLife: number | null; // Years
}

export interface ModellingRequirements {
  multipleModels: boolean;
  iterations: number | null;
  loadIncrement: number | null; // kW
  solarIncrement: number | null; // kWp
}

export interface SiteInputs {
  gridCondition: GridCondition;
  dailyOutages: number | null;
  outageDuration: number | null;
  numTenants: number | null;
  tenantLoads: TenantLoad[];
  battery: BatteryDetails;
  dg: DGDetails;
  remoteMonitoring: {
    enabled: boolean;
    maxUsefulLife: number | null;
  };
  cabinet: CabinetDetails;
  acdb: {
    enabled: boolean;
    maxUsefulLife: number | null;
  };
  rectifier: RectifierDetails;
  solar: SolarDetails;
  modelling: ModellingRequirements;
  financials: FinancialInputs;
  costs: CostConfiguration;
}

export type Currency = 'USD' | 'MYR' | 'BDT' | 'PHP' | 'PKR';

export interface FinancialInputs {
  wacc: number | null; // %
  escalation: number | null; // %
  taxRate: number | null; // %
  tenure: number | null; // Years
  currency: Currency;
  dgFuelPassthrough: boolean;
  gridElectricityPassthrough: boolean;
}

export interface CostConfiguration {
  materials: Record<string, number | null>; // Item Name -> Unit CAPEX
  installation: {
    dcBaseService: number | null;
    baseBatteryCapacity: number | null; // AH included in base service
    additionalBatteryInstallPerAH: number | null;
    additionalCabinetInstall: number | null;
    solarPanelInstall: number | null;
    solarStructureInstall: number | null;
    solarStructureSupply: number | null;
    transportDC: number | null;
    transportSolar: number | null;
    siteSurvey: number | null;
  };
  opex: {
    annualPM: number | null;
    dgPM: number | null;
    dgMinorOverhaul: number | null;
    dgMajorOverhaul: number | null;
    fuelHaulingMonthly: number | null;
    gridTariffPerKWh: number | null;
    fuelCostPerLiter: number | null;
    solarPM: number | null;
  };
}

export interface BoQItem {
  item: string;
  quantity: number;
  unit: string;
  description: string;
  unitCost?: number;
  total?: number;
  lifespan?: number;
}
