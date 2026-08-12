import { SiteInputs } from './types';

export const BLANK_INPUTS: SiteInputs = {
  gridCondition: 'Good',
  dailyOutages: null,
  outageDuration: null,
  numTenants: null,
  tenantLoads: [],
  battery: {
    backupHours: null,
    toleranceMargin: null,
    dod: null,
    ageing: null,
    moduleCapacity: null,
    ratedVoltage: null,
    maxUsefulLife: null
  },
  dg: {
    enabled: false,
    operationMethod: 'CDC',
    phases: '1 Phase',
    maxLoadRateOffgrid: null,
    maxLoadRateOngrid: null,
    powerFactor: null,
    majorOverhaulHours: null,
    minorOverhaulHours: null,
    periodicMaintenanceHours: null,
    maxUsefulHours: null,
    maxUsefulYears: null,
    pmPeriodMonths: null
  },
  remoteMonitoring: {
    enabled: false,
    maxUsefulLife: null
  },
  cabinet: {
    fanPowerConsumption: null,
    equipmentCabinetBatteryCapacity: null,
    batteryCabinetCapacity: null,
    maxUsefulLife: null,
    additionalEquipmentCabinet: false,
    additionalEquipmentCabinetCount: null
  },
  acdb: {
    enabled: false,
    maxUsefulLife: null
  },
  rectifier: {
    moduleCapacity: null,
    efficiency: null,
    systemVoltage: null,
    batteryChargingRate: null,
    maxUsefulLife: null,
    slots: null
  },
  solar: {
    enabled: false,
    totalCapacity: null,
    panelCapacity: null,
    chargerModuleCapacity: null,
    yieldType: 'efficiency_peak_hours',
    annualYield: null,
    overallEfficiency: null,
    annualPeakHours: null,
    panelStructureMaxUsefulLife: null,
    rectifierMaxUsefulLife: null
  },
  modelling: {
    multipleModels: false,
    iterations: null,
    loadIncrement: null,
    solarIncrement: null
  },
  financials: {
    wacc: null,
    escalation: null,
    taxRate: null,
    tenure: null,
    currency: 'USD',
    dgFuelPassthrough: false,
    gridElectricityPassthrough: false
  },
  costs: {
    materials: {
      'Battery Modules': null,
      'Rectifier Modules': null,
      'Rectifier Core 12kW': null,
      'Rectifier Core 24kW': null,
      'Rectifier Core 36kW': null,
      'Power Equipment Cabinet': null,
      'Battery Cabinet': null,
      'Extra Equipment Cabinet': null,
      'Solar Panels': null,
      'Solar Charger Modules': null,
      'Solar Expansion Subrack': null,
      'Diesel Generator 15kVA': null,
      'Diesel Generator 20kVA': null,
      'Diesel Generator 25kVA': null,
      'Diesel Generator 30kVA': null,
      'Diesel Generator 40kVA': null,
      'Diesel Generator 50kVA': null,
      'Diesel Generator 60kVA': null,
      'Diesel Generator 80kVA': null,
      'Diesel Generator 100kVA': null,
      'Diesel Generator 125kVA': null,
      'Remote Monitoring Unit': null,
      'ACDB': null,
    },
    installation: {
      dcBaseService: null,
      baseBatteryCapacity: null,
      additionalBatteryInstallPerAH: null,
      additionalCabinetInstall: null,
      solarPanelInstall: null,
      solarStructureInstall: null,
      solarStructureSupply: null,
      transportDC: null,
      transportSolar: null,
      siteSurvey: null,
    },
    opex: {
      annualPM: null,
      dgPM: null,
      dgMinorOverhaul: null,
      dgMajorOverhaul: null,
      fuelHaulingMonthly: null,
      gridTariffPerKWh: null,
      fuelCostPerLiter: null,
      solarPM: null,
    }
  }
};

export const TEMPLATES: { name: string; data: SiteInputs }[] = [
  {
    name: "ECBD_Good Grid(1 Outage, 2h): 3kW4H",
    data: {
      "gridCondition": "Good",
      "dailyOutages": 1,
      "outageDuration": 2,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 3,
          "averageLoad": 3,
          "runningLoad": 3.39
        }
      ],
      "battery": {
        "backupHours": 4,
        "toleranceMargin": 20,
        "dod": 90,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": false,
        "operationMethod": "CDC",
        "phases": "1 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 80,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 50,
        "equipmentCabinetBatteryCapacity": 500,
        "batteryCabinetCapacity": 800,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.25,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 14,
        "escalation": 3,
        "taxRate": 33,
        "tenure": 10,
        "currency": "BDT",
        "dgFuelPassthrough": true,
        "gridElectricityPassthrough": true
      },
      "costs": {
        "materials": {
          "Battery Modules": 93473,
          "Rectifier Modules": 29728,
          "Rectifier Core 12kW": 96524,
          "Rectifier Core 24kW": 130376,
          "Rectifier Core 36kW": 130376,
          "Power Equipment Cabinet": 95700,
          "Battery Cabinet": 71000,
          "Extra Equipment Cabinet": 71000,
          "Solar Panels": 0,
          "Solar Charger Modules": 0,
          "Solar Expansion Subrack": 0,
          "Diesel Generator 15kVA": 0,
          "Diesel Generator 20kVA": 0,
          "Diesel Generator 25kVA": 0,
          "Diesel Generator 30kVA": 0,
          "Diesel Generator 40kVA": 0,
          "Diesel Generator 50kVA": 0,
          "Diesel Generator 60kVA": 0,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 35300,
          "ACDB": 102295
        },
        "installation": {
          "dcBaseService": 43450,
          "baseBatteryCapacity": 400,
          "additionalBatteryInstallPerAH": 0,
          "additionalCabinetInstall": 0,
          "solarPanelInstall": 20,
          "solarStructureInstall": 15,
          "solarStructureSupply": 50,
          "transportDC": 0,
          "transportSolar": 300,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 0,
          "dgPM": 150,
          "dgMinorOverhaul": 500,
          "dgMajorOverhaul": 2000,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 13.01,
          "fuelCostPerLiter": 0,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECBD_Good Grid(2 Outage, 3h): 3kW4H",
    "data": {
      "gridCondition": "Good",
      "dailyOutages": 2,
      "outageDuration": 3,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 3,
          "averageLoad": 3,
          "runningLoad": 3.39
        }
      ],
      "battery": {
        "backupHours": 4,
        "toleranceMargin": 20,
        "dod": 90,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": false,
        "operationMethod": "CDC",
        "phases": "1 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 80,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 50,
        "equipmentCabinetBatteryCapacity": 500,
        "batteryCabinetCapacity": 800,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.25,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 14,
        "escalation": 3,
        "taxRate": 33,
        "tenure": 10,
        "currency": "BDT",
        "dgFuelPassthrough": true,
        "gridElectricityPassthrough": true
      },
      "costs": {
        "materials": {
          "Battery Modules": 93473,
          "Rectifier Modules": 29728,
          "Rectifier Core 12kW": 96524,
          "Rectifier Core 24kW": 130376,
          "Rectifier Core 36kW": 130376,
          "Power Equipment Cabinet": 95700,
          "Battery Cabinet": 71000,
          "Extra Equipment Cabinet": 71000,
          "Solar Panels": 0,
          "Solar Charger Modules": 0,
          "Solar Expansion Subrack": 0,
          "Diesel Generator 15kVA": 0,
          "Diesel Generator 20kVA": 0,
          "Diesel Generator 25kVA": 0,
          "Diesel Generator 30kVA": 0,
          "Diesel Generator 40kVA": 0,
          "Diesel Generator 50kVA": 0,
          "Diesel Generator 60kVA": 0,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 35300,
          "ACDB": 102295
        },
        "installation": {
          "dcBaseService": 43450,
          "baseBatteryCapacity": 400,
          "additionalBatteryInstallPerAH": 0,
          "additionalCabinetInstall": 0,
          "solarPanelInstall": 20,
          "solarStructureInstall": 15,
          "solarStructureSupply": 50,
          "transportDC": 0,
          "transportSolar": 300,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 0,
          "dgPM": 150,
          "dgMinorOverhaul": 500,
          "dgMajorOverhaul": 2000,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 13.01,
          "fuelCostPerLiter": 0,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECBD_Poor Grid(2 Outage, 6h): 3kW4H",
    "data": {
      "gridCondition": "Poor",
      "dailyOutages": 2,
      "outageDuration": 6,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 3,
          "averageLoad": 3,
          "runningLoad": 3.39
        }
      ],
      "battery": {
        "backupHours": 4,
        "toleranceMargin": 20,
        "dod": 90,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": false,
        "operationMethod": "CDC",
        "phases": "1 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 80,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 50,
        "equipmentCabinetBatteryCapacity": 500,
        "batteryCabinetCapacity": 800,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.25,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 14,
        "escalation": 3,
        "taxRate": 33,
        "tenure": 10,
        "currency": "BDT",
        "dgFuelPassthrough": true,
        "gridElectricityPassthrough": true
      },
      "costs": {
        "materials": {
          "Battery Modules": 93473,
          "Rectifier Modules": 29728,
          "Rectifier Core 12kW": 96524,
          "Rectifier Core 24kW": 130376,
          "Rectifier Core 36kW": 130376,
          "Power Equipment Cabinet": 95700,
          "Battery Cabinet": 71000,
          "Extra Equipment Cabinet": 71000,
          "Solar Panels": 0,
          "Solar Charger Modules": 0,
          "Solar Expansion Subrack": 0,
          "Diesel Generator 15kVA": 0,
          "Diesel Generator 20kVA": 0,
          "Diesel Generator 25kVA": 0,
          "Diesel Generator 30kVA": 0,
          "Diesel Generator 40kVA": 0,
          "Diesel Generator 50kVA": 0,
          "Diesel Generator 60kVA": 0,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 35300,
          "ACDB": 102295
        },
        "installation": {
          "dcBaseService": 43450,
          "baseBatteryCapacity": 400,
          "additionalBatteryInstallPerAH": 0,
          "additionalCabinetInstall": 0,
          "solarPanelInstall": 20,
          "solarStructureInstall": 15,
          "solarStructureSupply": 50,
          "transportDC": 0,
          "transportSolar": 300,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 0,
          "dgPM": 150,
          "dgMinorOverhaul": 500,
          "dgMajorOverhaul": 2000,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 13.01,
          "fuelCostPerLiter": 0,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECBD_Bad Grid(2 Outage, 8h): 3kW4H",
    "data": {
      "gridCondition": "Bad",
      "dailyOutages": 2,
      "outageDuration": 8,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 3,
          "averageLoad": 3,
          "runningLoad": 3.39
        }
      ],
      "battery": {
        "backupHours": 4,
        "toleranceMargin": 20,
        "dod": 90,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": false,
        "operationMethod": "CDC",
        "phases": "1 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 80,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 50,
        "equipmentCabinetBatteryCapacity": 500,
        "batteryCabinetCapacity": 800,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.25,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 14,
        "escalation": 3,
        "taxRate": 33,
        "tenure": 10,
        "currency": "BDT",
        "dgFuelPassthrough": true,
        "gridElectricityPassthrough": true
      },
      "costs": {
        "materials": {
          "Battery Modules": 93473,
          "Rectifier Modules": 29728,
          "Rectifier Core 12kW": 96524,
          "Rectifier Core 24kW": 130376,
          "Rectifier Core 36kW": 130376,
          "Power Equipment Cabinet": 95700,
          "Battery Cabinet": 71000,
          "Extra Equipment Cabinet": 71000,
          "Solar Panels": 0,
          "Solar Charger Modules": 0,
          "Solar Expansion Subrack": 0,
          "Diesel Generator 15kVA": 0,
          "Diesel Generator 20kVA": 0,
          "Diesel Generator 25kVA": 0,
          "Diesel Generator 30kVA": 0,
          "Diesel Generator 40kVA": 0,
          "Diesel Generator 50kVA": 0,
          "Diesel Generator 60kVA": 0,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 35300,
          "ACDB": 102295
        },
        "installation": {
          "dcBaseService": 43450,
          "baseBatteryCapacity": 400,
          "additionalBatteryInstallPerAH": 0,
          "additionalCabinetInstall": 0,
          "solarPanelInstall": 20,
          "solarStructureInstall": 15,
          "solarStructureSupply": 50,
          "transportDC": 0,
          "transportSolar": 300,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 0,
          "dgPM": 150,
          "dgMinorOverhaul": 500,
          "dgMajorOverhaul": 2000,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 13.01,
          "fuelCostPerLiter": 0,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECPK_Bad Grid(4 Outage, 4h): 2.6kW4H",
    "data": {
      "gridCondition": "Bad",
      "dailyOutages": 4,
      "outageDuration": 4,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 2.6,
          "averageLoad": 2.6,
          "runningLoad": 2.6
        }
      ],
      "battery": {
        "backupHours": 4,
        "toleranceMargin": 20,
        "dod": 80,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": true,
        "operationMethod": "CDC",
        "phases": "3 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 80,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 0,
        "equipmentCabinetBatteryCapacity": 500,
        "batteryCabinetCapacity": 700,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.25,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 20,
        "escalation": 3,
        "taxRate": 9.6,
        "tenure": 10,
        "currency": "PKR",
        "dgFuelPassthrough": false,
        "gridElectricityPassthrough": false
      },
      "costs": {
        "materials": {
          "Battery Modules": 194040,
          "Rectifier Modules": 63084,
          "Rectifier Core 12kW": 286247,
          "Rectifier Core 24kW": 286247,
          "Rectifier Core 36kW": 286247,
          "Power Equipment Cabinet": 419400,
          "Battery Cabinet": 419400,
          "Extra Equipment Cabinet": 419400,
          "Solar Panels": 21350,
          "Solar Charger Modules": 94528,
          "Solar Expansion Subrack": 1,
          "Diesel Generator 15kVA": 2505000,
          "Diesel Generator 20kVA": 2505000,
          "Diesel Generator 25kVA": 3515038,
          "Diesel Generator 30kVA": 3515038,
          "Diesel Generator 40kVA": 3857974,
          "Diesel Generator 50kVA": 0,
          "Diesel Generator 60kVA": 0,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 224552,
          "ACDB": 0
        },
        "installation": {
          "dcBaseService": 195000,
          "baseBatteryCapacity": 0,
          "additionalBatteryInstallPerAH": 45000,
          "additionalCabinetInstall": 100000,
          "solarPanelInstall": 4880,
          "solarStructureInstall": 0,
          "solarStructureSupply": 0,
          "transportDC": 0,
          "transportSolar": 80000,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 122400,
          "dgPM": 0,
          "dgMinorOverhaul": 0,
          "dgMajorOverhaul": 0,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 47,
          "fuelCostPerLiter": 278,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECPK_Good Grid(2.5 Outage, 4h): 2.6kW4H",
    "data": {
      "gridCondition": "Good",
      "dailyOutages": 2.5,
      "outageDuration": 4,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 2.6,
          "averageLoad": 2.6,
          "runningLoad": 2.6
        }
      ],
      "battery": {
        "backupHours": 4,
        "toleranceMargin": 20,
        "dod": 80,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": false,
        "operationMethod": "CDC",
        "phases": "3 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 80,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 0,
        "equipmentCabinetBatteryCapacity": 500,
        "batteryCabinetCapacity": 700,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.25,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 20,
        "escalation": 3,
        "taxRate": 9.6,
        "tenure": 10,
        "currency": "PKR",
        "dgFuelPassthrough": false,
        "gridElectricityPassthrough": false
      },
      "costs": {
        "materials": {
          "Battery Modules": 194040,
          "Rectifier Modules": 63084,
          "Rectifier Core 12kW": 286247,
          "Rectifier Core 24kW": 286247,
          "Rectifier Core 36kW": 286247,
          "Power Equipment Cabinet": 419400,
          "Battery Cabinet": 419400,
          "Extra Equipment Cabinet": 419400,
          "Solar Panels": 21350,
          "Solar Charger Modules": 94528,
          "Solar Expansion Subrack": 1,
          "Diesel Generator 15kVA": 2505000,
          "Diesel Generator 20kVA": 2505000,
          "Diesel Generator 25kVA": 3515038,
          "Diesel Generator 30kVA": 3515038,
          "Diesel Generator 40kVA": 3857974,
          "Diesel Generator 50kVA": 0,
          "Diesel Generator 60kVA": 0,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 224552,
          "ACDB": 0
        },
        "installation": {
          "dcBaseService": 195000,
          "baseBatteryCapacity": 0,
          "additionalBatteryInstallPerAH": 45000,
          "additionalCabinetInstall": 100000,
          "solarPanelInstall": 4880,
          "solarStructureInstall": 0,
          "solarStructureSupply": 0,
          "transportDC": 0,
          "transportSolar": 80000,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 84000,
          "dgPM": 0,
          "dgMinorOverhaul": 0,
          "dgMajorOverhaul": 0,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 47,
          "fuelCostPerLiter": 278,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECPK_Off Grid(1 Outage, 24h): 2.6kW6H",
    "data": {
      "gridCondition": "Off-grid",
      "dailyOutages": 1,
      "outageDuration": 24,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 2.6,
          "averageLoad": 2.6,
          "runningLoad": 2.6
        }
      ],
      "battery": {
        "backupHours": 6,
        "toleranceMargin": 20,
        "dod": 80,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": false,
        "operationMethod": "CDC",
        "phases": "3 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 80,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 0,
        "equipmentCabinetBatteryCapacity": 500,
        "batteryCabinetCapacity": 700,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.25,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 20,
        "escalation": 3,
        "taxRate": 9.6,
        "tenure": 10,
        "currency": "PKR",
        "dgFuelPassthrough": false,
        "gridElectricityPassthrough": false
      },
      "costs": {
        "materials": {
          "Battery Modules": 194040,
          "Rectifier Modules": 63084,
          "Rectifier Core 12kW": 286247,
          "Rectifier Core 24kW": 286247,
          "Rectifier Core 36kW": 286247,
          "Power Equipment Cabinet": 419400,
          "Battery Cabinet": 419400,
          "Extra Equipment Cabinet": 419400,
          "Solar Panels": 21350,
          "Solar Charger Modules": 94528,
          "Solar Expansion Subrack": 1,
          "Diesel Generator 15kVA": 2505000,
          "Diesel Generator 20kVA": 2505000,
          "Diesel Generator 25kVA": 3515038,
          "Diesel Generator 30kVA": 3515038,
          "Diesel Generator 40kVA": 3857974,
          "Diesel Generator 50kVA": 0,
          "Diesel Generator 60kVA": 0,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 224552,
          "ACDB": 0
        },
        "installation": {
          "dcBaseService": 195000,
          "baseBatteryCapacity": 0,
          "additionalBatteryInstallPerAH": 45000,
          "additionalCabinetInstall": 100000,
          "solarPanelInstall": 4880,
          "solarStructureInstall": 0,
          "solarStructureSupply": 0,
          "transportDC": 0,
          "transportSolar": 80000,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 122400,
          "dgPM": 0,
          "dgMinorOverhaul": 0,
          "dgMajorOverhaul": 0,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 47,
          "fuelCostPerLiter": 278,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECPK_Poor Grid_DG(3 Outage, 4h): 2.6kW4H",
    "data": {
      "gridCondition": "Poor",
      "dailyOutages": 3,
      "outageDuration": 4,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 2.6,
          "averageLoad": 2.6,
          "runningLoad": 2.6
        }
      ],
      "battery": {
        "backupHours": 4,
        "toleranceMargin": 20,
        "dod": 80,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": true,
        "operationMethod": "CDC",
        "phases": "3 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 80,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 0,
        "equipmentCabinetBatteryCapacity": 500,
        "batteryCabinetCapacity": 700,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.25,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 20,
        "escalation": 3,
        "taxRate": 9.6,
        "tenure": 10,
        "currency": "PKR",
        "dgFuelPassthrough": false,
        "gridElectricityPassthrough": false
      },
      "costs": {
        "materials": {
          "Battery Modules": 194040,
          "Rectifier Modules": 63084,
          "Rectifier Core 12kW": 286247,
          "Rectifier Core 24kW": 286247,
          "Rectifier Core 36kW": 286247,
          "Power Equipment Cabinet": 419400,
          "Battery Cabinet": 419400,
          "Extra Equipment Cabinet": 419400,
          "Solar Panels": 21350,
          "Solar Charger Modules": 94528,
          "Solar Expansion Subrack": 1,
          "Diesel Generator 15kVA": 2505000,
          "Diesel Generator 20kVA": 2505000,
          "Diesel Generator 25kVA": 3515038,
          "Diesel Generator 30kVA": 3515038,
          "Diesel Generator 40kVA": 3857974,
          "Diesel Generator 50kVA": 0,
          "Diesel Generator 60kVA": 0,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 224552,
          "ACDB": 0
        },
        "installation": {
          "dcBaseService": 195000,
          "baseBatteryCapacity": 0,
          "additionalBatteryInstallPerAH": 45000,
          "additionalCabinetInstall": 100000,
          "solarPanelInstall": 4880,
          "solarStructureInstall": 0,
          "solarStructureSupply": 0,
          "transportDC": 0,
          "transportSolar": 80000,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 122400,
          "dgPM": 0,
          "dgMinorOverhaul": 0,
          "dgMajorOverhaul": 0,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 47,
          "fuelCostPerLiter": 278,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECPK_Poor Grid_NDG(2 Outage, 6h): 2.6kW6H",
    "data": {
      "gridCondition": "Poor",
      "dailyOutages": 3,
      "outageDuration": 4,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 2.6,
          "averageLoad": 2.6,
          "runningLoad": 2.6
        }
      ],
      "battery": {
        "backupHours": 6,
        "toleranceMargin": 20,
        "dod": 80,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": false,
        "operationMethod": "CDC",
        "phases": "3 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 80,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 0,
        "equipmentCabinetBatteryCapacity": 500,
        "batteryCabinetCapacity": 700,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.25,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 20,
        "escalation": 3,
        "taxRate": 9.6,
        "tenure": 10,
        "currency": "PKR",
        "dgFuelPassthrough": false,
        "gridElectricityPassthrough": false
      },
      "costs": {
        "materials": {
          "Battery Modules": 194040,
          "Rectifier Modules": 63084,
          "Rectifier Core 12kW": 286247,
          "Rectifier Core 24kW": 286247,
          "Rectifier Core 36kW": 286247,
          "Power Equipment Cabinet": 419400,
          "Battery Cabinet": 419400,
          "Extra Equipment Cabinet": 419400,
          "Solar Panels": 21350,
          "Solar Charger Modules": 94528,
          "Solar Expansion Subrack": 1,
          "Diesel Generator 15kVA": 2505000,
          "Diesel Generator 20kVA": 2505000,
          "Diesel Generator 25kVA": 3515038,
          "Diesel Generator 30kVA": 3515038,
          "Diesel Generator 40kVA": 3857974,
          "Diesel Generator 50kVA": 0,
          "Diesel Generator 60kVA": 0,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 224552,
          "ACDB": 0
        },
        "installation": {
          "dcBaseService": 195000,
          "baseBatteryCapacity": 0,
          "additionalBatteryInstallPerAH": 45000,
          "additionalCabinetInstall": 100000,
          "solarPanelInstall": 4880,
          "solarStructureInstall": 0,
          "solarStructureSupply": 0,
          "transportDC": 0,
          "transportSolar": 80000,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 122400,
          "dgPM": 0,
          "dgMinorOverhaul": 0,
          "dgMajorOverhaul": 0,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 47,
          "fuelCostPerLiter": 278,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECPH_Bad Grid G3(2 Outage, 6h): 6kW4H",
    "data": {
      "gridCondition": "Bad",
      "dailyOutages": 2,
      "outageDuration": 6,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 6,
          "averageLoad": 6,
          "runningLoad": 6
        }
      ],
      "battery": {
        "backupHours": 4,
        "toleranceMargin": 20,
        "dod": 80,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": true,
        "operationMethod": "CDC",
        "phases": "1 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 90,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 60,
        "equipmentCabinetBatteryCapacity": 700,
        "batteryCabinetCapacity": 800,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.2,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 9,
        "escalation": 3,
        "taxRate": 25,
        "tenure": 10,
        "currency": "PHP",
        "dgFuelPassthrough": true,
        "gridElectricityPassthrough": true
      },
      "costs": {
        "materials": {
          "Battery Modules": 27917,
          "Rectifier Modules": 10326,
          "Rectifier Core 12kW": 46838,
          "Rectifier Core 24kW": 46838,
          "Rectifier Core 36kW": 59478,
          "Power Equipment Cabinet": 55367,
          "Battery Cabinet": 63935,
          "Extra Equipment Cabinet": 55367,
          "Solar Panels": 28748,
          "Solar Charger Modules": 10760,
          "Solar Expansion Subrack": 0,
          "Diesel Generator 15kVA": 933697,
          "Diesel Generator 20kVA": 933697,
          "Diesel Generator 25kVA": 955669,
          "Diesel Generator 30kVA": 955669,
          "Diesel Generator 40kVA": 1028164,
          "Diesel Generator 50kVA": 1102681,
          "Diesel Generator 60kVA": 1142667,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 30429,
          "ACDB": 0
        },
        "installation": {
          "dcBaseService": 202165,
          "baseBatteryCapacity": 600,
          "additionalBatteryInstallPerAH": 0,
          "additionalCabinetInstall": 0,
          "solarPanelInstall": 38889,
          "solarStructureInstall": 0,
          "solarStructureSupply": 0,
          "transportDC": 0,
          "transportSolar": 150000,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 34800,
          "dgPM": 6620,
          "dgMinorOverhaul": 88000,
          "dgMajorOverhaul": 250000,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 13,
          "fuelCostPerLiter": 70,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECPH_Good Grid G1(1 Outage, 2h): 6kW4H",
    "data": {
      "gridCondition": "Good",
      "dailyOutages": 1,
      "outageDuration": 2,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 6,
          "averageLoad": 6,
          "runningLoad": 6
        }
      ],
      "battery": {
        "backupHours": 4,
        "toleranceMargin": 20,
        "dod": 80,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": false,
        "operationMethod": "CDC",
        "phases": "1 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 90,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 60,
        "equipmentCabinetBatteryCapacity": 700,
        "batteryCabinetCapacity": 800,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.1,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 9,
        "escalation": 3,
        "taxRate": 25,
        "tenure": 10,
        "currency": "PHP",
        "dgFuelPassthrough": true,
        "gridElectricityPassthrough": true
      },
      "costs": {
        "materials": {
          "Battery Modules": 27917,
          "Rectifier Modules": 10326,
          "Rectifier Core 12kW": 46838,
          "Rectifier Core 24kW": 46838,
          "Rectifier Core 36kW": 59478,
          "Power Equipment Cabinet": 55367,
          "Battery Cabinet": 63935,
          "Extra Equipment Cabinet": 55367,
          "Solar Panels": 28748,
          "Solar Charger Modules": 10760,
          "Solar Expansion Subrack": 0,
          "Diesel Generator 15kVA": 933697,
          "Diesel Generator 20kVA": 933697,
          "Diesel Generator 25kVA": 955669,
          "Diesel Generator 30kVA": 955669,
          "Diesel Generator 40kVA": 1028164,
          "Diesel Generator 50kVA": 1102681,
          "Diesel Generator 60kVA": 1142667,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 30429,
          "ACDB": 0
        },
        "installation": {
          "dcBaseService": 202165,
          "baseBatteryCapacity": 600,
          "additionalBatteryInstallPerAH": 0,
          "additionalCabinetInstall": 0,
          "solarPanelInstall": 38889,
          "solarStructureInstall": 0,
          "solarStructureSupply": 0,
          "transportDC": 0,
          "transportSolar": 150000,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 34800,
          "dgPM": 6620,
          "dgMinorOverhaul": 88000,
          "dgMajorOverhaul": 250000,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 13,
          "fuelCostPerLiter": 70,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECPH_Off Grid G5(1 Outage, 24h): 6kW4H",
    "data": {
      "gridCondition": "Off-grid",
      "dailyOutages": 1,
      "outageDuration": 24,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 6,
          "averageLoad": 6,
          "runningLoad": 6
        }
      ],
      "battery": {
        "backupHours": 4,
        "toleranceMargin": 20,
        "dod": 80,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": true,
        "operationMethod": "CDC",
        "phases": "1 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 90,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 60,
        "equipmentCabinetBatteryCapacity": 700,
        "batteryCabinetCapacity": 800,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.25,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 9,
        "escalation": 3,
        "taxRate": 25,
        "tenure": 10,
        "currency": "PHP",
        "dgFuelPassthrough": true,
        "gridElectricityPassthrough": true
      },
      "costs": {
        "materials": {
          "Battery Modules": 27917,
          "Rectifier Modules": 10326,
          "Rectifier Core 12kW": 46838,
          "Rectifier Core 24kW": 46838,
          "Rectifier Core 36kW": 59478,
          "Power Equipment Cabinet": 55367,
          "Battery Cabinet": 63935,
          "Extra Equipment Cabinet": 55367,
          "Solar Panels": 28748,
          "Solar Charger Modules": 10760,
          "Solar Expansion Subrack": 0,
          "Diesel Generator 15kVA": 933697,
          "Diesel Generator 20kVA": 933697,
          "Diesel Generator 25kVA": 955669,
          "Diesel Generator 30kVA": 955669,
          "Diesel Generator 40kVA": 1028164,
          "Diesel Generator 50kVA": 1102681,
          "Diesel Generator 60kVA": 1142667,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 30429,
          "ACDB": 0
        },
        "installation": {
          "dcBaseService": 202165,
          "baseBatteryCapacity": 600,
          "additionalBatteryInstallPerAH": 0,
          "additionalCabinetInstall": 0,
          "solarPanelInstall": 38889,
          "solarStructureInstall": 0,
          "solarStructureSupply": 0,
          "transportDC": 0,
          "transportSolar": 150000,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 34800,
          "dgPM": 6620,
          "dgMinorOverhaul": 88000,
          "dgMajorOverhaul": 250000,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 13,
          "fuelCostPerLiter": 70,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECPH_Poor Grid G2(1 Outage, 4h): 6kW4H",
    "data": {
      "gridCondition": "Poor",
      "dailyOutages": 1,
      "outageDuration": 4,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 6,
          "averageLoad": 6,
          "runningLoad": 6
        }
      ],
      "battery": {
        "backupHours": 4,
        "toleranceMargin": 20,
        "dod": 80,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": false,
        "operationMethod": "CDC",
        "phases": "1 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 90,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 60,
        "equipmentCabinetBatteryCapacity": 700,
        "batteryCabinetCapacity": 800,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.1,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 9,
        "escalation": 3,
        "taxRate": 25,
        "tenure": 10,
        "currency": "PHP",
        "dgFuelPassthrough": true,
        "gridElectricityPassthrough": true
      },
      "costs": {
        "materials": {
          "Battery Modules": 27917,
          "Rectifier Modules": 10326,
          "Rectifier Core 12kW": 46838,
          "Rectifier Core 24kW": 46838,
          "Rectifier Core 36kW": 59478,
          "Power Equipment Cabinet": 55367,
          "Battery Cabinet": 63935,
          "Extra Equipment Cabinet": 55367,
          "Solar Panels": 28748,
          "Solar Charger Modules": 10760,
          "Solar Expansion Subrack": 0,
          "Diesel Generator 15kVA": 933697,
          "Diesel Generator 20kVA": 933697,
          "Diesel Generator 25kVA": 955669,
          "Diesel Generator 30kVA": 955669,
          "Diesel Generator 40kVA": 1028164,
          "Diesel Generator 50kVA": 1102681,
          "Diesel Generator 60kVA": 1142667,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 30429,
          "ACDB": 0
        },
        "installation": {
          "dcBaseService": 202165,
          "baseBatteryCapacity": 600,
          "additionalBatteryInstallPerAH": 0,
          "additionalCabinetInstall": 0,
          "solarPanelInstall": 38889,
          "solarStructureInstall": 0,
          "solarStructureSupply": 0,
          "transportDC": 0,
          "transportSolar": 150000,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 34800,
          "dgPM": 6620,
          "dgMinorOverhaul": 88000,
          "dgMajorOverhaul": 250000,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 13,
          "fuelCostPerLiter": 70,
          "solarPM": 0
        }
      }
    }
  },
  {
    "name": "ECPH_Bad Grid G4(3 Outage, 6h): 6kW4H",
    "data": {
      "gridCondition": "Bad",
      "dailyOutages": 3,
      "outageDuration": 6,
      "numTenants": 1,
      "tenantLoads": [
        {
          "peakLoad": 6,
          "averageLoad": 6,
          "runningLoad": 6
        }
      ],
      "battery": {
        "backupHours": 4,
        "toleranceMargin": 20,
        "dod": 80,
        "ageing": 90,
        "moduleCapacity": 100,
        "ratedVoltage": 48,
        "maxUsefulLife": 7
      },
      "dg": {
        "enabled": true,
        "operationMethod": "CDC",
        "phases": "1 Phase",
        "maxLoadRateOffgrid": 80,
        "maxLoadRateOngrid": 90,
        "powerFactor": 0.8,
        "majorOverhaulHours": 12000,
        "minorOverhaulHours": 6000,
        "periodicMaintenanceHours": 500,
        "maxUsefulHours": 20000,
        "maxUsefulYears": 10,
        "pmPeriodMonths": 6
      },
      "remoteMonitoring": {
        "enabled": true,
        "maxUsefulLife": 7
      },
      "cabinet": {
        "fanPowerConsumption": 60,
        "equipmentCabinetBatteryCapacity": 700,
        "batteryCabinetCapacity": 800,
        "maxUsefulLife": 10,
        "additionalEquipmentCabinet": false,
        "additionalEquipmentCabinetCount": 0
      },
      "acdb": {
        "enabled": true,
        "maxUsefulLife": 10
      },
      "rectifier": {
        "moduleCapacity": 3,
        "efficiency": 96,
        "systemVoltage": 54,
        "batteryChargingRate": 0.2,
        "maxUsefulLife": 7,
        "slots": 9
      },
      "solar": {
        "enabled": false,
        "totalCapacity": 5,
        "panelCapacity": 620,
        "chargerModuleCapacity": 3,
        "yieldType": "efficiency_peak_hours",
        "annualYield": 1500,
        "overallEfficiency": 75,
        "annualPeakHours": 1664,
        "panelStructureMaxUsefulLife": 25,
        "rectifierMaxUsefulLife": 7
      },
      "modelling": {
        "multipleModels": true,
        "iterations": 8,
        "loadIncrement": 0.5,
        "solarIncrement": 0
      },
      "financials": {
        "wacc": 9,
        "escalation": 3,
        "taxRate": 25,
        "tenure": 10,
        "currency": "PHP",
        "dgFuelPassthrough": true,
        "gridElectricityPassthrough": true
      },
      "costs": {
        "materials": {
          "Battery Modules": 27917,
          "Rectifier Modules": 10326,
          "Rectifier Core 12kW": 46838,
          "Rectifier Core 24kW": 46838,
          "Rectifier Core 36kW": 59478,
          "Power Equipment Cabinet": 55367,
          "Battery Cabinet": 63935,
          "Extra Equipment Cabinet": 55367,
          "Solar Panels": 28748,
          "Solar Charger Modules": 10760,
          "Solar Expansion Subrack": 0,
          "Diesel Generator 15kVA": 933697,
          "Diesel Generator 20kVA": 933697,
          "Diesel Generator 25kVA": 955669,
          "Diesel Generator 30kVA": 955669,
          "Diesel Generator 40kVA": 1028164,
          "Diesel Generator 50kVA": 1102681,
          "Diesel Generator 60kVA": 1142667,
          "Diesel Generator 80kVA": 0,
          "Diesel Generator 100kVA": 0,
          "Diesel Generator 125kVA": 0,
          "Remote Monitoring Unit": 30429,
          "ACDB": 0
        },
        "installation": {
          "dcBaseService": 202165,
          "baseBatteryCapacity": 600,
          "additionalBatteryInstallPerAH": 0,
          "additionalCabinetInstall": 0,
          "solarPanelInstall": 38889,
          "solarStructureInstall": 0,
          "solarStructureSupply": 0,
          "transportDC": 0,
          "transportSolar": 150000,
          "siteSurvey": 0
        },
        "opex": {
          "annualPM": 34800,
          "dgPM": 6620,
          "dgMinorOverhaul": 88000,
          "dgMajorOverhaul": 250000,
          "fuelHaulingMonthly": 0,
          "gridTariffPerKWh": 13,
          "fuelCostPerLiter": 70,
          "solarPM": 0
        }
      }
    }
  }
];
