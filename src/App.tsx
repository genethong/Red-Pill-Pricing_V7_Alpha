import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Settings, 
  Battery, 
  Zap, 
  Sun, 
  Moon,
  Monitor, 
  Box, 
  Server, 
  Users, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Download, 
  Calculator,
  LayoutDashboard,
  FileText,
  AlertTriangle,
  ListChecks,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Activity,
  DollarSign,
  Upload,
  Save,
  FilePlus,
  Menu,
  Columns,
  GitCompare,
  Sparkles,
  Sliders,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { BLANK_INPUTS, TEMPLATES } from './templates';
import { 
  GridCondition, 
  SiteInputs, 
  BoQItem, 
  TenantLoad,
  DGOperationMethod
} from './types';
import { 
  initDB, 
  getSavedSession, 
  clearSession, 
  getUserProjects, 
  saveUserProject, 
  deleteUserProject, 
  getUserTemplates, 
  saveUserTemplate, 
  deleteUserTemplate, 
  getSystemTemplates,
  saveSystemTemplate,
  deleteSystemTemplate,
  User, 
  SavedProject, 
  SavedTemplate 
} from './lib/userDb';
import { LoginScreen } from './components/LoginScreen';
import { AdminPanel } from './components/AdminPanel';
import { NumericInput } from './components/NumericInput';
import { Button, Field, Toast } from './components/ui';
import type { ToastTone } from './components/ui';
import { calculateAllStats } from './lib/dcEngine';
import { LifeSimulationPanel } from './components/LifeSimulationPanel';
import { CHART_SERIES, chartAxis, chartGrid, chartTooltipLabelStyle, chartTooltipStyle } from './lib/chartTheme';

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

const INITIAL_INPUTS: SiteInputs = {
  gridCondition: 'Bad',
  dailyOutages: 3,
  outageDuration: 6,
  numTenants: 1,
  tenantLoads: [{ peakLoad: 5.2, averageLoad: 5.2, runningLoad: 5.2 }],
  battery: {
    backupHours: 6,
    toleranceMargin: 20,
    dod: 80,
    ageing: 90,
    moduleCapacity: 100,
    ratedVoltage: 48,
    maxUsefulLife: 7
  },
  dg: {
    enabled: true,
    operationMethod: 'CDC',
    phases: '1 Phase',
    maxLoadRateOffgrid: 80,
    maxLoadRateOngrid: 80,
    powerFactor: 0.8,
    majorOverhaulHours: 12000,
    minorOverhaulHours: 6000,
    periodicMaintenanceHours: 500,
    maxUsefulHours: 20000,
    maxUsefulYears: 10,
    pmPeriodMonths: 6
  },
  remoteMonitoring: {
    enabled: true,
    maxUsefulLife: 7
  },
  cabinet: {
    fanPowerConsumption: 60,
    equipmentCabinetBatteryCapacity: 500,
    batteryCabinetCapacity: 700,
    maxUsefulLife: 10,
    additionalEquipmentCabinet: false,
    additionalEquipmentCabinetCount: 0
  },
  acdb: {
    enabled: true,
    maxUsefulLife: 10
  },
  rectifier: {
    moduleCapacity: 3,
    efficiency: 96,
    systemVoltage: 54,
    batteryChargingRate: 0.25,
    maxUsefulLife: 7,
    slots: 6
  },
  solar: {
    enabled: false,
    totalCapacity: 5,
    panelCapacity: 620,
    chargerModuleCapacity: 3,
    yieldType: 'efficiency_peak_hours',
    annualYield: 1500,
    overallEfficiency: 75,
    annualPeakHours: 1664,
    panelStructureMaxUsefulLife: 25,
    rectifierMaxUsefulLife: 7
  },
  modelling: {
    multipleModels: false,
    iterations: 1,
    loadIncrement: 0.5,
    solarIncrement: 1
  },
  financials: {
    wacc: 12,
    escalation: 5,
    taxRate: 25,
    tenure: 10,
    currency: 'USD',
    dgFuelPassthrough: false,
    gridElectricityPassthrough: false
  },
  costs: {
    materials: {
      'Battery Modules': 250,
      'Rectifier Modules': 400,
      'Rectifier Core 12kW': 1500,
      'Rectifier Core 24kW': 2500,
      'Rectifier Core 36kW': 3500,
      'Power Equipment Cabinet': 2000,
      'Battery Cabinet': 1200,
      'Extra Equipment Cabinet': 1500,
      'Solar Panels': 150,
      'Solar Charger Modules': 350,
      'Solar Expansion Subrack': 800,
      'Diesel Generator 15kVA': 6000,
      'Diesel Generator 20kVA': 7000,
      'Diesel Generator 25kVA': 8000,
      'Diesel Generator 30kVA': 9000,
      'Diesel Generator 40kVA': 11000,
      'Diesel Generator 50kVA': 13000,
      'Diesel Generator 60kVA': 15000,
      'Diesel Generator 80kVA': 18000,
      'Diesel Generator 100kVA': 22000,
      'Diesel Generator 125kVA': 26000,
      'Remote Monitoring Unit': 500,
      'ACDB': 400,
    },
    installation: {
      dcBaseService: 1000,
      baseBatteryCapacity: 200,
      additionalBatteryInstallPerAH: 0.5,
      additionalCabinetInstall: 200,
      solarPanelInstall: 20,
      solarStructureInstall: 15,
      solarStructureSupply: 50,
      transportDC: 500,
      transportSolar: 300,
      siteSurvey: 400,
    },
    opex: {
      annualPM: 1200,
      dgPM: 150,
      dgMinorOverhaul: 500,
      dgMajorOverhaul: 2000,
      fuelHaulingMonthly: 100,
      gridTariffPerKWh: 0.15,
      fuelCostPerLiter: 1.2,
      solarPM: 500,
    }
  }
};

const BOQ_SORT_ORDER = [
  'Battery Modules',
  'Rectifier Modules',
  'Rectifier Core 12kW',
  'Rectifier Core 24kW',
  'Rectifier Core 36kW',
  'Solar Panels',
  'Solar Charger Modules',
  'Solar Expansion Subrack',
  'Diesel Generator 15kVA',
  'Diesel Generator 20kVA',
  'Diesel Generator 25kVA',
  'Diesel Generator 30kVA',
  'Diesel Generator 40kVA',
  'Diesel Generator 50kVA',
  'Diesel Generator 60kVA',
  'Diesel Generator 80kVA',
  'Diesel Generator 100kVA',
  'Diesel Generator 125kVA',
  'Power Equipment Cabinet',
  'Battery Cabinet',
  'Extra Equipment Cabinet',
  'Remote Monitoring Unit',
  'ACDB',
  'Solar Panel Structures + Footing',
  'DC Installation Service',
  'Installation of Solar Panels',
  'Installation of Panel Structures',
  'Transport & Mobilisation (DC)',
  'Transport & Mobilisation (Solar)',
  'Site Survey & Mobilisation'
];

const CostTooltip = ({ content, children }: { content: string; children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 px-[var(--space-3)] py-[var(--space-2)] min-w-[200px] pointer-events-none rounded-[var(--radius-element)] bg-[var(--material-thick-fill)] backdrop-blur-[var(--material-blur-thick)] shadow-[var(--glass-highlight),var(--shadow-menu)]"
        >
          <p className="text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line)] font-semibold text-[var(--tint)] mb-1">Cost derivation</p>
          <p className="text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] text-[var(--label)] whitespace-pre-line">{content}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[var(--bg-elevated)]" />
        </motion.div>
      )}
    </div>
  );
};

export default function App() {
  // Initialize user Db and session
  React.useEffect(() => {
    initDB();
  }, []);

  const [currentUser, setCurrentUser] = useState<User | null>(() => getSavedSession());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('isDarkMode');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    } catch (e) {
      console.warn('Failed to write theme to localStorage', e);
    }
  }, [isDarkMode]);

  const [showAdminTab, setShowAdminTab] = useState(false);
  const [comparedProjects, setComparedProjects] = useState<{ id: string; name: string; data: SiteInputs }[]>([]);
  const [selectedModelForProject, setSelectedModelForProject] = useState<Record<string, number>>({});
  const [optimizedProject, setOptimizedProject] = useState<{ id: string; name: string; data: SiteInputs } | null>(null);
  const [selectedOptimizationOptionIndex, setSelectedOptimizationOptionIndex] = useState<number | null>(null);
  const [newOptimizedProjectName, setNewOptimizedProjectName] = useState<string>("");
  const [showSaveOptimizedModal, setShowSaveOptimizedModal] = useState(false);
  const [userDbTemplates, setUserDbTemplates] = useState<SavedTemplate[]>([]);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const notify = React.useCallback((message: string, tone: ToastTone = 'info') => {
    setToast({ message, tone });
  }, []);
  const dismissToast = React.useCallback(() => setToast(null), []);
  const [committedSnapshot, setCommittedSnapshot] = useState(() => JSON.stringify(INITIAL_INPUTS));
  const [pendingOpen, setPendingOpen] = useState<{ name: string; data: SiteInputs } | null>(null);
  const [showReplaceSheet, setShowReplaceSheet] = useState(false);

  const [showSaveTemplateDbModal, setShowSaveTemplateDbModal] = useState(false);
  const [saveTemplateDbName, setSaveTemplateDbName] = useState("");
  const [templateIdToDeleteConfirm, setTemplateIdToDeleteConfirm] = useState<string | null>(null);
  const [systemTemplates, setSystemTemplates] = useState<{ name: string; data: SiteInputs }[]>([]);
  const [saveAsSystem, setSaveAsSystem] = useState(false);

  React.useEffect(() => {
    setSystemTemplates(getSystemTemplates());
  }, []);

  // Load user templates when user changes
  React.useEffect(() => {
    if (currentUser) {
      setUserDbTemplates(getUserTemplates(currentUser.username));
    } else {
      setUserDbTemplates([]);
      setShowAdminTab(false);
    }
  }, [currentUser]);

  const refreshUserDbData = () => {
    if (currentUser) {
      setUserDbTemplates(getUserTemplates(currentUser.username));
    }
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setIsUserDropdownOpen(false);
  };

  const handleSaveTemplateToDb = (templateName: string) => {
    if (!currentUser) return;
    if (currentUser.role === 'admin' && saveAsSystem) {
      saveSystemTemplate(templateName, inputs);
      setSystemTemplates(getSystemTemplates());
    } else {
      saveUserTemplate(currentUser.username, templateName, inputs);
      refreshUserDbData();
    }
    setCurrentTemplateName(templateName);
    setShowSaveTemplateDbModal(false);
    setSaveTemplateDbName("");
    setSaveAsSystem(false);
    setCommittedSnapshot(JSON.stringify(inputs));
    notify(`Saved “${templateName}”.`, 'success');
    if (pendingOpen) {
      const next = pendingOpen;
      setPendingOpen(null);
      setShowReplaceSheet(false);
      setInputs(next.data);
      setCurrentTemplateName(next.name);
      setCurrentStep(1);
      setActiveSection('grid');
      setCommittedSnapshot(JSON.stringify(next.data));
      notify(`Opened “${next.name}”.`, 'success');
    }
  };

  const handleDeleteTemplateFromDb = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteUserTemplate(id);
    refreshUserDbData();
    if (templateIdToDeleteConfirm === id) {
      setTemplateIdToDeleteConfirm(null);
    }
  };

  const handleUploadCustomTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parsed = JSON.parse(fileContent);
        // Supports nested .data structure or raw object
        const templateData = parsed.data || parsed;
        const templateName = parsed.name || file.name.replace(".json", "");
        
        saveUserTemplate(currentUser.username, templateName, templateData);
        refreshUserDbData();
        notify(`Imported “${templateName}”.`, 'success');
      } catch (err) {
        notify("Couldn’t read that file. Use a project JSON.", 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const [inputs, setInputs] = useState<SiteInputs>(INITIAL_INPUTS);
  const [currentTemplateName, setCurrentTemplateName] = useState<string>("ECBD_Good Grid(1 Outage, 2h): 3kW4H");
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [activeSection, setActiveSection] = useState<string>('grid');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filename prompt states
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptTitle, setPromptTitle] = useState("");
  const [promptDefaultValue, setPromptDefaultValue] = useState("");
  const [promptInputValue, setPromptInputValue] = useState("");
  const [promptOnConfirm, setPromptOnConfirm] = useState<((val: string) => void) | null>(null);

  const requestFilename = (title: string, defaultName: string, onConfirm: (val: string) => void) => {
    setPromptTitle(title);
    setPromptDefaultValue(defaultName);
    setPromptInputValue(defaultName);
    setPromptOnConfirm(() => onConfirm);
    setPromptOpen(true);
  };

  // Excel Export Support
  const exportToXLS = (filename: string, tables: { title?: string; headers: string[]; rows: any[][] }[]) => {
    let html = `
      <html xmlns:o="urn:schemas-microsoft-excel:office:excel" xmlns:x="urn:schemas-microsoft-excel:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Sheet1</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; margin-bottom: 20px; }
          td, th { border: 1px solid #dddddd; text-align: left; padding: 8px; }
          th { background-color: #ef4444; color: white !important; font-weight: bold; }
          .title-text { font-size: 16px; font-weight: bold; color: #ef4444; padding-bottom: 10px; font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
    `;

    tables.forEach(table => {
      if (table.title) {
        html += `<div class="title-text">${table.title}</div>`;
      }
      html += '<table>';
      if (table.headers && table.headers.length > 0) {
        html += '<thead><tr>';
        table.headers.forEach(h => {
          html += `<th>${h || ''}</th>`;
        });
        html += '</tr></thead>';
      }
      html += '<tbody>';
      table.rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
          const val = cell !== undefined && cell !== null ? String(cell) : '';
          html += `<td>${val}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table><br/>';
    });

    html += '</body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", filename.endsWith('.xls') ? filename : `${filename}.xls`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
  };

  // PDF Export Helper
  const exportToPDF = (filename: string, documentTitle: string, tables: { title?: string; headers: string[]; rows: any[][] }[]) => {
    const doc = new jsPDF();
    
    // Document Title
    doc.setFontSize(16);
    doc.setTextColor(239, 68, 68); // Red-500
    doc.text(documentTitle, 14, 15);
    
    let currentY = 22;

    tables.forEach((table, index) => {
      if (index > 0) {
        currentY += 10;
        if (currentY > 260) {
          doc.addPage();
          currentY = 15;
        }
      }

      if (table.title) {
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text(table.title, 14, currentY);
        currentY += 5;
      }

      autoTable(doc, {
        startY: currentY,
        head: table.headers ? [table.headers] : undefined,
        body: table.rows,
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY;
    });

    doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  };

  // Gather Data Helpers
  const getOperationalAnalysisData = () => {
    const models = modellingResults;
    const headers = ['Operational Metric', ...models.map(m => {
      const loadText = `${m.totalAverageLoad?.toFixed(1)} kW`;
      const solarVal = m.actualSolarCapacity ?? 0;
      return solarVal > 0 ? `${m.name} (${loadText} / ${solarVal.toFixed(1)} kWp)` : `${m.name} (${loadText})`;
    })];
    const rows: any[][] = [];

    // Battery Health Metrics
    rows.push(['BATTERY HEALTH', ...models.map(() => '')]);
    rows.push(['DC Running Current (A)', ...models.map(m => m.rectifierStats.dcRunningCurrent?.toFixed(2))]);
    rows.push(['Actual DoD (%)', ...models.map(m => `${m.rectifierStats.actualDoD}%`)]);
    rows.push(['Battery Autonomy (at DoD) (h)', ...models.map(m => m.rectifierStats.batteryRunningHourPerCycle?.toFixed(2))]);
    rows.push(['Battery Cycles per Day', ...models.map(m => {
      let val = m.rectifierStats.batteryCyclesPerDay?.toFixed(3);
      if (m.rectifierStats.isMonteCarlo) val += ' (Monte Carlo)';
      return val;
    })]);
    rows.push(['Available Cycles (Li-ion)', ...models.map(m => m.rectifierStats.batteryCycles?.toLocaleString())]);
    rows.push(['Battery Usage per Hour (%)', ...models.map(m => `${(m.rectifierStats.batteryUsagePerHourAH * 100)?.toFixed(2)}%`)]);

    rows.push(['DC AVAILABILITY', ...models.map(() => '')]);
    rows.push(['DC Availability (%)', ...models.map(m => `${(m.rectifierStats.dcAvailabilityPct ?? 100).toFixed(2)}%`)]);
    rows.push(['Grid Outage (h/day)', ...models.map(m => (m.rectifierStats.dailyOutageHours ?? 0).toFixed(2))]);
    rows.push(['Residual Unserved Outage (h/day)', ...models.map(m => (m.rectifierStats.dailyUnservedHours ?? 0).toFixed(2))]);
    rows.push(['Residual Unserved Outage (h/year)', ...models.map(m => ((m.rectifierStats.dailyUnservedHours ?? 0) * 365).toFixed(0))]);

    // DG Metrics
    if (inputs.dg.enabled) {
      rows.push(['DG OPERATION', ...models.map(() => '')]);
      rows.push(['DG Running Hours/Day (h)', ...models.map(m => {
        let val = m.rectifierStats.dgRunningHoursPerDay?.toFixed(2);
        if (m.rectifierStats.isMonteCarlo) val += ' (Monte Carlo)';
        return val;
      })]);
      rows.push(['Daily Fuel Consumption (L)', ...models.map(m => m.rectifierStats.dgDailyFuel?.toFixed(2))]);
      rows.push(['CDC per Day', ...models.map(m => m.rectifierStats.cdcPerDay?.toFixed(2))]);
      rows.push(['DG Load Rate (%)', ...models.map(m => `${m.rectifierStats.dgLoadRate?.toFixed(1)}%`)]);
      rows.push(['Fuel Rate (L/kWh)', ...models.map(m => m.rectifierStats.dgFuelRate?.toFixed(3))]);
    }

    // Solar Metrics
    if (inputs.solar.enabled) {
      rows.push(['SOLAR PERFORMANCE', ...models.map(() => '')]);
      rows.push(['Panel Quantity', ...models.map(m => m.rectifierStats.solarPanelQuantity)]);
      rows.push(['Actual Capacity (kWp)', ...models.map(m => m.rectifierStats.actualSolarCapacity?.toFixed(2))]);
      rows.push(['Solar Charger Modules', ...models.map(m => m.rectifierStats.solarChargerModuleQuantity)]);
      rows.push(['Solar Expansion Subrack', ...models.map(m => m.rectifierStats.solarExpansionSubrackQty)]);
      rows.push(['Daily Generation (kWh)', ...models.map(m => m.rectifierStats.dailySolarGeneration?.toFixed(2))]);
      rows.push(['Daily Excess Solar (kWh)', ...models.map(m => m.rectifierStats.dailyExcessSolarKW?.toFixed(2))]);
      rows.push(['Solar Max Charging Rate (C)', ...models.map(m => m.rectifierStats.solarMaxChargingRate?.toFixed(3))]);
    }

    // Energy Mix & Daily Generation
    rows.push(['DAILY ENERGY MIX & COMPUTED KWH (ESTIMATION ONLY)', ...models.map(() => '')]);
    rows.push(['Grid Daily Energy (kWh)', ...models.map(m => m.rectifierStats.dailyGridEnergy?.toFixed(2))]);
    rows.push(['Grid Mix (%)', ...models.map(m => {
      const grid = m.rectifierStats.dailyGridEnergy || 0;
      const dg = m.rectifierStats.dgDailyEnergyGeneration || 0;
      const solar = m.rectifierStats.dailySolarEnergy || 0;
      const total = grid + dg + solar;
      return total > 0 ? `${((grid / total) * 100).toFixed(1)}%` : '0.0%';
    })]);
    rows.push(['DG Daily Energy (kWh)', ...models.map(m => m.rectifierStats.dgDailyEnergyGeneration?.toFixed(2))]);
    rows.push(['DG Mix (%)', ...models.map(m => {
      const grid = m.rectifierStats.dailyGridEnergy || 0;
      const dg = m.rectifierStats.dgDailyEnergyGeneration || 0;
      const solar = m.rectifierStats.dailySolarEnergy || 0;
      const total = grid + dg + solar;
      return total > 0 ? `${((dg / total) * 100).toFixed(1)}%` : '0.0%';
    })]);
    rows.push(['Solar Daily Energy (kWh)', ...models.map(m => m.rectifierStats.dailySolarEnergy?.toFixed(2))]);
    rows.push(['Solar Mix (%)', ...models.map(m => {
      const grid = m.rectifierStats.dailyGridEnergy || 0;
      const dg = m.rectifierStats.dgDailyEnergyGeneration || 0;
      const solar = m.rectifierStats.dailySolarEnergy || 0;
      const total = grid + dg + solar;
      return total > 0 ? `${((solar / total) * 100).toFixed(1)}%` : '0.0%';
    })]);

    // System Capacity
    rows.push(['SYSTEM CAPACITY', ...models.map(() => '')]);
    rows.push(['Adjusted Battery Capacity (AH)', ...models.map(m => m.rectifierStats.adjustedBatteryCapacityAH)]);
    rows.push(['Total Rectifier Load (kW)', ...models.map(m => m.rectifierStats.totalRectifierLoadKW?.toFixed(2))]);
    rows.push(['Required DG Rating (kVA)', ...models.map(m => m.rectifierStats.requiredDGKva?.toFixed(2))]);
    rows.push(['Required Core Slots', ...models.map(m => m.rectifierStats.rectifierModules + (inputs.solar.enabled ? m.rectifierStats.solarChargerModuleQuantity : 0))]);

    return { headers, rows };
  };

  const getBOQData = () => {
    const models = modellingResults;
    const itemNames = Array.from(new Set(models.flatMap(r => r.boq.map(b => b.item))))
      .sort((a: string, b: string) => {
        const indexA = BOQ_SORT_ORDER.indexOf(a);
        const indexB = BOQ_SORT_ORDER.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

    const headers = ['Item Description', `Unit Cost (${inputs.financials.currency})`];
    models.forEach(model => {
      const loadText = `${model.totalAverageLoad?.toFixed(1)} kW`;
      const solarVal = model.actualSolarCapacity ?? 0;
      const specs = solarVal > 0 ? `${loadText}, ${solarVal.toFixed(1)} kWp` : loadText;
      headers.push(`${model.name} Qty (${specs})`, `${model.name} Total (${inputs.financials.currency})`, `${model.name} Life`);
    });

    const rows: any[][] = [];
    itemNames.forEach(itemName => {
      const firstItem = models.find(r => r.boq.some(b => b.item === itemName))?.boq.find(b => b.item === itemName);
      const row = [
        itemName,
        firstItem?.unitCost?.toLocaleString() || '0'
      ];
      models.forEach(model => {
        const modelItem = model.boq.find(b => b.item === itemName);
        row.push(
          modelItem ? `${modelItem.quantity} ${modelItem.unit}` : '0',
          modelItem ? modelItem.total?.toLocaleString() : '0',
          modelItem ? `${modelItem.lifespan}Y` : '0'
        );
      });
      rows.push(row);
    });

    // Add Total Capex
    const totalRow = ['Total CAPEX', ''];
    models.forEach(model => {
      totalRow.push('', model.initialCapex?.toLocaleString(), '');
    });
    rows.push(totalRow);

    return { headers, rows };
  };

  const getOpexData = () => {
    const models = modellingResults;
    const opexNames = Array.from(new Set(models.flatMap(r => r.opexItemsYear1.map(o => o.name))));
    const headers = ['Expense Item', ...models.map(m => {
      const loadText = `${m.totalAverageLoad?.toFixed(1)} kW`;
      const solarVal = m.actualSolarCapacity ?? 0;
      const specs = solarVal > 0 ? `${loadText} / ${solarVal.toFixed(1)} kWp` : loadText;
      return `${m.name} (${specs}) (${inputs.financials.currency})`;
    })];
    
    const rows: any[][] = [];
    opexNames.forEach(opexName => {
      const row = [opexName];
      models.forEach(model => {
        const opexItem = model.opexItemsYear1.find(o => o.name === opexName);
        row.push(opexItem ? opexItem.cost?.toLocaleString() : '0');
      });
      rows.push(row);
    });

    const totalRow = ['TOTAL ANNUAL OPEX'];
    models.forEach(model => {
      totalRow.push(model.cashFlows[1].opex?.toLocaleString());
    });
    rows.push(totalRow);

    return { headers, rows };
  };

  const getTransposedFinancialModelData = () => {
    const models = modellingResults;
    const tables: { title?: string; headers: string[]; rows: any[][] }[] = [];
    const currency = inputs.financials.currency;

    // 1. Financial Parameters & Key Comparison Table
    const paramHeaders = ['Financial Parameter / Key Metric', ...models.map(m => {
      const loadText = `${m.totalAverageLoad?.toFixed(1)} kW`;
      const solarVal = m.actualSolarCapacity ?? 0;
      return solarVal > 0 ? `${m.name} (${loadText} / ${solarVal.toFixed(1)} kWp)` : `${m.name} (${loadText})`;
    })];
    const paramRows: any[][] = [
      ['WACC (%)', ...models.map(() => `${inputs.financials.wacc}%`)],
      ['Annual Escalation (%)', ...models.map(() => `${inputs.financials.escalation}%`)],
      ['Tax Rate (%)', ...models.map(() => `${inputs.financials.taxRate}%`)],
      ['Contract Tenure (Years)', ...models.map(() => inputs.financials.tenure)],
      ['DG Fuel Passthrough', ...models.map(() => inputs.financials.dgFuelPassthrough ? 'Yes' : 'No')],
      ['Grid Electricity Passthrough', ...models.map(() => inputs.financials.gridElectricityPassthrough ? 'Yes' : 'No')],
      ['KEY RESULTS / METRICS', ...models.map(() => '')], // Section divider
      ['Initial CAPEX', ...models.map(m => `${currency} ${m.initialCapex.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)],
      ['Breakeven MRR', ...models.map(m => `${currency} ${m.breakevenMRR.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)],
      ['NPV (Outflows)', ...models.map(m => `${currency} ${m.npv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)],
      ['LCOE', ...models.map(m => `${currency} ${m.lcoe?.toFixed(3)}/kWh`)],
    ];

    tables.push({
      title: "Financial Parameters & Comparative Model Summary",
      headers: paramHeaders,
      rows: paramRows
    });

    // 2. Transposed Cash Flow Projection for ALL models
    models.forEach(model => {
      const tenure = inputs.financials.tenure;
      
      // Headers: Year 0 to Year tenure
      const headers = ['Cost Category / Item'];
      for (let y = 0; y <= tenure; y++) {
        headers.push(`Year ${y}`);
      }

      // Capture unique capex and opex item names
      const capexNames = Array.from(new Set(
        model.cashFlows.flatMap((cf: any) => (cf.details?.capexItems || []).map((item: any) => item.name))
      ));
      const opexNames = Array.from(new Set(
        model.cashFlows.flatMap((cf: any) => (cf.details?.opexItems || []).map((item: any) => item.name))
      ));

      const rows: any[][] = [];

      // CAPEX Section
      rows.push(['CAPEX Cost Items', ...model.cashFlows.map(() => '')]);
      capexNames.forEach(name => {
        const row = [
          `  ${name}`,
          ...model.cashFlows.map((cf: any) => {
            const found = cf.details?.capexItems?.find((item: any) => item.name === name);
            return found ? Math.round(found.cost).toLocaleString() : '0';
          })
        ];
        rows.push(row);
      });
      // Add Total CAPEX Row
      rows.push([
        'Total CAPEX',
        ...model.cashFlows.map((cf: any) => Math.round(cf.capex).toLocaleString())
      ]);

      // OPEX Section
      rows.push(['OPEX Cost Items', ...model.cashFlows.map(() => '')]);
      opexNames.forEach(name => {
        const row = [
          `  ${name}`,
          ...model.cashFlows.map((cf: any) => {
            const found = cf.details?.opexItems?.find((item: any) => item.name === name);
            return found ? Math.round(found.cost).toLocaleString() : '0';
          })
        ];
        rows.push(row);
      });
      // Add Total OPEX & Fuel Row
      rows.push([
        'Total OPEX & Fuel',
        ...model.cashFlows.map((cf: any) => Math.round((cf.opex || 0) + (cf.fuel || 0)).toLocaleString())
      ]);

      // Net Outflow
      rows.push([
        'Total Net Outflow',
        ...model.cashFlows.map((cf: any) => Math.round(cf.totalOutflow).toLocaleString())
      ]);

      tables.push({
        title: `${model.name} - Transposed Outflows Cash Flow Projection (${currency})`,
        headers: headers,
        rows: rows
      });
    });

    return tables;
  };

  const handleExportFinancialModelXLS = () => {
    const defaultName = `Financial_Model_Cash_Flows_${new Date().toISOString().split('T')[0]}`;
    requestFilename("Export Financial Model Transposed", defaultName, (filename) => {
      const tables = getTransposedFinancialModelData();
      exportToXLS(filename, tables);
    });
  };

  // Export event handlers
  const handleExportOperationXLS = () => {
    const defaultName = `Operational_Analysis_${new Date().toISOString().split('T')[0]}`;
    requestFilename("Export Operational Analysis Excel", defaultName, (filename) => {
      const data = getOperationalAnalysisData();
      exportToXLS(filename, [
        {
          title: "System Operational Performance Comparison Metrics",
          headers: data.headers,
          rows: data.rows
        }
      ]);
    });
  };

  const handleExportOperationPDF = () => {
    const defaultName = `Operational_Analysis_${new Date().toISOString().split('T')[0]}`;
    requestFilename("Export Operational Analysis PDF", defaultName, (filename) => {
      const data = getOperationalAnalysisData();
      exportToPDF(filename, "System Operational Performance Metrics", [
        {
          title: "Comparison Summary",
          headers: data.headers,
          rows: data.rows
        }
      ]);
    });
  };

  const handleExportBOQXLS = () => {
    const defaultName = `Bill_of_Quantities_${new Date().toISOString().split('T')[0]}`;
    requestFilename("Export BOQ Excel", defaultName, (filename) => {
      const data = getBOQData();
      exportToXLS(filename, [
        {
          title: "Multi-Model Bill of Quantities (CAPEX Table)",
          headers: data.headers,
          rows: data.rows
        }
      ]);
    });
  };

  const handleExportBOQPDF = () => {
    const defaultName = `Bill_of_Quantities_${new Date().toISOString().split('T')[0]}`;
    requestFilename("Export BOQ PDF", defaultName, (filename) => {
      const data = getBOQData();
      exportToPDF(filename, "Multi-Model Bill of Quantities", [
        {
          title: "Equipment List and Initial CAPEX Comparison",
          headers: data.headers,
          rows: data.rows
        }
      ]);
    });
  };

  const handleExportOpexXLS = () => {
    const defaultName = `Annual_Operating_Expenses_${new Date().toISOString().split('T')[0]}`;
    requestFilename("Export OPEX Excel", defaultName, (filename) => {
      const data = getOpexData();
      exportToXLS(filename, [
        {
          title: "Annual Operating Expenses (Year 1 OPEX Table)",
          headers: data.headers,
          rows: data.rows
        }
      ]);
    });
  };

  const handleExportOpexPDF = () => {
    const defaultName = `Annual_Operating_Expenses_${new Date().toISOString().split('T')[0]}`;
    requestFilename("Export OPEX PDF", defaultName, (filename) => {
      const data = getOpexData();
      exportToPDF(filename, "Annual Operating Expenses (Year 1)", [
        {
          title: "Operating Expenses Comparison List (Year 1 Summary)",
          headers: data.headers,
          rows: data.rows
        }
      ]);
    });
  };

  const handleExportReportXLS = () => {
    const defaultName = `RedPill_Financial_Report_${new Date().toISOString().split('T')[0]}`;
    requestFilename("Export Report Excel", defaultName, (filename) => {
      const tables: { title?: string; headers: string[]; rows: any[][] }[] = [];
      const currency = inputs.financials.currency;

      // Executive Summary Table
      const summaryHeaders = ['Model Name', 'Total Load', `Initial CAPEX (${currency})`, `Breakeven MRR (${currency})`, `MRR Variance (${currency})`, `LCOE (${currency}/kWh)`];
      const summaryRows = modellingResults ? modellingResults.map(res => {
        const loadText = `${res.totalAverageLoad?.toFixed(1)} kW`;
        const solarVal = res.actualSolarCapacity ?? 0;
        const nameWithSpecs = solarVal > 0 ? `${res.name} (${loadText} / ${solarVal.toFixed(1)} kWp)` : `${res.name} (${loadText})`;
        return [
          nameWithSpecs,
          loadText,
          res.initialCapex?.toLocaleString() || '0',
          res.breakevenMRR?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0',
          (res.mrrVariance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }),
          res.lcoe?.toFixed(2) || '0'
        ];
      }) : [[
        'Model 1',
        `${financialStats.totalAverageLoad?.toFixed(1)} kW`,
        financialStats.initialCapex?.toLocaleString() || '0',
        financialStats.breakevenMRR?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0',
        '0',
        financialStats.lcoe?.toFixed(2) || '0'
      ]];

      tables.push({
        title: "Model Comparison Summary",
        headers: summaryHeaders,
        rows: summaryRows
      });

      // Individual Model Details
      const modelsToExport = modellingResults || [{ name: 'Model 1', ...financialStats }];
      modelsToExport.forEach(model => {
        tables.push({
          title: `Model Detail: ${model.name} Overview`,
          headers: ['Metric', 'Value'],
          rows: [
            ['Initial CAPEX', `${currency} ${model.initialCapex?.toLocaleString()}`],
            ['Breakeven MRR', `${currency} ${model.breakevenMRR?.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
            ['Levelized Cost of Energy (LCOE)', `${currency} ${model.lcoe?.toFixed(2)} / kWh`],
            ['Total Average Load', `${model.totalAverageLoad?.toFixed(2)} kW`],
            ['Battery Backup', `${model.rectifierStats?.batteryBackupHours} Hours`],
            ['Solar PV Capacity', `${model.rectifierStats?.actualSolarCapacity?.toFixed(1)} kWp`],
            ['DG Requirement', `${model.rectifierStats?.requiredDGKva?.toFixed(1)} kVA`],
            ['Annual Energy Load', `${(model.totalAverageLoad * 24 * 365)?.toLocaleString()} kWh`]
          ]
        });

        tables.push({
          title: `${model.name} Bill of Quantities (CAPEX)`,
          headers: ['Item Description', 'Qty', 'Unit', 'Unit Cost', 'Total Cost'],
          rows: model.boq.map(item => [
            item.item,
            item.quantity,
            item.unit,
            `${currency} ${item.unitCost.toLocaleString()}`,
            `${currency} ${item.total.toLocaleString()}`
          ])
        });

        tables.push({
          title: `${model.name} Operating Expenses (Annual OPEX - Year 1)`,
          headers: ['Expense Item', 'Frequency', 'Annual Cost'],
          rows: model.cashFlows[1].details.opexItems.map(item => [
            item.name,
            'Annual',
            `${currency} ${item.cost.toLocaleString()}`
          ])
        });
      });

      exportToXLS(filename, tables);
    });
  };

  const triggerExportReportPDF = () => {
    const defaultName = `RedPill_Design_Report_${new Date().toISOString().split('T')[0]}`;
    requestFilename("Export Report PDF", defaultName, (filename) => {
      handleExportPDF(filename);
    });
  };

  const handleNumericInput = (value: string, setter: (val: number | null) => void) => {
    if (value === '') {
      setter(null);
      return;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setter(parsed);
    }
  };

  const STEPS = [
    { id: 1, name: 'Site & load', icon: MapPin, sections: ['grid', 'tenant'] },
    { id: 2, name: 'Power system', icon: Zap, sections: ['battery', 'rectifier', 'solar', 'dg', 'cabinet', 'monitoring'] },
    { id: 3, name: 'Modelling', icon: Calculator, sections: ['modelling'] },
    { id: 4, name: 'Operations', icon: Activity, sections: ['operation'] },
    { id: 5, name: 'Costs', icon: DollarSign, sections: ['costs', 'financials'] },
    { id: 6, name: 'Bill of quantities', icon: ListChecks, sections: ['boq'] },
    { id: 7, name: 'Report', icon: FileText, sections: ['report'] },
    { id: 8, name: 'Life simulation', icon: GitCompare, sections: ['life_sim'] },
  ];

  const handleExportPDF = (customFilename?: string) => {
    const doc = new jsPDF();
    const currency = inputs.financials.currency;
    
    // Page 1: Summary Table
    doc.setFontSize(20);
    doc.setTextColor(239, 68, 68); // Red-500
    doc.text('Red Pill Design & Pricing Engine', 14, 20);
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Model Comparison Summary Report', 14, 30);
    
    const summaryData = modellingResults ? modellingResults.map(res => {
      const loadText = `${res.totalAverageLoad?.toFixed(1)} kW`;
      const solarVal = res.actualSolarCapacity ?? 0;
      const nameWithSpecs = solarVal > 0 ? `${res.name} (${loadText} / ${solarVal.toFixed(1)} kWp)` : `${res.name} (${loadText})`;
      return [
        nameWithSpecs,
        loadText,
        `${currency} ${res.initialCapex.toLocaleString()}`,
        `${currency} ${res.breakevenMRR.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        `${currency} ${(res.mrrVariance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        `${currency} ${res.lcoe?.toFixed(2)}`
      ];
    }) : [[
      'Model 1',
      `${financialStats.totalAverageLoad?.toFixed(1)} kW`,
      `${currency} ${financialStats.initialCapex?.toLocaleString()}`,
      `${currency} ${financialStats.breakevenMRR?.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      '0',
      `${currency} ${financialStats.lcoe?.toFixed(2)}`
    ]];

    autoTable(doc, {
      startY: 40,
      head: [['Model Name', 'Total Load', 'Initial CAPEX', 'Breakeven MRR', 'MRR Variance', 'LCOE']],
      body: summaryData,
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 10 }
    });

    // Subsequent pages for each model
    const modelsToExport = modellingResults || [{ name: 'Model 1', ...financialStats }];

    modelsToExport.forEach((model, index) => {
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(239, 68, 68);
      const loadText = `${model.totalAverageLoad?.toFixed(1)} kW`;
      const solarVal = model.actualSolarCapacity ?? 0;
      const specs = solarVal > 0 ? `${loadText} / ${solarVal.toFixed(1)} kWp` : loadText;
      doc.text(`Model Detail: ${model.name} (${specs})`, 14, 20);

      // Financial Overview
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text('Financial Overview', 14, 35);
      const finData = [
        ['Initial CAPEX', `${currency} ${model.initialCapex?.toLocaleString()}`],
        ['Breakeven MRR', `${currency} ${model.breakevenMRR?.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
        ['Levelized Cost of Energy (LCOE)', `${currency} ${model.lcoe?.toFixed(2)} / kWh`]
      ];
      autoTable(doc, {
        startY: 40,
        body: finData,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 }
      });

      // Technical Overview
      doc.setFontSize(14);
      doc.text('Technical Overview', 14, (doc as any).lastAutoTable.finalY + 15);
      const grid = model.rectifierStats?.dailyGridEnergy || 0;
      const dg = model.rectifierStats?.dgDailyEnergyGeneration || 0;
      const solar = model.rectifierStats?.dailySolarEnergy || 0;
      const total = grid + dg + solar;
      const gridPct = total > 0 ? (grid / total) * 100 : 0;
      const dgPct = total > 0 ? (dg / total) * 100 : 0;
      const solarPct = total > 0 ? (solar / total) * 100 : 0;
      const techData = [
        ['Total Average Load', `${model.totalAverageLoad?.toFixed(2)} kW`],
        ['Battery Backup', `${model.rectifierStats?.batteryBackupHours} Hours`],
        ['Solar PV Capacity', `${model.rectifierStats?.actualSolarCapacity?.toFixed(1)} kWp`],
        ['DG Requirement', `${model.rectifierStats?.requiredDGKva?.toFixed(1)} kVA`],
        ['Annual Energy Load', `${(model.totalAverageLoad * 24 * 365)?.toLocaleString()} kWh`],
        ['Grid Daily Energy / Mix', `${grid.toFixed(2)} kWh (${gridPct.toFixed(1)}%)`],
        ['DG Daily Generation / Mix', `${dg.toFixed(2)} kWh (${dgPct.toFixed(1)}%)`],
        ['Solar Daily Generation / Mix', `${solar.toFixed(2)} kWh (${solarPct.toFixed(1)}%)`]
      ];
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        body: techData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [239, 68, 68] }
      });

      // Detailed BoQ (CAPEX)
      doc.setFontSize(14);
      doc.text('Bill of Quantities (CAPEX)', 14, (doc as any).lastAutoTable.finalY + 15);
      const boqData = model.boq.map(item => [
        item.item,
        item.quantity,
        item.unit,
        `${currency} ${item.unitCost.toLocaleString()}`,
        `${currency} ${item.total.toLocaleString()}`
      ]);
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Item Description', 'Qty', 'Unit', 'Unit Cost', 'Total Cost']],
        body: boqData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [239, 68, 68] }
      });

      // OPEX Table
      doc.setFontSize(14);
      doc.text('Operating Expenses (Annual OPEX - Year 1)', 14, (doc as any).lastAutoTable.finalY + 15);
      const opexData = model.cashFlows[1].details.opexItems.map(item => [
        item.name,
        'Annual',
        `${currency} ${item.cost.toLocaleString()}`
      ]);
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Expense Item', 'Frequency', 'Annual Cost']],
        body: opexData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [239, 68, 68] }
      });
    });

    doc.save(customFilename ? (customFilename.endsWith('.pdf') ? customFilename : `${customFilename}.pdf`) : `RedPill_Design_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const renderFormattedCost = (value: number, currency: string = inputs.financials.currency, className: string = "") => {
    const formattedValue = value.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return (
      <div className={cn("flex flex-col items-end leading-tight", className)}>
        <span className="text-[8px] md:text-[9px] opacity-60 font-bold">{currency}</span>
        <span className="font-mono">{formattedValue}</span>
      </div>
    );
  };

  const handleNextStep = () => {
    const currentStepObj = STEPS.find(s => s.id === currentStep);
    if (!currentStepObj) return;

    const currentSectionIndex = currentStepObj.sections.indexOf(activeSection);
    
    if (currentSectionIndex < currentStepObj.sections.length - 1) {
      // Move to next section in current step
      setActiveSection(currentStepObj.sections[currentSectionIndex + 1]);
    } else if (currentStep < STEPS.length) {
      // Move to next step
      setCurrentStep(prev => prev + 1);
      const nextStep = STEPS.find(s => s.id === currentStep + 1);
      if (nextStep) {
        setActiveSection(nextStep.sections[0]);
      }
    }
  };

  const handlePrevStep = () => {
    const currentStepObj = STEPS.find(s => s.id === currentStep);
    if (!currentStepObj) return;

    const currentSectionIndex = currentStepObj.sections.indexOf(activeSection);

    if (currentSectionIndex > 0) {
      // Move to previous section in current step
      setActiveSection(currentStepObj.sections[currentSectionIndex - 1]);
    } else if (currentStep > 1) {
      // Move to previous step
      setCurrentStep(prev => prev - 1);
      const prevStep = STEPS.find(s => s.id === currentStep - 1);
      if (prevStep) {
        setActiveSection(prevStep.sections[prevStep.sections.length - 1]);
      }
    }
  };

  const sanitizedInputs = useMemo(() => {
    const sanitize = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(sanitize);
      if (obj !== null && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) newObj[key] = sanitize(obj[key]);
        return newObj;
      }
      return obj === null ? 0 : obj;
    };
    return sanitize(inputs) as SiteInputs;
  }, [inputs]);

  const modellingResults = useMemo(() => {
    const results = [];
    const baseInputs = JSON.parse(JSON.stringify(sanitizedInputs));
    const iterations = inputs.modelling.multipleModels ? (inputs.modelling.iterations || 1) : 1;
    const loadInc = inputs.modelling.loadIncrement || 0;
    const solarInc = inputs.modelling.solarIncrement || 0;

    for (let i = 0; i < iterations; i++) {
      const simInputs = JSON.parse(JSON.stringify(baseInputs));
      simInputs.tenantLoads = simInputs.tenantLoads.map((load: any) => ({
        peakLoad: (load.peakLoad || 0) + (i * loadInc),
        averageLoad: (load.averageLoad || 0) + (i * loadInc),
        runningLoad: (load.runningLoad || 0) + (i * loadInc)
      }));
      if (simInputs.solar.enabled) {
        simInputs.solar.totalCapacity += (i * solarInc);
      }

      const stats = calculateAllStats(simInputs);
      results.push({
        name: `Model ${i + 1}`,
        loadAdded: i * loadInc,
        solarAdded: i * solarInc,
        mrrVariance: i > 0 ? stats.breakevenMRR - results[i - 1].breakevenMRR : 0,
        ...stats
      });
    }
    return results;
  }, [sanitizedInputs, inputs.modelling]);

  const [selectedModelIndices, setSelectedModelIndices] = useState<number[]>([0]);
  const selectedModelIndex = selectedModelIndices[0] ?? 0;
  const setSelectedModelIndex = (index: number) => {
    setSelectedModelIndices([index]);
  };

  const totalOutageHours = useMemo(() => {
    if (inputs.gridCondition === 'Off-grid') return 24;
    return Math.min(24, Math.max(0, (inputs.dailyOutages || 0) * (inputs.outageDuration || 0)));
  }, [inputs.gridCondition, inputs.dailyOutages, inputs.outageDuration]);

  const totalGridAvailabilityHours = useMemo(() => {
    return Math.max(0, 24 - totalOutageHours);
  }, [totalOutageHours]);

  const gridSegments = useMemo(() => {
    const cond = inputs.gridCondition;
    if (cond === 'Off-grid') {
      return [
        { type: 'outage', duration: 24, label: 'Outage', widthPct: 100, timeRange: '00:00 - 24:00' }
      ];
    }
    const n = inputs.dailyOutages || 0;
    const d = inputs.outageDuration || 0;
    const totalOutage = Math.min(2147483647, n * d);
    
    if (totalOutage >= 24) {
      return [
        { type: 'outage', duration: 24, label: 'Outage', widthPct: 100, timeRange: '00:00 - 24:00' }
      ];
    }
    if (n <= 0 || d <= 0) {
      return [
        { type: 'grid', duration: 24, label: 'Grid Available', widthPct: 100, timeRange: '00:00 - 24:00' }
      ];
    }

    const totalGrid = 24 - totalOutage;
    const g = totalGrid / n; // duration of each grid segment

    const segments = [];
    let currentTime = 0;

    const formatTime = (hours: number) => {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    for (let i = 0; i < n; i++) {
      // Grid segment
      const nextGridStart = currentTime;
      const nextGridEnd = currentTime + g;
      segments.push({
        type: 'grid',
        duration: g,
        label: `Grid ${i + 1}`,
        widthPct: (g / 24) * 100,
        timeRange: `${formatTime(nextGridStart)} - ${formatTime(nextGridEnd)}`
      });
      currentTime = nextGridEnd;

      // Outage segment
      const nextOutageStart = currentTime;
      const nextOutageEnd = currentTime + d;
      segments.push({
        type: 'outage',
        duration: d,
        label: `Outage ${i + 1}`,
        widthPct: (d / 24) * 100,
        timeRange: `${formatTime(nextOutageStart)} - ${formatTime(nextOutageEnd)}`
      });
      currentTime = nextOutageEnd;
    }

    return segments;
  }, [inputs.gridCondition, inputs.dailyOutages, inputs.outageDuration]);

  React.useEffect(() => {
    setSelectedModelIndices(prev => {
      const valid = prev.filter(idx => idx < modellingResults.length);
      return valid.length > 0 ? valid : [0];
    });
  }, [modellingResults]);

  const totalRunningLoad = useMemo(() => {
    return sanitizedInputs.tenantLoads.reduce((acc, load) => acc + (load.runningLoad || 0), 0);
  }, [sanitizedInputs.tenantLoads]);

  const totalAverageLoad = useMemo(() => {
    return sanitizedInputs.tenantLoads.reduce((acc, load) => acc + (load.averageLoad || 0), 0);
  }, [sanitizedInputs.tenantLoads]);

  const totalPeakLoad = useMemo(() => {
    return sanitizedInputs.tenantLoads.reduce((acc, load) => acc + (load.peakLoad || 0), 0);
  }, [sanitizedInputs.tenantLoads]);

  const rectifierStats = useMemo(() => {
    return modellingResults[0].rectifierStats;
  }, [modellingResults]);

  const boq = useMemo(() => {
    return modellingResults[0].boq;
  }, [modellingResults]);

  const financialStats = useMemo(() => {
    const index = Math.min(selectedModelIndex, modellingResults.length - 1);
    return modellingResults[index] || modellingResults[0];
  }, [selectedModelIndex, modellingResults]);



  const updateTenantLoad = (index: number, field: keyof TenantLoad, value: number) => {
    const newLoads = [...inputs.tenantLoads];
    newLoads[index] = { ...newLoads[index], [field]: value };
    setInputs({ ...inputs, tenantLoads: newLoads });
  };

  const displayedStats = useMemo(() => {
    const index = Math.min(selectedModelIndex, modellingResults.length - 1);
    const model = modellingResults[index];

    return {
      initialCapex: model.initialCapex,
      breakevenMRR: model.breakevenMRR,
      lcoe: model.lcoe,
      systemEfficiency: model.rectifierStats.systemEfficiency,
      totalRunningLoad: model.totalRunningLoad,
      totalAverageLoad: model.totalAverageLoad,
      backupHours: model.rectifierStats.batteryBackupHours,
      actualSolarCapacity: model.actualSolarCapacity,
      requiredDGKva: model.rectifierStats.requiredDGKva,
      cashFlows: model.cashFlows,
      boq: model.boq,
      opexItemsYear1: model.opexItemsYear1,
      rectifierStats: model.rectifierStats
    };
  }, [selectedModelIndex, modellingResults]);

  const combinedCashFlows = useMemo(() => {
    if (modellingResults.length === 0) return [];
    const tenure = inputs.financials.tenure || 15;
    const data = [];
    for (let year = 0; year <= tenure; year++) {
      const point: any = { year };
      selectedModelIndices.forEach(idx => {
        const model = modellingResults[idx];
        if (model && model.cashFlows && model.cashFlows[year]) {
          point[`model_${idx}_outflow`] = model.cashFlows[year].totalOutflow;
        }
      });
      data.push(point);
    }
    return data;
  }, [selectedModelIndices, modellingResults, inputs.financials.tenure]);

  const handleNumTenantsChange = (num: number | null) => {
    const safeNum = num ?? 0;
    const currentLoads = [...inputs.tenantLoads];
    if (safeNum > currentLoads.length) {
      for (let i = currentLoads.length; i < safeNum; i++) {
        currentLoads.push({ peakLoad: null as any, averageLoad: null as any, runningLoad: null as any });
      }
    } else {
      currentLoads.splice(safeNum);
    }
    setInputs({ ...inputs, numTenants: num, tenantLoads: currentLoads });
  };

  // calculateAllStats imported from ./lib/dcEngine


  const getModelsForProject = (projectData: SiteInputs) => {
    const results = [];
    try {
      const baseInputs = JSON.parse(JSON.stringify(projectData));
      const iterations = baseInputs.modelling?.multipleModels ? (baseInputs.modelling?.iterations || 1) : 1;
      const loadInc = baseInputs.modelling?.loadIncrement || 0;
      const solarInc = baseInputs.modelling?.solarIncrement || 0;

      for (let i = 0; i < iterations; i++) {
        const simInputs = JSON.parse(JSON.stringify(baseInputs));
        if (simInputs.tenantLoads) {
          simInputs.tenantLoads = simInputs.tenantLoads.map((load: any) => ({
            peakLoad: (load.peakLoad || 0) + (i * loadInc),
            averageLoad: (load.averageLoad || 0) + (i * loadInc),
            runningLoad: (load.runningLoad || 0) + (i * loadInc)
          }));
        }
        if (simInputs.solar?.enabled) {
          simInputs.solar.totalCapacity += (i * solarInc);
        }

        const stats = calculateAllStats(simInputs);
        const totalPeakLoad = simInputs.tenantLoads ? simInputs.tenantLoads.reduce((acc: number, load: any) => acc + (load.peakLoad || 0), 0) : 0;
        
        results.push({
          name: `Model ${i + 1}`,
          loadAdded: i * loadInc,
          solarAdded: i * solarInc,
          gridCondition: simInputs.gridCondition,
          totalPeakLoad,
          totalOutageHours: simInputs.gridCondition === 'Off-grid' ? 24 : Math.min(24, Math.max(0, (simInputs.dailyOutages || 0) * (simInputs.outageDuration || 0))),
          totalGridHours: simInputs.gridCondition === 'Off-grid' ? 0 : Math.max(0, 24 - ((simInputs.dailyOutages || 0) * (simInputs.outageDuration || 0))),
          ...stats
        });
      }
    } catch (err) {
      console.error("Error in getModelsForProject", err);
    }
    return results;
  };

  const getOptimizationOptions = (projectData: SiteInputs) => {
    const results: any[] = [];
    try {
      const peakLoad = projectData.tenantLoads ? projectData.tenantLoads.reduce((acc, load) => acc + (load.peakLoad || 0), 0) : 10;
      
      const baselineStats = calculateAllStats(projectData);
      const baselineMRR = baselineStats.breakevenMRR || 1e9;
      const baselineLCOE = baselineStats.lcoe || 1e9;

      // Extract baseline quantities to prevent suggesting zero-cost component additions or resizing/upgrades
      const baselineBoqMap = new Map<string, number>();
      if (baselineStats && baselineStats.boq) {
        baselineStats.boq.forEach((b: any) => {
          baselineBoqMap.set(b.item, b.quantity);
        });
      }

      // Ensure backupHours options are valid and have variety
      const backupHoursRange = [2, 4, 6, 8, 12, 16];
      if (projectData.battery.backupHours && !backupHoursRange.includes(projectData.battery.backupHours)) {
        backupHoursRange.push(projectData.battery.backupHours);
      }

      // battery charging rate range
      const chargingRatesRange = [0.15, 0.25, 0.5, 0.8, 1.0];
      if (projectData.rectifier.batteryChargingRate && !chargingRatesRange.includes(projectData.rectifier.batteryChargingRate)) {
        chargingRatesRange.push(projectData.rectifier.batteryChargingRate);
      }

      // solar options
      const solarOptions: { enabled: boolean; capacity: number }[] = [
        { enabled: false, capacity: 0 }
      ];
      const suggSolarCap1 = Math.round(peakLoad * 1.0);
      const suggSolarCap2 = Math.round(peakLoad * 1.5);
      if (suggSolarCap1 > 0) solarOptions.push({ enabled: true, capacity: suggSolarCap1 });
      if (suggSolarCap2 > 0) solarOptions.push({ enabled: true, capacity: suggSolarCap2 });
      if (projectData.solar.enabled && projectData.solar.totalCapacity) {
        if (!solarOptions.some(o => o.enabled && o.capacity === projectData.solar.totalCapacity)) {
          solarOptions.push({ enabled: true, capacity: projectData.solar.totalCapacity });
        }
      }

      // DG options (CDC & Non-CDC)
      const dgOptions: { enabled: boolean; method: DGOperationMethod }[] = [];
      const hasOutages = projectData.gridCondition === 'Off-grid' || ((projectData.dailyOutages || 0) > 0 && (projectData.outageDuration || 0) > 0);

      if (projectData.dg.enabled) {
        if (hasOutages) {
          // If baseline has DG and site has outages or is off-grid, we must NOT propose disabling/removing the generator entirely.
          // Backup generator is critical infrastructure and must be preserved. We optimize the method (CDC vs Non-CDC) instead.
          dgOptions.push({ enabled: true, method: 'CDC' });
          dgOptions.push({ enabled: true, method: 'Non-CDC' });
        } else {
          // If there are absolutely 0 outages, we can offer to disable it
          dgOptions.push({ enabled: false, method: 'CDC' });
          dgOptions.push({ enabled: true, method: 'CDC' });
          dgOptions.push({ enabled: true, method: 'Non-CDC' });
        }
      } else {
        // If baseline itself doesn't have a generator, keep it disabled
        dgOptions.push({ enabled: false, method: 'CDC' });
      }

      interface Candidate {
        inputs: SiteInputs;
        stats: any;
        mrr: number;
        lcoe: number;
        capex: number;
      }
      const candidates: Candidate[] = [];

      for (const bh of backupHoursRange) {
        for (const cr of chargingRatesRange) {
          for (const sol of solarOptions) {
            for (const dg of dgOptions) {
              const simInputs: SiteInputs = JSON.parse(JSON.stringify(projectData));
              simInputs.battery.backupHours = bh;
              simInputs.rectifier.batteryChargingRate = cr;
              simInputs.solar.enabled = sol.enabled;
              simInputs.solar.totalCapacity = sol.capacity;
              simInputs.dg.enabled = dg.enabled;
              simInputs.dg.operationMethod = dg.method;

              // 1) Outage checks: Whenever there is an outage, the system has to be powered up by battery or diesel genset.
              // It cannot totally eliminate the diesel genset if the battery is unable to support the load during the outage period.
              const hasOutages = simInputs.gridCondition === 'Off-grid' || ((simInputs.dailyOutages || 0) > 0 && (simInputs.outageDuration || 0) > 0);
              if (hasOutages && !simInputs.dg.enabled) {
                const requiredBackupTime = simInputs.gridCondition === 'Off-grid' ? 24 : (simInputs.outageDuration || 0);
                if (simInputs.battery.backupHours < requiredBackupTime) {
                  continue;
                }
              }

              try {
                const stats = calculateAllStats(simInputs);
                if (stats.breakevenMRR > 0 && stats.lcoe > 0) {
                  // Guard: Check if the option proposes adding or upgrading components whose unit cost in user inputs is 0 (signifying unavailable/not possible)
                  let hasInvalidZeroCostComponent = false;
                  if (stats.boq) {
                    for (const item of stats.boq) {
                      if (item.quantity > 0) {
                        const baseQty = baselineBoqMap.get(item.item) || 0;
                        if (item.quantity > baseQty) {
                          // Check if its cost in Materials is 0 (or null/undefined)
                          const unitCost = projectData.costs.materials[item.item];
                          if (unitCost !== undefined && Number(unitCost) === 0) {
                            hasInvalidZeroCostComponent = true;
                            break;
                          }
                        }
                      }
                    }
                  }

                  if (!hasInvalidZeroCostComponent) {
                    candidates.push({
                      inputs: simInputs,
                      stats,
                      mrr: stats.breakevenMRR,
                      lcoe: stats.lcoe,
                      capex: stats.initialCapex
                    });
                  }
                }
              } catch (e) {
                // skip invalid configurations
              }
            }
          }
        }
      }

      // Build precise lists of tweaks for the proposed options
      const buildTweaks = (cand: Candidate) => {
        const tweaks = [];
        
        // backup hours change
        if (cand.inputs.battery.backupHours !== projectData.battery.backupHours) {
          tweaks.push({
            label: "Backup Hours",
            value: `${cand.inputs.battery.backupHours} Hrs`,
            previous: `${projectData.battery.backupHours} Hrs`
          });
        }
        
        // battery charging rate
        if (cand.inputs.rectifier.batteryChargingRate !== projectData.rectifier.batteryChargingRate) {
          tweaks.push({
            label: "Battery Charging Rate",
            value: `${cand.inputs.rectifier.batteryChargingRate} C`,
            previous: `${projectData.rectifier.batteryChargingRate} C`
          });
        }

        // Solar check
        if (cand.inputs.solar.enabled !== projectData.solar.enabled || (cand.inputs.solar.enabled && cand.inputs.solar.totalCapacity !== projectData.solar.totalCapacity)) {
          tweaks.push({
            label: "Solar Setup",
            value: cand.inputs.solar.enabled ? `${cand.inputs.solar.totalCapacity} kWp` : "Disabled",
            previous: projectData.solar.enabled ? `${projectData.solar.totalCapacity} kWp` : "Disabled"
          });
        }

        // DG setup
        if (cand.inputs.dg.enabled !== projectData.dg.enabled || (cand.inputs.dg.enabled && cand.inputs.dg.operationMethod !== projectData.dg.operationMethod)) {
          tweaks.push({
            label: "Diesel Generator Config",
            value: cand.inputs.dg.enabled ? `Enabled (${cand.inputs.dg.operationMethod})` : "Disabled",
            previous: projectData.dg.enabled ? `Enabled (${projectData.dg.operationMethod})` : "Disabled"
          });
        }

        if (tweaks.length === 0) {
          tweaks.push({
            label: "No Changes Needed",
            value: "Current layout is already optimal",
            previous: "N/A"
          });
        }

        return tweaks;
      };

      // Helper function to figure out capex differences
      const getCapexDifferences = (baselineBoq: any[], optionBoq: any[]) => {
        const diffs: any[] = [];
        const baseMap = new Map<string, any>();
        baselineBoq.forEach(b => baseMap.set(b.item, b));

        const optMap = new Map<string, any>();
        optionBoq.forEach(o => optMap.set(o.item, o));

        const allItems = Array.from(new Set([...baseMap.keys(), ...optMap.keys()]));

        // Check if there is a diesel generator in baseline and a diesel generator in option which are of different sizes.
        const baseDgItem = baselineBoq.find(b => b.item.startsWith("Diesel Generator "));
        const optDgItem = optionBoq.find(o => o.item.startsWith("Diesel Generator "));

        let handledDgResize = false;
        if (baseDgItem && optDgItem && baseDgItem.item !== optDgItem.item) {
          // It's a resizing/replacement/upgrade!
          // We can merge them into a single difference item
          const diff = optDgItem.total - baseDgItem.total;
          diffs.push({
            item: `Diesel Generator Resize (${baseDgItem.item.replace("Diesel Generator ", "")} → ${optDgItem.item.replace("Diesel Generator ", "")})`,
            difference: diff,
            previousQty: 1,
            currentQty: 1,
            previousCost: baseDgItem.total,
            currentCost: optDgItem.total
          });
          handledDgResize = true;
        }

        allItems.forEach(itemName => {
          // If we handled the DG resize, skip individual items for the old/new DGs to prevent double-counting or separate entries
          if (handledDgResize && itemName.startsWith("Diesel Generator ")) {
            return;
          }

          const bItem = baseMap.get(itemName);
          const oItem = optMap.get(itemName);

          const bQty = bItem ? bItem.quantity : 0;
          const oQty = oItem ? oItem.quantity : 0;

          const bCost = bItem ? bItem.total : 0;
          const oCost = oItem ? oItem.total : 0;

          const diff = oCost - bCost;
          if (Math.abs(diff) > 1) {
            diffs.push({
              item: itemName,
              difference: diff,
              previousQty: bQty,
              currentQty: oQty,
              previousCost: bCost,
              currentCost: oCost
            });
          }
        });

        return diffs;
      };

      // Strict screening:
      // 1) Filter out candidate configurations that are identical to the baseline.
      // 2) Filter out candidate configurations where BOTH MRR and LCOE increase compared to baseline.
      // 3) At least one of MRR or LCOE must be strictly improved (MRR improved or LCOE improved).
      const validPromoCandidates = candidates.filter(c => {
        const isDifferent = 
          c.inputs.battery.backupHours !== projectData.battery.backupHours ||
          c.inputs.rectifier.batteryChargingRate !== projectData.rectifier.batteryChargingRate ||
          c.inputs.solar.enabled !== projectData.solar.enabled ||
          (c.inputs.solar.enabled && c.inputs.solar.totalCapacity !== projectData.solar.totalCapacity) ||
          c.inputs.dg.enabled !== projectData.dg.enabled ||
          (c.inputs.dg.enabled && c.inputs.dg.operationMethod !== projectData.dg.operationMethod);

        if (!isDifferent) return false;

        const bothIncrease = (c.mrr > baselineMRR + 0.1) && (c.lcoe > baselineLCOE + 0.0001);
        if (bothIncrease) return false;

        const improvesAtLeastOne = (c.mrr < baselineMRR - 0.1) || (c.lcoe < baselineLCOE - 0.0001);
        return improvesAtLeastOne;
      });

      // Construct up to 3 diverse optimal choices from the valid pools
      const proposedOptions = [];

      // 1. Lowest LCOE Option (Must strictly improve LCOE)
      const lcoePool = validPromoCandidates.filter(c => c.lcoe < baselineLCOE - 0.0001);
      if (lcoePool.length > 0) {
        const optLcoe = [...lcoePool].sort((a, b) => a.lcoe - b.lcoe)[0];
        proposedOptions.push({
          id: 'lcoe',
          name: "Option 1: Max Cost Efficiency (LCOE Optimized)",
          description: "Optimizes solar capacity and battery charging parameters to deliver the absolute lowest Levelized Cost of Energy.",
          mrr: optLcoe.mrr,
          lcoe: optLcoe.lcoe,
          capex: optLcoe.capex,
          tweaks: buildTweaks(optLcoe),
          capexDiffs: getCapexDifferences(baselineStats.boq, optLcoe.stats.boq),
          stats: optLcoe.stats,
          data: optLcoe.inputs
        });
      }

      // 2. Lowest MRR Option (Must strictly improve MRR)
      const mrrPool = validPromoCandidates.filter(c => c.mrr < baselineMRR - 0.1);
      if (mrrPool.length > 0) {
        const optLcoeDataStr = proposedOptions.find(o => o.id === 'lcoe') ? JSON.stringify(proposedOptions.find(o => o.id === 'lcoe').data) : '';
        const mrrPoolFiltered = mrrPool.filter(c => JSON.stringify(c.inputs) !== optLcoeDataStr);
        const finalMrrPool = mrrPoolFiltered.length > 0 ? mrrPoolFiltered : mrrPool;
        const optMrr = [...finalMrrPool].sort((a, b) => a.mrr - b.mrr)[0];

        proposedOptions.push({
          id: 'mrr',
          name: "Option 2: Peak Resilience (MRR Optimized)",
          description: "Focuses on minimizing monthly commitments (Breakeven MRR) by balancing capital design size with diesel runtime parameters.",
          mrr: optMrr.mrr,
          lcoe: optMrr.lcoe,
          capex: optMrr.capex,
          tweaks: buildTweaks(optMrr),
          capexDiffs: getCapexDifferences(baselineStats.boq, optMrr.stats.boq),
          stats: optMrr.stats,
          data: optMrr.inputs
        });
      }

      // 3. Balanced Green Storage Option (Must improve at least one, prefer solar + cdc)
      const existingDataStrings = proposedOptions.map(o => JSON.stringify(o.data));
      const balancedPool = validPromoCandidates.filter(c => !existingDataStrings.includes(JSON.stringify(c.inputs)));
      const activeBalancedPool = balancedPool.length > 0 ? balancedPool : validPromoCandidates;

      const greenCandidates = activeBalancedPool.filter(c => c.inputs.solar.enabled && (!c.inputs.dg.enabled || c.inputs.dg.operationMethod === 'CDC'));
      const selectionPool = greenCandidates.length > 0 ? greenCandidates : activeBalancedPool;

      if (selectionPool.length > 0) {
        const sortedBalanced = [...selectionPool].sort((a, b) => {
          const scoreA = (a.lcoe / baselineLCOE) * 0.5 + (a.mrr / baselineMRR) * 0.5;
          const scoreB = (b.lcoe / baselineLCOE) * 0.5 + (b.mrr / baselineMRR) * 0.5;
          return scoreA - scoreB;
        });
        const optBalanced = sortedBalanced[0];

        if (!proposedOptions.some(o => JSON.stringify(o.data) === JSON.stringify(optBalanced.inputs))) {
          proposedOptions.push({
            id: 'balanced',
            name: "Option 3: Balanced Solar-Storage Hybrid",
            description: "A green resilient architecture blending optimal backup protection with maximized Solar yield, reducing generator reliance.",
            mrr: optBalanced.mrr,
            lcoe: optBalanced.lcoe,
            capex: optBalanced.capex,
            tweaks: buildTweaks(optBalanced),
            capexDiffs: getCapexDifferences(baselineStats.boq, optBalanced.stats.boq),
            stats: optBalanced.stats,
            data: optBalanced.inputs
          });
        }
      }

      return proposedOptions;
    } catch (err) {
      console.error("Error in getOptimizationOptions", err);
    }
    return results;
  };

  const handleSaveOptimizedProject = (chosenOptionData: SiteInputs) => {
    if (!currentUser) return;
    if (!newOptimizedProjectName.trim()) {
      notify("Enter a project name.", 'error');
      return;
    }
    saveUserTemplate(currentUser.username, newOptimizedProjectName.trim(), chosenOptionData);
    refreshUserDbData();
    notify(`Saved “${newOptimizedProjectName.trim()}”.`, 'success');
    setOptimizedProject(null);
    setSelectedOptimizationOptionIndex(null);
    setNewOptimizedProjectName("");
    setShowSaveOptimizedModal(false);
  };

  const handleNewProject = () => {
    setSelectedTemplate("");
    setNewProjectName("");
    setShowNewProjectModal(true);
  };

  const confirmNewProject = (template: SiteInputs, name: string) => {
    setInputs(template);
    setCurrentTemplateName(name);
    setSelectedModelIndex(0);
    setCurrentStep(1);
    setActiveSection('grid');
    setCommittedSnapshot(JSON.stringify(template));
    setPendingOpen(null);
    setShowReplaceSheet(false);
    setShowNewProjectModal(false);
    setSelectedTemplate("");
    setNewProjectName("");
    window.scrollTo(0, 0);
  };

  const applyOpenDesign = (name: string, data: SiteInputs) => {
    setInputs(data);
    setCurrentTemplateName(name);
    setSelectedModelIndex(0);
    setCurrentStep(1);
    setActiveSection('grid');
    setCommittedSnapshot(JSON.stringify(data));
    setPendingOpen(null);
    setShowReplaceSheet(false);
    setIsSidebarOpen(false);
    window.scrollTo(0, 0);
    notify(`Opened “${name}”.`, 'success');
  };

  const requestOpenDesign = (name: string, data: SiteInputs) => {
    if (JSON.stringify(inputs) === committedSnapshot) {
      applyOpenDesign(name, data);
      return;
    }
    setPendingOpen({ name, data });
    setShowReplaceSheet(true);
  };

  const handleSaveProject = () => {
    const defaultName = currentTemplateName.replace(/[^a-zA-Z0-9_\-]+/g, "_") || `red_pill_config_${new Date().toISOString().split('T')[0]}`;
    requestFilename("Export Project Configuration", defaultName, (filename) => {
      const actualName = filename.endsWith(".json") ? filename : `${filename}.json`;
      const payload = {
        name: currentTemplateName,
        data: inputs
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", actualName);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const templateData = json.data || json;
        const templateName = json.name || file.name.replace(".json", "");
        requestOpenDesign(templateName, templateData);
      } catch (err) {
        notify('Couldn’t open that file. Use a project JSON.', 'error');
      }
    };
    reader.readAsText(file);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={setCurrentUser} />;
  }

  const chromeNav = (active: boolean) => cn(
    "w-full flex items-center gap-[var(--space-3)] px-[var(--space-3)] min-h-9 rounded-[var(--radius-control)] text-left cursor-pointer",
    "font-[family-name:var(--font-text)] text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] tracking-[var(--text-subhead-tracking)]",
    "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
    active
      ? "bg-[var(--tint-soft)] text-[var(--tint)] font-semibold"
      : "text-[var(--label-secondary)] hover:bg-[var(--fill-quaternary)] hover:text-[var(--label)] font-normal"
  );

  const chromeSubnav = (active: boolean) => cn(
    "w-full flex items-center gap-[var(--space-2)] px-[var(--space-3)] min-h-8 rounded-[var(--radius-control)] text-left cursor-pointer",
    "font-[family-name:var(--font-text)] text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] tracking-[var(--text-footnote-tracking)]",
    "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
    active
      ? "bg-[var(--tint-soft)] text-[var(--tint)] font-semibold"
      : "text-[var(--label-tertiary)] hover:bg-[var(--fill-quaternary)] hover:text-[var(--label)]"
  );

  const chromeAction =
    "w-full justify-start font-medium text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] tracking-[var(--text-subhead-tracking)]";

  const chromeSectionLabel =
    "block px-[var(--space-3)] mb-[var(--space-1)] font-[family-name:var(--font-text)] text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line)] tracking-[var(--text-caption-1-tracking)] text-[var(--label-tertiary)]";

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-[var(--tint-soft)] flex-all transition-colors duration-[var(--duration-normal)] ease-[var(--ease-standard)] bg-[var(--bg)] text-[var(--label)]",
      isDarkMode ? "dark" : "light-theme"
    )}>
      {/* Top Header Bar (Unified Mobile/Desktop) */}
      <header className="fixed top-0 left-0 right-0 lg:left-[var(--sidebar-width)] h-[var(--toolbar-height)] z-40 flex items-center justify-between px-[var(--space-5)] bg-[var(--material-regular-fill)] backdrop-blur-[var(--material-blur-regular)] backdrop-saturate-[var(--material-saturate-regular)] shadow-[var(--glass-highlight),0_0.5px_0_var(--separator)]">
        <div className="flex items-center gap-[var(--space-3)] min-w-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden flex items-center justify-center w-11 h-11 -ml-2 rounded-[var(--radius-control)] text-[var(--label-secondary)] hover:bg-[var(--fill-quaternary)] hover:text-[var(--label)]"
            id="mobile-sidebar-toggle"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-[var(--space-2)] min-w-0 select-none font-[family-name:var(--font-text)]">
            <span className="hidden sm:inline text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] text-[var(--label-tertiary)]">
              Modeller
            </span>
            <span className="hidden sm:inline text-[var(--label-quaternary)] text-[length:var(--text-footnote-size)]">/</span>
            <span className="text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] tracking-[var(--text-subhead-tracking)] font-semibold text-[var(--label)] truncate">
              {showAdminTab ? "Admin" : (STEPS.find(s => s.id === currentStep)?.name?.replace(/^\d+\.\s*/, '') || 'Red Pill')}
            </span>
            {!showAdminTab && (
              <>
                <span className="text-[var(--label-quaternary)] text-[length:var(--text-footnote-size)]">/</span>
                <span 
                  className="text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line)] tracking-[var(--text-caption-1-tracking)] px-[var(--space-2)] py-[var(--space-1)] rounded-[var(--radius-capsule)] bg-[var(--fill-tertiary)] text-[var(--label-secondary)] max-w-[120px] sm:max-w-xs truncate"
                  title={`Current design: ${currentTemplateName}`}
                >
                  {currentTemplateName}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-[var(--space-2)] shrink-0">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-capsule)] bg-[var(--fill-tertiary)] text-[var(--label-secondary)] hover:bg-[var(--fill-secondary)] hover:text-[var(--label)] cursor-pointer"
            title={isDarkMode ? "Use light appearance" : "Use dark appearance"}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-[var(--space-2)] h-9 pl-1 pr-[var(--space-2)] rounded-[var(--radius-capsule)] hover:bg-[var(--fill-quaternary)] cursor-pointer"
                id="user-profile-menu-trigger"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--tint)] flex items-center justify-center text-[length:var(--text-caption-2-size)] font-semibold text-[var(--on-tint)] uppercase shrink-0 select-none">
                  {currentUser.username.substring(0, 2)}
                </div>
                <span className="hidden sm:inline text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] font-medium text-[var(--label)] select-none">
                  {currentUser.username}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--label-tertiary)]" />
              </button>

              {isUserDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setIsUserDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    className="absolute right-0 top-11 mt-1 w-56 z-50 p-[var(--space-2)] rounded-[var(--radius-sheet)] bg-[var(--material-ultra-thin-fill)] backdrop-blur-[var(--material-blur-ultra-thin)] backdrop-saturate-[var(--material-saturate)] shadow-[var(--glass-highlight),var(--shadow-menu)]"
                  >
                    <div className="px-[var(--space-3)] py-[var(--space-2)] mb-[var(--space-1)] shadow-[inset_0_-0.5px_0_var(--separator)]">
                      <p className="text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line)] text-[var(--label-tertiary)]">Signed in as</p>
                      <p className="mt-0.5 text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] font-semibold text-[var(--label)] truncate">{currentUser.username}</p>
                      <span className={cn(
                        "inline-block mt-[var(--space-1)] text-[length:var(--text-caption-2-size)] leading-[var(--text-caption-2-line)] tracking-[var(--text-caption-2-tracking)] px-[var(--space-2)] py-0.5 rounded-[var(--radius-capsule)]",
                        currentUser.role === 'admin'
                          ? "bg-[var(--tint-soft)] text-[var(--tint)]"
                          : "bg-[var(--fill-tertiary)] text-[var(--label-secondary)]"
                      )}>
                        {currentUser.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            setShowAdminTab(!showAdminTab);
                            setIsUserDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-control)] text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)]",
                            showAdminTab
                              ? "bg-[var(--tint-soft)] text-[var(--tint)]"
                              : "text-[var(--label)] hover:bg-[var(--fill-quaternary)]"
                          )}
                        >
                          {showAdminTab ? "Back to modeller" : "Open admin panel"}
                        </button>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-control)] text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] text-[var(--system-red)] hover:bg-[var(--fill-quaternary)]"
                      >
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-[var(--sidebar-width)] z-[70] flex flex-col transition-transform duration-[var(--duration-normal)] ease-[var(--ease-standard)] lg:translate-x-0",
        "bg-[var(--material-regular-fill)] backdrop-blur-[var(--material-blur-regular)] backdrop-saturate-[var(--material-saturate-regular)] shadow-[var(--glass-highlight),0.5px_0_0_var(--separator)]",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-[var(--space-4)] pt-[var(--space-6)] pb-[var(--space-4)] relative shadow-[inset_0_-0.5px_0_var(--separator)]">
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-[var(--space-4)] right-[var(--space-3)] flex items-center justify-center w-11 h-11 rounded-[var(--radius-control)] text-[var(--label-secondary)] hover:bg-[var(--fill-quaternary)] hover:text-[var(--label)]"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-4)] select-none">
            <div className="w-9 h-9 bg-[var(--tint)] rounded-[var(--radius-element)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[var(--on-tint)]" />
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-title)] text-[length:var(--text-headline-size)] leading-[var(--text-headline-line)] tracking-[var(--text-headline-tracking)] font-semibold text-[var(--label)]">Red Pill</h1>
              <p className="text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line)] tracking-[var(--text-caption-1-tracking)] text-[var(--label-tertiary)]">Design & pricing</p>
            </div>
          </div>

          <div className="flex flex-col gap-[var(--space-1)]">
            <Button variant="gray" size="compact" onClick={handleNewProject} className={chromeAction}>
              <FilePlus className="w-4 h-4 text-[var(--tint)]" />
              New project
            </Button>
            
            <Button
              variant="gray"
              size="compact"
              onClick={() => {
                setSaveTemplateDbName(currentTemplateName);
                setShowSaveTemplateDbModal(true);
              }}
              title="Save this design to Projects"
              className={chromeAction}
            >
              <CheckCircle2 className="w-4 h-4 text-[var(--label-secondary)]" />
              Save as project
            </Button>

            <label 
              title="Import a project file"
              className={cn(
                chromeNav(false),
                "cursor-pointer"
              )}
            >
              <Upload className="w-4 h-4" />
              Import project
              <input type="file" accept=".json" onChange={handleUploadCustomTemplate} className="hidden" />
            </label>

            <Button
              variant="gray"
              size="compact"
              onClick={handleSaveProject}
              title="Export this design as a file"
              className={chromeAction}
            >
              <Download className="w-4 h-4 text-[var(--label-secondary)]" />
              Export project
            </Button>
          </div>
        </div>

        <nav className="flex-1 px-[var(--space-3)] mt-[var(--space-5)] flex flex-col gap-[var(--space-5)] overflow-y-auto custom-scrollbar pb-[var(--space-8)]">
          {/* User templates Database (with safe inline check delete) */}
          {userDbTemplates.length > 0 && (
            <div>
              <span className={chromeSectionLabel}>
                Projects ({userDbTemplates.length})
              </span>
              <div className="flex flex-col max-h-[160px] overflow-y-auto custom-scrollbar rounded-[var(--radius-element)] bg-[var(--bg-elevated)] shadow-[0_0_0_0.5px_var(--separator)]">
                {userDbTemplates.map((t) => (
                  <div 
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({
                        id: t.id,
                        name: t.name,
                        data: t.data
                      }));
                    }}
                    onClick={() => requestOpenDesign(t.name, t.data)}
                    title="Open this project"
                    className="flex items-center justify-between px-[var(--space-3)] min-h-9 cursor-grab active:cursor-grabbing group shadow-[inset_0_-0.5px_0_var(--separator)] last:shadow-none hover:bg-[var(--fill-quaternary)]"
                  >
                    <span className="text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] text-[var(--label)] truncate font-normal max-w-[130px]">
                      {t.name}
                    </span>
                    
                    {templateIdToDeleteConfirm === t.id ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplateFromDb(t.id, e);
                          }}
                          title="Confirm delete"
                          className="p-1 rounded-[var(--radius-control)] text-[var(--system-red)] hover:bg-[var(--fill-tertiary)] cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTemplateIdToDeleteConfirm(null);
                          }}
                          title="Cancel"
                          className="p-1 rounded-[var(--radius-control)] text-[var(--label-tertiary)] hover:bg-[var(--fill-tertiary)] hover:text-[var(--label)] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTemplateIdToDeleteConfirm(t.id);
                        }}
                        className="p-1 text-[var(--label-quaternary)] hover:text-[var(--system-red)] opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Remove from Projects"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className={chromeSectionLabel}>
              Analyze
            </span>
            <button
              onClick={() => {
                setActiveSection('comparison');
                setIsSidebarOpen(false);
              }}
              className={cn(chromeNav(activeSection === 'comparison'), "justify-between")}
            >
              <div className="flex items-center gap-[var(--space-3)]">
                <GitCompare className="w-4 h-4 shrink-0" />
                <span>Compare</span>
              </div>
              <span 
                className={cn(
                  "text-[length:var(--text-caption-2-size)] leading-[var(--text-caption-2-line)] px-[var(--space-2)] py-0.5 rounded-[var(--radius-capsule)] font-[family-name:var(--font-numeric)]",
                  activeSection === 'comparison'
                    ? "bg-[var(--tint)] text-[var(--on-tint)]"
                    : "bg-[var(--fill-tertiary)] text-[var(--label-secondary)]"
                )}
              >
                {comparedProjects.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection('optimization');
                setIsSidebarOpen(false);
              }}
              className={chromeNav(activeSection === 'optimization')}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Optimize</span>
            </button>
          </div>

          <div>
            <span className={chromeSectionLabel}>
              Design
            </span>
            {STEPS.map((step) => (
              <div key={step.id}>
                <button
                  onClick={() => {
                    setCurrentStep(step.id);
                    setActiveSection(step.sections[0]);
                    setIsSidebarOpen(false);
                  }}
                  className={chromeNav(currentStep === step.id && activeSection !== 'comparison' && activeSection !== 'optimization')}
                >
                  <step.icon className="w-4 h-4 shrink-0" />
                  <span>{step.name.replace(/^\d+\.\s*/, '')}</span>
                </button>

                {currentStep === step.id && (
                  <div className="ml-[var(--space-5)] pl-[var(--space-2)] shadow-[inset_0.5px_0_0_var(--separator)] py-[var(--space-1)]">
                    {step.id === 1 && (
                      <>
                        {[
                          { id: 'grid', name: 'Grid', icon: LayoutDashboard },
                          { id: 'tenant', name: 'Tenant loads', icon: Users },
                        ].map((section) => (
                          <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={chromeSubnav(activeSection === section.id)}
                          >
                            <section.icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{section.name}</span>
                          </button>
                        ))}
                      </>
                    )}
                    {step.id === 2 && (
                      <>
                        {[
                          { id: 'battery', name: 'Battery', icon: Battery },
                          { id: 'rectifier', name: 'Rectifier', icon: Zap },
                          { id: 'solar', name: 'Solar', icon: Sun },
                          { id: 'dg', name: 'Generator', icon: Server },
                          { id: 'cabinet', name: 'Cabinets', icon: Box },
                          { id: 'monitoring', name: 'Monitoring', icon: Monitor },
                        ].map((section) => (
                          <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={chromeSubnav(activeSection === section.id)}
                          >
                            <section.icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{section.name}</span>
                          </button>
                        ))}
                      </>
                    )}
                    {step.id === 5 && (
                      <>
                        {[
                          { id: 'costs', name: 'Unit costs', icon: ListChecks },
                          { id: 'financials', name: 'Financials', icon: TrendingUp },
                        ].map((section) => (
                          <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={chromeSubnav(activeSection === section.id)}
                          >
                            <section.icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{section.name}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>


      </aside>

      <main className="flex-1 lg:ml-[var(--sidebar-width)] p-[var(--space-4)] md:p-[var(--space-8)] pt-[calc(var(--toolbar-height)+var(--space-6))] lg:pt-[calc(var(--toolbar-height)+var(--space-6))] grid grid-cols-1 gap-8">
        {showAdminTab ? (
          <AdminPanel currentUser={currentUser!} isDarkMode={isDarkMode} onClose={() => {
            setShowAdminTab(false);
            setSystemTemplates(getSystemTemplates());
          }} />
        ) : (
          <div className="space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="step-card bg-[var(--bg-elevated)] rounded-[var(--radius-card)] p-[var(--space-6)] md:p-[var(--space-8)] shadow-[0_0_0_0.5px_var(--separator)]"
            >
              {activeSection === 'grid' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-500" />
                    Grid
                  </h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Input Selection */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Grid condition</label>
                        <select 
                          value={inputs.gridCondition}
                          onChange={(e) => setInputs({...inputs, gridCondition: e.target.value as GridCondition})}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-colors cursor-pointer"
                        >
                          <option value="Good">Good</option>
                          <option value="Poor">Poor</option>
                          <option value="Bad">Bad</option>
                          <option value="Off-grid">Off-grid</option>
                        </select>
                      </div>
                      {inputs.gridCondition !== 'Off-grid' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400">Outages per day</label>
                            <NumericInput 
                              value={inputs.dailyOutages ?? ""}
                              onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, dailyOutages: val}))}
                              className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400">Hours per outage</label>
                            <NumericInput 
                              value={inputs.outageDuration ?? ""}
                              onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, outageDuration: val}))}
                              className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Interactive Visualization Card */}
                    <div className="rounded-[var(--radius-element)] p-5 space-y-4 flex flex-col justify-between bg-[var(--fill-quaternary)] shadow-[0_0_0_0.5px_var(--separator)]">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 rounded-[var(--radius-element)] p-3 bg-[var(--bg-elevated)] shadow-[0_0_0_0.5px_var(--separator)]">
                          <span className="text-[length:var(--text-caption-1-size)] text-[var(--label-secondary)]">Grid availability</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[length:var(--text-title-3-size)] font-semibold text-[var(--system-green)] font-[family-name:var(--font-numeric)]">
                              {totalGridAvailabilityHours.toFixed(1)}
                            </span>
                            <span className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)]">h/day</span>
                          </div>
                        </div>
                        <div className="space-y-1 rounded-[var(--radius-element)] p-3 bg-[var(--bg-elevated)] shadow-[0_0_0_0.5px_var(--separator)]">
                          <span className="text-[length:var(--text-caption-1-size)] text-[var(--label-secondary)]">Outage hours</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[length:var(--text-title-3-size)] font-semibold text-[var(--tint)] font-[family-name:var(--font-numeric)]">
                              {totalOutageHours.toFixed(1)}
                            </span>
                            <span className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)]">h/day</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[length:var(--text-caption-1-size)] text-[var(--label-secondary)]">
                          <span>24-hour timeline</span>
                          <span className="font-[family-name:var(--font-numeric)] text-[var(--label-tertiary)]">starts with grid</span>
                        </div>
                        
                        <div className="w-full h-8 rounded-[var(--radius-control)] overflow-hidden flex select-none relative bg-[var(--fill-tertiary)]">
                          {gridSegments.map((seg, sIdx) => (
                            <div 
                              key={sIdx}
                              style={{ 
                                width: `${seg.widthPct}%`,
                                backgroundColor: seg.type === 'grid' ? 'var(--system-green)' : 'var(--tint)'
                              }}
                              className="h-full relative flex items-center justify-center border-r border-black/20 last:border-r-0 group/seg cursor-pointer hover:opacity-90"
                            >
                              {seg.widthPct > 8 && (
                                <span className="truncate px-1 text-[length:var(--text-caption-2-size)] font-semibold text-black/70">
                                  {seg.type === 'grid' ? 'Grid' : 'Out'}
                                </span>
                              )}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/seg:block px-3 py-1.5 rounded-[var(--radius-element)] text-[length:var(--text-caption-1-size)] text-[var(--label)] whitespace-nowrap z-50 pointer-events-none bg-[var(--material-thick-fill)] backdrop-blur-[var(--material-blur-thick)] shadow-[var(--shadow-menu)]">
                                <div className="font-semibold flex items-center gap-1.5 mb-0.5">
                                  <span className={cn("w-1.5 h-1.5 rounded-full", seg.type === 'grid' ? "bg-[var(--system-green)]" : "bg-[var(--tint)]")} />
                                  {seg.type === 'grid' ? 'Grid connected' : 'Outage'}
                                </div>
                                <div className="text-[var(--label-secondary)] font-[family-name:var(--font-numeric)]">{seg.duration.toFixed(2)} h · {seg.timeRange}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center text-[length:var(--text-caption-2-size)] text-[var(--label-tertiary)] font-[family-name:var(--font-numeric)]">
                          <span>00:00</span>
                          <span>12:00</span>
                          <span>24:00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'tenant' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5 text-red-500" />
                      Tenant loads
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {inputs.tenantLoads.map((load, idx) => (
                      <React.Fragment key={idx}>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[length:var(--text-footnote-size)] font-semibold text-[var(--tint)]">Tenant {idx + 1}</span>
                            {inputs.tenantLoads.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = inputs.tenantLoads.filter((_, i) => i !== idx);
                                  setInputs({
                                    ...inputs,
                                    numTenants: updated.length,
                                    tenantLoads: updated
                                  });
                                }}
                                className="text-gray-500 hover:text-red-500 transition-colors p-1 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 cursor-pointer"
                                title={`Remove Tenant ${idx + 1}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 uppercase">Peak (kW)</label>
                              <NumericInput 
                                value={load.peakLoad ?? ""}
                                onChange={(e) => handleNumericInput(e.target.value, (val) => updateTenantLoad(idx, 'peakLoad', val))}
                                className="w-full bg-black/40 border border-white/10 rounded-lg text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 uppercase">Average (kW)</label>
                              <NumericInput 
                                value={load.averageLoad ?? ""}
                                onChange={(e) => handleNumericInput(e.target.value, (val) => updateTenantLoad(idx, 'averageLoad', val))}
                                className="w-full bg-black/40 border border-white/10 rounded-lg text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 uppercase">Running (kW)</label>
                              <NumericInput 
                                value={load.runningLoad ?? ""}
                                onChange={(e) => handleNumericInput(e.target.value, (val) => updateTenantLoad(idx, 'runningLoad', val))}
                                className="w-full bg-black/40 border border-white/10 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {idx === 0 && inputs.tenantLoads.length < 4 && (
                          <div className="py-2 flex items-center justify-center border border-dashed border-white/5 rounded-xl px-4 bg-white/[0.01]">
                            <button
                              type="button"
                              onClick={() => {
                                const nextCount = inputs.tenantLoads.length + 1;
                                handleNumTenantsChange(nextCount);
                              }}
                              className="px-3 h-8 bg-[var(--tint)] text-[var(--on-tint)] text-[length:var(--text-footnote-size)] font-medium rounded-[var(--radius-control)] cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add tenant
                            </button>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'battery' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Battery className="w-5 h-5 text-red-500" />
                    Battery
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Backup Hours</label>
                      <NumericInput 
                        value={inputs.battery.backupHours ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, battery: {...inputs.battery, backupHours: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Module Capacity (AH)</label>
                      <NumericInput 
                        value={inputs.battery.moduleCapacity ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, battery: {...inputs.battery, moduleCapacity: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">DoD (%)</label>
                      <NumericInput 
                        value={inputs.battery.dod ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, battery: {...inputs.battery, dod: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Ageing Factor / Retained Capacity (%)</label>
                      <NumericInput 
                        value={inputs.battery.ageing ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, battery: {...inputs.battery, ageing: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Max Useful Life (Years)</label>
                      <NumericInput 
                        value={inputs.battery.maxUsefulLife ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, battery: {...inputs.battery, maxUsefulLife: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Capacity Tolerance (AH)</label>
                      <NumericInput 
                        value={inputs.battery.toleranceMargin ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, battery: {...inputs.battery, toleranceMargin: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Battery Voltage (V)</label>
                      <NumericInput 
                        value={inputs.battery.ratedVoltage ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, battery: {...inputs.battery, ratedVoltage: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'rectifier' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Server className="w-5 h-5 text-red-500" />
                    Rectifier
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Module Capacity (kW)</label>
                      <NumericInput 
                        value={inputs.rectifier.moduleCapacity ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, rectifier: {...inputs.rectifier, moduleCapacity: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Rectifier Voltage (V)</label>
                      <NumericInput 
                        value={inputs.rectifier.systemVoltage ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, rectifier: {...inputs.rectifier, systemVoltage: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Battery Charging Rate (C)</label>
                      <NumericInput 
                        value={inputs.rectifier.batteryChargingRate ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, rectifier: {...inputs.rectifier, batteryChargingRate: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">System Efficiency (%)</label>
                      <NumericInput 
                        value={inputs.rectifier.efficiency ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, rectifier: {...inputs.rectifier, efficiency: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Number of Slots</label>
                      <NumericInput 
                        value={inputs.rectifier.slots ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, rectifier: {...inputs.rectifier, slots: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Max Useful Life (Years)</label>
                      <NumericInput 
                        value={inputs.rectifier.maxUsefulLife ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, rectifier: {...inputs.rectifier, maxUsefulLife: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>

                    {(rectifierStats.totalRectifierCapacityKW > rectifierStats.coreCapacity || inputs.rectifier.slots < rectifierStats.rectifierModules) && (
                      <div className="col-span-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4" />
                          System Configuration Alert
                        </div>
                        <div className="space-y-1">
                          {rectifierStats.totalRectifierCapacityKW > rectifierStats.coreCapacity && (
                            <p className="text-xs text-red-400/80">
                              • Total rectifier capacity ({rectifierStats.totalRectifierCapacityKW}kW) exceeds the maximum available core capacity ({rectifierStats.coreCapacity}kW).
                            </p>
                          )}
                          {inputs.rectifier.slots < rectifierStats.rectifierModules && (
                            <p className="text-xs text-red-400/80">
                              • User-defined slots ({inputs.rectifier.slots}) are less than the required rectifier modules ({rectifierStats.rectifierModules}).
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'solar' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Sun className="w-5 h-5 text-red-500" />
                      Solar
                    </h2>
                    <div className="inline-flex items-center p-[3px] rounded-[var(--radius-capsule)] bg-[var(--fill-tertiary)] shadow-[0_0_0_0.5px_var(--separator)] select-none">
                      <button
                        onClick={() => setInputs({...inputs, solar: {...inputs.solar, enabled: false}})}
                        className={cn(
                          "px-[var(--space-3)] h-7 rounded-[var(--radius-capsule)] text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] cursor-pointer",
                          !inputs.solar.enabled 
                            ? "bg-[var(--bg-elevated)] text-[var(--label)] shadow-[0_1px_2px_rgba(0,0,0,0.12)]" 
                            : "text-[var(--label-secondary)] hover:text-[var(--label)]"
                        )}
                      >
                        Off
                      </button>
                      <button
                        onClick={() => setInputs({...inputs, solar: {...inputs.solar, enabled: true}})}
                        className={cn(
                          "px-[var(--space-3)] h-7 rounded-[var(--radius-capsule)] text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] cursor-pointer",
                          inputs.solar.enabled 
                            ? "bg-[var(--bg-elevated)] text-[var(--label)] shadow-[0_1px_2px_rgba(0,0,0,0.12)]" 
                            : "text-[var(--label-secondary)] hover:text-[var(--label)]"
                        )}
                      >
                        On
                      </button>
                    </div>
                  </div>
                  
                  {inputs.solar.enabled && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Total Capacity (kWp)</label>
                        <NumericInput 
                          value={inputs.solar.totalCapacity ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, solar: {...inputs.solar, totalCapacity: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Panel Capacity (Wp)</label>
                        <NumericInput 
                          value={inputs.solar.panelCapacity ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, solar: {...inputs.solar, panelCapacity: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Charger Module (kW)</label>
                        <NumericInput 
                          value={inputs.solar.chargerModuleCapacity ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, solar: {...inputs.solar, chargerModuleCapacity: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Annual Peak Hours (kWh/m2)</label>
                        <NumericInput 
                          value={inputs.solar.annualPeakHours ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, solar: {...inputs.solar, annualPeakHours: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Panel/Structure Life (Years)</label>
                        <NumericInput 
                          value={inputs.solar.panelStructureMaxUsefulLife ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, solar: {...inputs.solar, panelStructureMaxUsefulLife: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Solar Rectifier Life (Years)</label>
                        <NumericInput 
                          value={inputs.solar.rectifierMaxUsefulLife ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, solar: {...inputs.solar, rectifierMaxUsefulLife: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Overall Efficiency (%)</label>
                        <NumericInput 
                          value={inputs.solar.overallEfficiency ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, solar: {...inputs.solar, overallEfficiency: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {activeSection === 'dg' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Zap className="w-5 h-5 text-red-500" />
                      Generator
                    </h2>
                    <div className="inline-flex items-center p-[3px] rounded-[var(--radius-capsule)] bg-[var(--fill-tertiary)] shadow-[0_0_0_0.5px_var(--separator)] select-none">
                      <button
                        onClick={() => setInputs({...inputs, dg: {...inputs.dg, enabled: false}})}
                        className={cn(
                          "px-[var(--space-3)] h-7 rounded-[var(--radius-capsule)] text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] cursor-pointer",
                          !inputs.dg.enabled 
                            ? "bg-[var(--bg-elevated)] text-[var(--label)] shadow-[0_1px_2px_rgba(0,0,0,0.12)]" 
                            : "text-[var(--label-secondary)] hover:text-[var(--label)]"
                        )}
                      >
                        Off
                      </button>
                      <button
                        onClick={() => setInputs({...inputs, dg: {...inputs.dg, enabled: true}})}
                        className={cn(
                          "px-[var(--space-3)] h-7 rounded-[var(--radius-capsule)] text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] cursor-pointer",
                          inputs.dg.enabled 
                            ? "bg-[var(--bg-elevated)] text-[var(--label)] shadow-[0_1px_2px_rgba(0,0,0,0.12)]" 
                            : "text-[var(--label-secondary)] hover:text-[var(--label)]"
                        )}
                      >
                        On
                      </button>
                    </div>
                  </div>
                  
                  {inputs.dg.enabled && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Operation Method</label>
                        <select 
                          value={inputs.dg.operationMethod ?? ""}
                          onChange={(e) => setInputs({...inputs, dg: {...inputs.dg, operationMethod: e.target.value as any}})}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        >
                          <option value="CDC">CDC</option>
                          <option value="Non-CDC">Non-CDC</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">DG Phases</label>
                        <select 
                          value={inputs.dg.phases ?? ""}
                          onChange={(e) => setInputs({...inputs, dg: {...inputs.dg, phases: e.target.value as any}})}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        >
                          <option value="1 Phase">1 Phase</option>
                          <option value="3 Phase">3 Phase</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Calculated DG Rating (kVA)</label>
                        <div className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-bold">
                          {rectifierStats.selectedDGKva} kVA
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Power Factor</label>
                        <NumericInput 
                          value={inputs.dg.powerFactor ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, dg: {...inputs.dg, powerFactor: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Max Load Rate (%)</label>
                        <NumericInput 
                          value={inputs.dg.maxLoadRateOngrid ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, dg: {...inputs.dg, maxLoadRateOngrid: val, maxLoadRateOffgrid: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Minor Overhaul (Hrs)</label>
                        <NumericInput 
                          value={inputs.dg.minorOverhaulHours ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, dg: {...inputs.dg, minorOverhaulHours: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Major Overhaul (Hrs)</label>
                        <NumericInput 
                          value={inputs.dg.majorOverhaulHours ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, dg: {...inputs.dg, majorOverhaulHours: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">PM Hours</label>
                        <NumericInput 
                          value={inputs.dg.periodicMaintenanceHours ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, dg: {...inputs.dg, periodicMaintenanceHours: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">PM Period (Months)</label>
                        <NumericInput 
                          value={inputs.dg.pmPeriodMonths ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, dg: {...inputs.dg, pmPeriodMonths: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Max Useful Hours</label>
                        <NumericInput 
                          value={inputs.dg.maxUsefulHours ?? ""}
                          onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, dg: {...inputs.dg, maxUsefulHours: val}}))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {activeSection === 'cabinet' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Box className="w-5 h-5 text-red-500" />
                    Cabinets
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Cabinet Fan Power (W)</label>
                      <NumericInput 
                        value={inputs.cabinet.fanPowerConsumption ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, cabinet: {...inputs.cabinet, fanPowerConsumption: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Cabinet Life (Years)</label>
                      <NumericInput 
                        value={inputs.cabinet.maxUsefulLife ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, cabinet: {...inputs.cabinet, maxUsefulLife: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Power Equipment Cabinet Battery Capacity (AH)</label>
                      <NumericInput 
                        value={inputs.cabinet.equipmentCabinetBatteryCapacity ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, cabinet: {...inputs.cabinet, equipmentCabinetBatteryCapacity: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Battery Cabinet Battery Capacity (AH)</label>
                      <NumericInput 
                        value={inputs.cabinet.batteryCabinetCapacity ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, cabinet: {...inputs.cabinet, batteryCabinetCapacity: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={inputs.cabinet.additionalEquipmentCabinet}
                        onChange={(e) => setInputs({...inputs, cabinet: {...inputs.cabinet, additionalEquipmentCabinet: e.target.checked}})}
                        className="w-4 h-4 rounded border-white/10 bg-black/40 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Extra Equipment Cabinet</span>
                    </label>
                    {inputs.cabinet.additionalEquipmentCabinet && (
                      <input 
                        type="number"
                        value={inputs.cabinet.additionalEquipmentCabinetCount ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, cabinet: {...inputs.cabinet, additionalEquipmentCabinetCount: val}}))}
                        className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm outline-none focus:border-red-500"
                      />
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'monitoring' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-red-500" />
                    Monitoring
                  </h2>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={inputs.remoteMonitoring.enabled}
                        onChange={(e) => setInputs({...inputs, remoteMonitoring: {...inputs.remoteMonitoring, enabled: e.target.checked}})}
                        className="w-4 h-4 rounded border-white/10 bg-black/40 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Enable Monitoring</span>
                    </label>
                  </div>
                  {inputs.remoteMonitoring.enabled && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Remote Monitoring Max Useful Life (Years)</label>
                      <NumericInput 
                        value={inputs.remoteMonitoring.maxUsefulLife ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, remoteMonitoring: {...inputs.remoteMonitoring, maxUsefulLife: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'operation' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-red-500" />
                      Operations
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <button
                        onClick={handleExportOperationXLS}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-control)] bg-[var(--fill-tertiary)] text-[length:var(--text-footnote-size)] font-medium text-[var(--label)] hover:bg-[var(--fill-secondary)] whitespace-nowrap"
                      >
                        <Save className="w-3.5 h-3.5 text-green-500" />
                        Export XLS
                      </button>
                      <button
                        onClick={handleExportOperationPDF}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-control)] bg-[var(--fill-tertiary)] text-[length:var(--text-footnote-size)] font-medium text-[var(--label)] hover:bg-[var(--fill-secondary)] whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5 text-red-500" />
                        Export PDF
                      </button>
                    </div>
                  </div>

                  {modellingResults.length === 1 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Existing single model view */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-[var(--label)]">Battery health</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">DC Running Current</span>
                            <span className="text-sm font-bold text-white">{rectifierStats.dcRunningCurrent?.toFixed(2)} A</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Actual DoD</span>
                            <span className="text-sm font-bold text-red-500">{rectifierStats.actualDoD}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Available Cycles (Li-ion)</span>
                            <span className="text-sm font-bold text-green-500">{rectifierStats.batteryCycles?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Battery Autonomy (at DoD)</span>
                            <span className="text-sm font-bold text-white">{rectifierStats.batteryRunningHourPerCycle?.toFixed(2)} h</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Battery Cycles per Day</span>
                            <span className="text-sm font-bold text-blue-400">
                              {rectifierStats.batteryCyclesPerDay?.toFixed(3)}
                              {rectifierStats.isMonteCarlo && <span className="ml-1 text-[10px] text-red-500 font-bold">(Monte Carlo)</span>}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Battery Usage per Hour</span>
                            <span className="text-sm font-bold text-white">{(rectifierStats.batteryUsagePerHourAH * 100)?.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-[var(--label)]">System capacity</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Total Rectifier Load</span>
                            <span className="text-sm font-bold text-white">{rectifierStats.totalRectifierLoadKW?.toFixed(2)} kW</span>
                          </div>
                          {inputs.dg.enabled && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">Required DG Rating</span>
                            <span className="text-sm font-bold text-white">{rectifierStats.requiredDGKva?.toFixed(2)} kVA</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-sm text-gray-400">DC Availability</span>
                            <span className={`text-sm font-bold ${(rectifierStats.dcAvailabilityPct ?? 100) < 99.99 ? 'text-amber-400' : 'text-green-500'}`}>
                              {(rectifierStats.dcAvailabilityPct ?? 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Grid Outage</span>
                            <span className="text-sm font-bold text-white">{(rectifierStats.dailyOutageHours ?? 0).toFixed(2)} h/day</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Residual Unserved</span>
                            <span className={`text-sm font-bold ${(rectifierStats.dailyUnservedHours ?? 0) > 0.01 ? 'text-red-500' : 'text-white'}`}>
                              {(rectifierStats.dailyUnservedHours ?? 0).toFixed(2)} h/day
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-[var(--label)]">Generator</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">CDC per Day</span>
                            <span className="text-sm font-bold text-white">
                              {rectifierStats.cdcPerDay?.toFixed(2)}
                              {rectifierStats.isMonteCarlo && <span className="ml-1 text-[10px] text-red-500 font-bold">(Monte Carlo)</span>}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">DG Running Hours/Day</span>
                            <span className="text-sm font-bold text-white">
                              {rectifierStats.dgRunningHoursPerDay?.toFixed(2)} h
                              {rectifierStats.isMonteCarlo && <span className="ml-1 text-[10px] text-red-500 font-bold">(Monte Carlo)</span>}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">DG Load Rate</span>
                            <span className="text-sm font-bold text-white">{rectifierStats.dgLoadRate?.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Fuel Rate</span>
                            <span className="text-sm font-bold text-white">
                              {rectifierStats.dgFuelRate?.toFixed(3)} L/kWh
                              {rectifierStats.isMonteCarlo && <span className="ml-1 text-[10px] text-red-500 font-bold">(Monte Carlo)</span>}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-sm text-gray-400">Daily Fuel Consumption</span>
                            <span className="text-sm font-bold text-red-500">{rectifierStats.dgDailyFuel?.toFixed(2)} L</span>
                          </div>
                        </div>
                      </div>

                      {/* Daily Energy Mix & Computed kWh Card */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 space-y-4 col-span-1 md:col-span-3">
                        <h3 className="text-sm font-semibold text-[var(--label)]">Daily energy mix (estimate)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <span className="text-xs text-gray-400 block mb-1">Grid Contribution</span>
                            <div className="text-lg font-bold text-white mb-1">
                              {rectifierStats.dailyGridEnergy?.toFixed(2)} kWh
                            </div>
                            <div className="text-xs text-[#E50914] font-semibold">
                              {(() => {
                                const g = rectifierStats.dailyGridEnergy || 0;
                                const d = rectifierStats.dgDailyEnergyGeneration || 0;
                                const s = rectifierStats.dailySolarEnergy || 0;
                                const tot = g + d + s;
                                return tot > 0 ? `${((g / tot) * 100).toFixed(1)}% energy mix` : '0.0%';
                              })()}
                            </div>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <span className="text-xs text-gray-400 block mb-1">DG Contribution</span>
                            <div className="text-lg font-bold text-white mb-1">
                              {rectifierStats.dgDailyEnergyGeneration?.toFixed(2)} kWh
                            </div>
                            <div className="text-xs text-amber-500 font-semibold">
                              {(() => {
                                const g = rectifierStats.dailyGridEnergy || 0;
                                const d = rectifierStats.dgDailyEnergyGeneration || 0;
                                const s = rectifierStats.dailySolarEnergy || 0;
                                const tot = g + d + s;
                                return tot > 0 ? `${((d / tot) * 100).toFixed(1)}% energy mix` : '0.0%';
                              })()}
                            </div>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <span className="text-xs text-gray-400 block mb-1">Solar Contribution</span>
                            <div className="text-lg font-bold text-white mb-1">
                              {rectifierStats.dailySolarEnergy?.toFixed(2)} kWh
                            </div>
                            <div className="text-xs text-green-400 font-semibold">
                              {(() => {
                                const g = rectifierStats.dailyGridEnergy || 0;
                                const d = rectifierStats.dgDailyEnergyGeneration || 0;
                                const s = rectifierStats.dailySolarEnergy || 0;
                                const tot = g + d + s;
                                return tot > 0 ? `${((s / tot) * 100).toFixed(1)}% energy mix` : '0.0%';
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px] md:min-w-[800px]">
                        <thead>
                          <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5">
                            <th className="p-2 border-b border-white/10 sticky left-0 bg-[#121212] z-20 min-w-[80px] max-w-[120px] whitespace-normal">Operational Metric</th>
                            {modellingResults.map((res, idx) => {
                              const loadText = `${res.totalAverageLoad?.toFixed(1)} kW`;
                              const solarVal = res.actualSolarCapacity ?? 0;
                              const subtext = solarVal > 0 ? `${loadText} / ${solarVal.toFixed(1)} kWp` : loadText;
                              return (
                                <th key={idx} className="p-4 border-b border-l border-white/10 text-center bg-red-500/5 min-w-[80px] md:min-w-[150px]">
                                  <div className="font-bold text-white">{res.name}</div>
                                  <div className="text-[10px] text-gray-400 font-normal mt-0.5">{subtext}</div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {/* Battery Metrics */}
                          <tr className="bg-white/5">
                            <td colSpan={modellingResults.length + 1} className="p-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 sticky left-0 bg-[#121212] z-10 whitespace-normal">
                              Battery Health
                            </td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">DC Running Current (A)</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.dcRunningCurrent?.toFixed(2)}</td>)}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Actual DoD (%)</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 text-red-400">{res.rectifierStats.actualDoD}%</td>)}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Battery Autonomy (at DoD) (h)</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.batteryRunningHourPerCycle?.toFixed(2)}</td>)}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Battery Cycles per Day</td>
                            {modellingResults.map((res, idx) => (
                              <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 text-blue-400">
                                {res.rectifierStats.batteryCyclesPerDay?.toFixed(3)}
                                {res.rectifierStats.isMonteCarlo && <div className="text-[8px] text-red-500 font-bold">Monte Carlo</div>}
                              </td>
                            ))}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Available Cycles (Li-ion)</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 text-green-400">{res.rectifierStats.batteryCycles?.toLocaleString()}</td>)}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Battery Usage per Hour (%)</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{(res.rectifierStats.batteryUsagePerHourAH * 100)?.toFixed(2)}%</td>)}
                          </tr>

                          <tr className="bg-white/5">
                            <td colSpan={modellingResults.length + 1} className="p-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 sticky left-0 bg-[#121212] z-10 whitespace-normal">
                              DC Availability
                            </td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">DC Availability (%)</td>
                            {modellingResults.map((res, idx) => (
                              <td key={idx} className={`p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 ${(res.rectifierStats.dcAvailabilityPct ?? 100) < 99.99 ? 'text-amber-400' : 'text-green-400'}`}>
                                {(res.rectifierStats.dcAvailabilityPct ?? 100).toFixed(2)}%
                              </td>
                            ))}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Grid Outage (h/day)</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{(res.rectifierStats.dailyOutageHours ?? 0).toFixed(2)}</td>)}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Residual Unserved (h/day)</td>
                            {modellingResults.map((res, idx) => (
                              <td key={idx} className={`p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 ${(res.rectifierStats.dailyUnservedHours ?? 0) > 0.01 ? 'text-red-400' : ''}`}>
                                {(res.rectifierStats.dailyUnservedHours ?? 0).toFixed(2)}
                              </td>
                            ))}
                          </tr>

                          {/* DG Metrics */}
                          {inputs.dg.enabled && (
                            <>
                              <tr className="bg-white/5">
                                <td colSpan={modellingResults.length + 1} className="p-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 sticky left-0 bg-[#121212] z-10 whitespace-normal">
                                  DG Operation
                                </td>
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">DG Running Hours/Day (h)</td>
                                {modellingResults.map((res, idx) => (
                                  <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">
                                    {res.rectifierStats.dgRunningHoursPerDay?.toFixed(2)}
                                    {res.rectifierStats.isMonteCarlo && <div className="text-[8px] text-red-500 font-bold">Monte Carlo</div>}
                                  </td>
                                ))}
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Daily Fuel Consumption (L)</td>
                                {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 text-red-400">{res.rectifierStats.dgDailyFuel?.toFixed(2)}</td>)}
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">CDC per Day</td>
                                {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.cdcPerDay?.toFixed(2)}</td>)}
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">DG Load Rate (%)</td>
                                {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.dgLoadRate?.toFixed(1)}%</td>)}
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Fuel Rate (L/kWh)</td>
                                {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.dgFuelRate?.toFixed(3)}</td>)}
                              </tr>
                            </>
                          )}

                          {/* Solar Metrics */}
                          {inputs.solar.enabled && (
                            <>
                              <tr className="bg-white/5">
                                <td colSpan={modellingResults.length + 1} className="p-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 sticky left-0 bg-[#121212] z-10 whitespace-normal">
                                  Solar Performance
                                </td>
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Panel Quantity</td>
                                {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.solarPanelQuantity}</td>)}
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Actual Capacity (kWp)</td>
                                {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 text-green-400">{res.rectifierStats.actualSolarCapacity?.toFixed(2)}</td>)}
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Solar Charger Modules</td>
                                {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.solarChargerModuleQuantity}</td>)}
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Solar Expansion Subrack</td>
                                {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 text-red-400">{res.rectifierStats.solarExpansionSubrackQty}</td>)}
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Daily Generation (kWh)</td>
                                {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.dailySolarGeneration?.toFixed(2)}</td>)}
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Daily Excess Solar (kWh)</td>
                                {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.dailyExcessSolarKW?.toFixed(2)}</td>)}
                              </tr>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Solar Max Charging Rate (C)</td>
                                {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 text-red-400">{res.rectifierStats.solarMaxChargingRate?.toFixed(3)}</td>)}
                              </tr>
                            </>
                          )}

                          {/* Daily Energy Mix & Computed kWh */}
                          <tr className="bg-white/5">
                            <td colSpan={modellingResults.length + 1} className="p-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 sticky left-0 bg-[#121212] z-10 whitespace-normal">
                              Daily Energy Mix & Computed kWh (Estimation Only)
                            </td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Grid Energy (kWh/day)</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 font-semibold text-white">{res.rectifierStats.dailyGridEnergy?.toFixed(2)}</td>)}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Grid Energy Mix (%)</td>
                            {modellingResults.map((res, idx) => {
                              const grid = res.rectifierStats.dailyGridEnergy || 0;
                              const dg = res.rectifierStats.dgDailyEnergyGeneration || 0;
                              const solar = res.rectifierStats.dailySolarEnergy || 0;
                              const total = grid + dg + solar;
                              const pct = total > 0 ? (grid / total) * 100 : 0;
                              return <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 text-[#E50914] font-bold">{pct.toFixed(1)}%</td>;
                            })}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">DG Energy (kWh/day)</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 font-semibold text-white">{res.rectifierStats.dgDailyEnergyGeneration?.toFixed(2)}</td>)}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">DG Energy Mix (%)</td>
                            {modellingResults.map((res, idx) => {
                              const grid = res.rectifierStats.dailyGridEnergy || 0;
                              const dg = res.rectifierStats.dgDailyEnergyGeneration || 0;
                              const solar = res.rectifierStats.dailySolarEnergy || 0;
                              const total = grid + dg + solar;
                              const pct = total > 0 ? (dg / total) * 100 : 0;
                              return <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 text-amber-500 font-bold">{pct.toFixed(1)}%</td>;
                            })}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Solar Energy (kWh/day)</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 font-semibold text-white">{res.rectifierStats.dailySolarEnergy?.toFixed(2)}</td>)}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Solar Energy Mix (%)</td>
                            {modellingResults.map((res, idx) => {
                              const grid = res.rectifierStats.dailyGridEnergy || 0;
                              const dg = res.rectifierStats.dgDailyEnergyGeneration || 0;
                              const solar = res.rectifierStats.dailySolarEnergy || 0;
                              const total = grid + dg + solar;
                              const pct = total > 0 ? (solar / total) * 100 : 0;
                              return <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5 text-green-400 font-bold">{pct.toFixed(1)}%</td>;
                            })}
                          </tr>

                          {/* System Capacity */}
                          <tr className="bg-white/5">
                            <td colSpan={modellingResults.length + 1} className="p-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 sticky left-0 bg-[#121212] z-10 whitespace-normal">
                              System Capacity
                            </td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Adjusted Battery Capacity (AH)</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.adjustedBatteryCapacityAH}</td>)}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Total Rectifier Load (kW)</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.totalRectifierLoadKW?.toFixed(2)}</td>)}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Required DG Rating (kVA)</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.requiredDGKva?.toFixed(2)}</td>)}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Required Core Slots</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.rectifierModules + (inputs.solar.enabled ? res.rectifierStats.solarChargerModuleQuantity : 0)}</td>)}
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="p-2 text-[10px] md:text-xs text-gray-400 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-words leading-tight">Available Core Slots</td>
                            {modellingResults.map((res, idx) => <td key={idx} className="p-3 text-center text-[10px] md:text-xs font-mono border-l border-white/5">{res.rectifierStats.coreCapacity / 4}</td>)}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'boq' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-red-500" />
                      Bill of quantities
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      {modellingResults.length > 1 && (
                        <>
                          <button
                            onClick={handleExportBOQXLS}
                            className="flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-control)] bg-[var(--fill-tertiary)] text-[length:var(--text-footnote-size)] font-medium text-[var(--label)] hover:bg-[var(--fill-secondary)] whitespace-nowrap"
                          >
                            <Save className="w-3.5 h-3.5 text-green-500" />
                            Export XLS
                          </button>
                          <button
                            onClick={handleExportBOQPDF}
                            className="flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-control)] bg-[var(--fill-tertiary)] text-[length:var(--text-footnote-size)] font-medium text-[var(--label)] hover:bg-[var(--fill-secondary)] whitespace-nowrap"
                          >
                            <Download className="w-3.5 h-3.5 text-red-500" />
                            Export PDF
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {modellingResults.length === 1 ? (
                    <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-12 text-center space-y-4 shadow-[0_0_0_0.5px_var(--separator)]">
                      <div className="w-12 h-12 bg-[var(--tint-soft)] rounded-full flex items-center justify-center mx-auto">
                        <Calculator className="w-6 h-6 text-[var(--tint)]" />
                      </div>
                      <p className="text-[length:var(--text-subhead-size)] text-[var(--label-secondary)] max-w-sm mx-auto">
                        Run models before you can compare costs.
                      </p>
                      <Button
                        variant="filled"
                        onClick={() => {
                          setCurrentStep(3);
                          setActiveSection('modelling');
                        }}
                      >
                        Open Modelling
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed md:table-auto">
                          <colgroup>
                            <col className="w-[60px] md:w-[150px]" />
                            <col className="w-[60px] md:w-[100px]" />
                            {modellingResults.map((_, i) => (
                              <React.Fragment key={i}>
                                <col className="w-[40px] md:w-[60px]" />
                                <col className="w-[70px] md:w-[100px]" />
                                <col className="w-[35px] md:w-[60px]" />
                              </React.Fragment>
                            ))}
                          </colgroup>
                          <thead>
                            <tr className="text-[7px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5">
                              <th className="px-1 py-2 border-b border-white/10 sticky left-0 bg-[#121212] z-20 whitespace-normal break-all w-[60px] min-w-[60px] max-w-[60px]">Item Description</th>
                              <th className="px-1 py-2 border-b border-white/10 text-right w-[60px] min-w-[60px] max-w-[60px]">Unit Cost</th>
                              {modellingResults.map((res, idx) => {
                                const loadText = `${res.totalAverageLoad?.toFixed(1)} kW`;
                                const solarVal = res.actualSolarCapacity ?? 0;
                                const subtext = solarVal > 0 ? `${loadText} / ${solarVal.toFixed(1)} kWp` : loadText;
                                return (
                                  <th key={idx} colSpan={3} className="px-1 py-2 border-b border-l border-white/10 text-center bg-red-500/5 min-w-[145px]">
                                    <div className="font-bold text-white text-[8px] md:text-xs">{res.name}</div>
                                    <div className="text-[7px] md:text-[9px] text-gray-400 font-normal mt-0.5 whitespace-nowrap">{subtext}</div>
                                  </th>
                                );
                              })}
                            </tr>
                            <tr className="text-[6px] md:text-[9px] font-bold text-gray-600 uppercase tracking-widest bg-white/5">
                              <th className="px-1 py-1 border-b border-white/10 sticky left-0 bg-[#121212] z-20 w-[60px] min-w-[60px] max-w-[60px]"></th>
                              <th className="px-1 py-1 border-b border-white/10 w-[60px] min-w-[60px] max-w-[60px]"></th>
                              {modellingResults.map((_, idx) => (
                                <React.Fragment key={idx}>
                                  <th className="px-0.5 py-1 border-b border-l border-white/10 text-center w-[40px] min-w-[40px] max-w-[40px]">Qty</th>
                                  <th className="px-0.5 py-1 border-b border-white/10 text-right w-[70px] min-w-[70px] max-w-[70px]">Total</th>
                                  <th className="px-0.5 py-1 border-b border-white/10 text-center w-[35px] min-w-[35px] max-w-[35px]">Life</th>
                                </React.Fragment>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {Array.from(new Set(modellingResults.flatMap(r => r.boq.map(b => b.item))))
                              .sort((a: string, b: string) => {
                                const indexA = BOQ_SORT_ORDER.indexOf(a);
                                const indexB = BOQ_SORT_ORDER.indexOf(b);
                                if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                                if (indexA === -1) return 1;
                                if (indexB === -1) return -1;
                                return indexA - indexB;
                              })
                              .map((itemName) => {
                              const firstItem = modellingResults.find(r => r.boq.some(b => b.item === itemName))?.boq.find(b => b.item === itemName);
                              return (
                                <tr key={itemName} className="hover:bg-white/5 transition-colors group">
                                  <td className="px-1 py-2 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-all leading-tight w-[60px] min-w-[60px] max-w-[60px]">
                                    <p className="text-[7px] md:text-xs font-bold text-white leading-tight">{itemName}</p>
                                    <p className="text-[6px] md:text-[10px] text-gray-500 mt-0.5">{firstItem?.description}</p>
                                  </td>
                                  <td className="px-1 py-2 text-right text-[7px] md:text-xs text-gray-400 font-mono w-[60px] min-w-[60px] max-w-[60px]">
                                    {renderFormattedCost(firstItem?.unitCost || 0)}
                                  </td>
                                  {modellingResults.map((res, idx) => {
                                    const modelItem = res.boq.find(b => b.item === itemName);
                                    return (
                                      <React.Fragment key={idx}>
                                        <td className="px-0.5 py-2 text-center text-[7px] md:text-xs text-white border-l border-white/5 w-[40px] min-w-[40px] max-w-[40px]">
                                          {modelItem?.quantity || 0} <span className="text-[5px] md:text-[10px] text-gray-500">{modelItem?.unit}</span>
                                        </td>
                                        <td className="px-0.5 py-2 text-right text-[7px] md:text-xs font-bold text-white font-mono w-[70px] min-w-[70px] max-w-[70px]">
                                          <CostTooltip content={modelItem?.derivation || ''}>
                                            <span className="cursor-help border-b border-dotted border-white/30 pb-0.5">
                                              {renderFormattedCost(modelItem?.total || 0)}
                                            </span>
                                          </CostTooltip>
                                        </td>
                                        <td className="px-0.5 py-2 text-center text-[7px] md:text-xs text-gray-400 w-[35px] min-w-[35px] max-w-[35px]">
                                          {modelItem?.lifespan}Y
                                        </td>
                                      </React.Fragment>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                            <tr className="bg-red-500/5 font-bold">
                              <td className="px-1 py-2 sticky left-0 bg-[#121212] z-10 text-red-400 uppercase tracking-widest text-[7px] border-r border-white/5 whitespace-normal leading-tight w-[60px] min-w-[60px] max-w-[60px]">Total CAPEX</td>
                              <td className="px-1 py-2 w-[60px] min-w-[60px] max-w-[60px]"></td>
                              {modellingResults.map((res, idx) => (
                                <React.Fragment key={idx}>
                                  <td className="px-0.5 py-2 border-l border-white/10 w-[40px] min-w-[40px] max-w-[40px]"></td>
                                  <td className="px-0.5 py-2 text-right text-red-500 font-black text-[7px] md:text-sm font-mono w-[70px] min-w-[70px] max-w-[70px]">
                                    {renderFormattedCost(res.initialCapex)}
                                  </td>
                                  <td className="px-0.5 py-2 w-[35px] min-w-[35px] max-w-[35px]"></td>
                                </React.Fragment>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-sm font-semibold text-[var(--label)] flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          Annual Operating Expenses (Year 1)
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleExportOpexXLS}
                            className="flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-control)] bg-[var(--fill-tertiary)] text-[length:var(--text-footnote-size)] font-medium text-[var(--label)] hover:bg-[var(--fill-secondary)] whitespace-nowrap"
                          >
                            <Save className="w-3.5 h-3.5 text-green-500" />
                            Export XLS
                          </button>
                          <button
                            onClick={handleExportOpexPDF}
                            className="flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-control)] bg-[var(--fill-tertiary)] text-[length:var(--text-footnote-size)] font-medium text-[var(--label)] hover:bg-[var(--fill-secondary)] whitespace-nowrap"
                          >
                            <Download className="w-3.5 h-3.5 text-red-500" />
                            Export PDF
                          </button>
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed md:table-auto">
                          <colgroup>
                            <col className="w-[60px] md:w-[150px]" />
                            {modellingResults.map((_, i) => (
                              <col key={i} className="w-[80px] md:w-[120px]" />
                            ))}
                          </colgroup>
                          <thead>
                            <tr className="text-[7px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5">
                              <th className="px-1 py-2 border-b border-white/10 sticky left-0 bg-[#121212] z-20 whitespace-normal break-all w-[60px] min-w-[60px] max-w-[60px]">Expense Item</th>
                              {modellingResults.map((res, idx) => (
                                <th key={idx} className="px-1 py-2 border-b border-l border-white/10 text-right bg-red-500/5 min-w-[80px]">
                                  {res.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {Array.from(new Set(modellingResults.flatMap(r => r.opexItemsYear1.map(o => o.name))))
                              .map((opexName) => (
                                <tr key={opexName} className="hover:bg-white/5 transition-colors group">
                                  <td className="px-1 py-2 text-[7px] md:text-xs font-bold text-white sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-all leading-tight w-[60px] min-w-[60px] max-w-[60px]">{opexName}</td>
                                  {modellingResults.map((res, idx) => {
                                    const opexItem = res.opexItemsYear1.find(o => o.name === opexName);
                                    return (
                                      <td key={idx} className="px-1 py-2 text-right text-[7px] md:text-xs text-gray-400 font-mono border-l border-white/5 w-[80px] min-w-[80px] max-w-[80px]">
                                        <CostTooltip content={opexItem?.derivation || ''}>
                                          <span className="cursor-help border-b border-dotted border-white/30 pb-0.5">
                                            {renderFormattedCost(opexItem?.cost || 0)}
                                          </span>
                                        </CostTooltip>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            <tr className="bg-red-600/5 font-bold">
                              <td className="px-1 py-2 text-[7px] md:text-xs font-bold text-white sticky left-0 bg-[#121212] z-10 border-r border-white/5 uppercase tracking-wider whitespace-normal leading-tight w-[60px] min-w-[60px] max-w-[60px]">TOTAL ANNUAL OPEX</td>
                              {modellingResults.map((res, idx) => (
                                <td key={idx} className="px-1 py-2 text-right text-red-500 font-black text-[7px] md:text-sm font-mono border-l border-white/5 w-[80px] min-w-[80px] max-w-[80px]">
                                  {renderFormattedCost(res.cashFlows[1].opex)}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                  )}
                </div>
              )}

              {activeSection === 'costs' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-red-500" />
                      Unit costs
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Currency:</span>
                      <select 
                        value={inputs.financials.currency}
                        onChange={(e) => setInputs({...inputs, financials: {...inputs.financials, currency: e.target.value}})}
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="USD">USD</option>
                        <option value="MYR">MYR</option>
                        <option value="PHP">PHP</option>
                        <option value="BDT">BDT</option>
                        <option value="PKR">PKR</option>
                      </select>
                    </div>
                  </div>

                  {/* Materials Section */}
                  {(() => {
                    const currencySymbol = getCurrencySymbol(inputs.financials.currency);
                    return (
                      <>
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-[var(--label)] pb-2 shadow-[inset_0_-0.5px_0_var(--separator)]">Material unit CAPEX</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.keys(inputs.costs.materials)
                              .sort((a: string, b: string) => {
                                const indexA = BOQ_SORT_ORDER.indexOf(a);
                                const indexB = BOQ_SORT_ORDER.indexOf(b);
                                if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                                if (indexA === -1) return 1;
                                if (indexB === -1) return -1;
                                return indexA - indexB;
                              })
                              .map((itemName) => (
                              <div key={itemName} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                                <span className="text-sm font-medium text-gray-300">{itemName}</span>
                                <NumericInput 
                                  value={inputs.costs.materials[itemName] ?? ""}
                                  onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({
                                    ...inputs,
                                    costs: {
                                      ...inputs.costs,
                                      materials: { ...inputs.costs.materials, [itemName]: val }
                                    }
                                  }))}
                                  prefix={currencySymbol}
                                  className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Installation Section */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-[var(--label)] pb-2 shadow-[inset_0_-0.5px_0_var(--separator)]">Installation and services</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-300">DC Base Service</span>
                                <NumericInput 
                                  value={inputs.costs.installation.dcBaseService ?? ""}
                                  onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, installation: {...inputs.costs.installation, dcBaseService: val}}}))}
                                  prefix={currencySymbol}
                                  className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Base Battery Capacity (AH)</span>
                                <NumericInput 
                                  value={inputs.costs.installation.baseBatteryCapacity ?? ""}
                                  onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, installation: {...inputs.costs.installation, baseBatteryCapacity: val}}}))}
                                  className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                                />
                              </div>
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-300">Add. Battery Install ({currencySymbol.trim()}/AH)</span>
                              <NumericInput 
                                value={inputs.costs.installation.additionalBatteryInstallPerAH ?? ""}
                                onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, installation: {...inputs.costs.installation, additionalBatteryInstallPerAH: val}}}))}
                                prefix={currencySymbol}
                                className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                              />
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-300">Add. Cabinet Install</span>
                              <NumericInput 
                                value={inputs.costs.installation.additionalCabinetInstall ?? ""}
                                onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, installation: {...inputs.costs.installation, additionalCabinetInstall: val}}}))}
                                prefix={currencySymbol}
                                className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                              />
                            </div>

                            {inputs.solar.enabled && (
                              <>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-300">Solar Structure Supply</span>
                                  <NumericInput 
                                    value={inputs.costs.installation.solarStructureSupply ?? ""}
                                    onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, installation: {...inputs.costs.installation, solarStructureSupply: val}}}))}
                                    prefix={currencySymbol}
                                    className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                                  />
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-300">Solar Panel Install</span>
                                  <NumericInput 
                                    value={inputs.costs.installation.solarPanelInstall ?? ""}
                                    onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, installation: {...inputs.costs.installation, solarPanelInstall: val}}}))}
                                    prefix={currencySymbol}
                                    className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                                  />
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-300">Solar Structure Install</span>
                                  <NumericInput 
                                    value={inputs.costs.installation.solarStructureInstall ?? ""}
                                    onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, installation: {...inputs.costs.installation, solarStructureInstall: val}}}))}
                                    prefix={currencySymbol}
                                    className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                                  />
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-300">Transport (Solar)</span>
                                  <NumericInput 
                                    value={inputs.costs.installation.transportSolar ?? ""}
                                    onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, installation: {...inputs.costs.installation, transportSolar: val}}}))}
                                    prefix={currencySymbol}
                                    className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                                  />
                                </div>
                              </>
                            )}

                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-300">Transport (DC)</span>
                              <NumericInput 
                                value={inputs.costs.installation.transportDC ?? ""}
                                onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, installation: {...inputs.costs.installation, transportDC: val}}}))}
                                prefix={currencySymbol}
                                className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                              />
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-300">Site Survey & Mob</span>
                              <NumericInput 
                                value={inputs.costs.installation.siteSurvey ?? ""}
                                onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, installation: {...inputs.costs.installation, siteSurvey: val}}}))}
                                prefix={currencySymbol}
                                className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                              />
                            </div>
                          </div>
                        </div>

                        {/* OPEX Section */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-[var(--label)] pb-2 shadow-[inset_0_-0.5px_0_var(--separator)]">Operating expenses</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-300">Annual Preventive Maint.</span>
                              <NumericInput 
                                value={inputs.costs.opex.annualPM ?? ""}
                                onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, opex: {...inputs.costs.opex, annualPM: val}}}))}
                                prefix={currencySymbol}
                                className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                              />
                            </div>

                            {inputs.solar.enabled && (
                              <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-300">Annual Solar Preventive Maintenance</span>
                                <NumericInput 
                                  value={inputs.costs.opex.solarPM ?? ""}
                                  onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, opex: {...inputs.costs.opex, solarPM: val}}}))}
                                  prefix={currencySymbol}
                                  className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                                />
                              </div>
                            )}

                            {inputs.dg.enabled && (
                              <>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-300">DG PM Cost</span>
                                  <NumericInput 
                                    value={inputs.costs.opex.dgPM ?? ""}
                                    onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, opex: {...inputs.costs.opex, dgPM: val}}}))}
                                    prefix={currencySymbol}
                                    className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                                  />
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-300">DG Minor Overhaul</span>
                                  <NumericInput 
                                    value={inputs.costs.opex.dgMinorOverhaul ?? ""}
                                    onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, opex: {...inputs.costs.opex, dgMinorOverhaul: val}}}))}
                                    prefix={currencySymbol}
                                    className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                                  />
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-300">DG Major Overhaul</span>
                                  <NumericInput 
                                    value={inputs.costs.opex.dgMajorOverhaul ?? ""}
                                    onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, opex: {...inputs.costs.opex, dgMajorOverhaul: val}}}))}
                                    prefix={currencySymbol}
                                    className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                                  />
                                </div>
                              </>
                            )}

                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-300">Fuel Hauling (Monthly)</span>
                              <NumericInput 
                                value={inputs.costs.opex.fuelHaulingMonthly ?? ""}
                                onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, opex: {...inputs.costs.opex, fuelHaulingMonthly: val}}}))}
                                prefix={currencySymbol}
                                className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                              />
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-300">Grid Tariff ({currencySymbol.trim()}/kWh)</span>
                              <NumericInput 
                                value={inputs.costs.opex.gridTariffPerKWh ?? ""}
                                onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, opex: {...inputs.costs.opex, gridTariffPerKWh: val}}}))}
                                prefix={currencySymbol}
                                className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                              />
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-300">Fuel Cost ({currencySymbol.trim()}/L)</span>
                              <NumericInput 
                                value={inputs.costs.opex.fuelCostPerLiter ?? ""}
                                onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, costs: {...inputs.costs, opex: {...inputs.costs.opex, fuelCostPerLiter: val}}}))}
                                prefix={currencySymbol}
                                className="w-32 bg-black/40 border border-white/10 rounded-lg text-sm text-right"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {activeSection === 'financials' && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-red-500" />
                        Financials
                      </h2>
                      <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mt-1">MRR is monthly recurring revenue. LCOE is lifetime cost per kWh.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleExportFinancialModelXLS}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-control)] bg-[var(--fill-tertiary)] text-[length:var(--text-footnote-size)] font-medium text-[var(--label)] hover:bg-[var(--fill-secondary)] whitespace-nowrap"
                      >
                        <Save className="w-3.5 h-3.5 text-green-500" />
                        Export XLS
                      </button>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Breakeven MRR</p>
                        <p className="text-lg font-black text-red-500">{inputs.financials.currency} {displayedStats.breakevenMRR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Prominent Model Selector */}
                  {modellingResults && (
                    <div className="bg-red-600/10 border border-red-600/20 rounded-2xl p-4 md:p-8 space-y-4 mx-4 md:mx-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-[var(--label)]">Compare models</h3>
                          <p className="text-xs text-gray-400">Toggle designs to compare overlaid cash flow projections and update metrics.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
                          {modellingResults.map((res, idx) => {
                            const isSelected = selectedModelIndices.includes(idx);
                            const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                            const colorIdx = selectedModelIndices.indexOf(idx);
                            const modelColor = colorIdx >= 0 ? colors[colorIdx % colors.length] : undefined;

                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (selectedModelIndex !== idx) {
                                    // Make it first/active model in the compared array so it updates displayed stats
                                    const filtered = selectedModelIndices.filter(i => i !== idx);
                                    setSelectedModelIndices([idx, ...filtered]);
                                  } else {
                                    // Already active model, toggle its inclusion if there are multiple
                                    if (isSelected) {
                                      if (selectedModelIndices.length > 1) {
                                        setSelectedModelIndices(selectedModelIndices.filter(i => i !== idx));
                                      }
                                    } else {
                                      setSelectedModelIndices([...selectedModelIndices, idx]);
                                    }
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 md:px-4 md:py-2 rounded-[var(--radius-control)] text-[length:var(--text-footnote-size)] font-medium transition-colors flex items-center gap-2 cursor-pointer",
                                  isSelected 
                                    ? "bg-[var(--tint-soft)] text-[var(--tint)]" 
                                    : "text-[var(--label-secondary)] hover:text-[var(--label)] bg-[var(--fill-tertiary)]"
                                )}
                              >
                                <span 
                                  className={cn(
                                    "w-2.5 h-2.5 rounded-full transition-all inline-block shrink-0 model-pill-indicator",
                                    isSelected 
                                      ? "ring-2 ring-white shadow-sm scale-110" 
                                      : "ring-1 ring-white/10"
                                  )} 
                                  style={{
                                    ['--indicator-color' as any]: isSelected ? (modelColor || '#ef4444') : '#4b5563',
                                    backgroundColor: isSelected ? (modelColor || '#ef4444') : '#4b5563'
                                  }}
                                />
                                <div className="flex flex-col items-start leading-none text-left">
                                  <span>{res.name}</span>
                                  <span className={cn("text-[length:var(--text-caption-2-size)] font-normal font-[family-name:var(--font-numeric)] mt-0.5", isSelected ? "text-[var(--tint)]" : "text-[var(--label-tertiary)]")}>
                                    {res.totalAverageLoad?.toFixed(1)} kW{res.actualSolarCapacity && res.actualSolarCapacity > 0 ? ` / ${res.actualSolarCapacity?.toFixed(1)} kWp` : ''}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Removed OPEX vs Fuel Cost Trend chart as requested */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-[var(--label)] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      Cash Flow Projection
                    </h3>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 h-[250px] md:h-[300px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={combinedCashFlows}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                          <XAxis 
                            dataKey="year" 
                            stroke={chartAxis} 
                            fontSize={11} 
                            tickFormatter={(val) => `Yr ${val}`}
                          />
                          <YAxis 
                            stroke={chartAxis} 
                            fontSize={11} 
                            tickFormatter={(val) => `${(val / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k`}
                          />
                          <Tooltip 
                            contentStyle={chartTooltipStyle}
                            labelStyle={chartTooltipLabelStyle}
                            itemStyle={{ fontSize: '11px', padding: '1px 0', color: 'var(--label)' }}
                            labelFormatter={(yearValue) => {
                              const yr = Number(yearValue);
                              if (yr === 0) return "Initial (Year 0)";
                              const j = yr % 10;
                              const k = yr % 100;
                              if (j === 1 && k !== 11) return `${yr}st Year`;
                              if (j === 2 && k !== 12) return `${yr}nd Year`;
                              if (j === 3 && k !== 13) return `${yr}rd Year`;
                              return `${yr}th Year`;
                            }}
                            formatter={(value, name) => {
                              const numHex = Number(value);
                              const formatted = numHex.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              return [`${inputs.financials.currency} ${formatted}`, name];
                            }}
                          />
                          {selectedModelIndices.map((idx, sIdx) => {
                            const model = modellingResults[idx];
                            if (!model) return null;
                            const selectedColor = CHART_SERIES[sIdx % CHART_SERIES.length];
                            return (
                              <Area 
                                key={idx}
                                name={model.name}
                                type="monotone" 
                                dataKey={`model_${idx}_outflow`} 
                                stroke={selectedColor} 
                                fillOpacity={0.06} 
                                fill={selectedColor} 
                                strokeWidth={2.5}
                              />
                            );
                          })}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                      <h3 className="text-sm font-semibold text-[var(--label)]">Financial parameters</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-400">Currency</label>
                          <select
                            value={inputs.financials.currency}
                            onChange={(e) => setInputs({...inputs, financials: {...inputs.financials, currency: e.target.value as any}})}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 text-white"
                          >
                            {['USD', 'MYR', 'PHP', 'BDT', 'PKR'].map(curr => (
                              <option key={curr} value={curr}>{curr}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-400">WACC (%)</label>
                          <NumericInput 
                            value={inputs.financials.wacc ?? ""}
                            onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, financials: {...inputs.financials, wacc: val}}))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-sm text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-400">Annual Escalation (%)</label>
                          <NumericInput 
                            value={inputs.financials.escalation ?? ""}
                            onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, financials: {...inputs.financials, escalation: val}}))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-sm text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-400">Tax Rate (%)</label>
                          <NumericInput 
                            value={inputs.financials.taxRate ?? ""}
                            onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, financials: {...inputs.financials, taxRate: val}}))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-sm text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-400">Contract Tenure (Years)</label>
                          <NumericInput 
                            value={inputs.financials.tenure ?? ""}
                            onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, financials: {...inputs.financials, tenure: val}}))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-sm text-white"
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <input 
                            type="checkbox"
                            id="dgFuelPassthrough"
                            checked={inputs.financials.dgFuelPassthrough}
                            onChange={(e) => setInputs({...inputs, financials: {...inputs.financials, dgFuelPassthrough: e.target.checked}})}
                            className="w-4 h-4 rounded border-white/10 bg-black/40 text-red-600 focus:ring-red-500"
                          />
                          <label htmlFor="dgFuelPassthrough" className="text-xs font-medium text-gray-400 cursor-pointer">DG Fuel Passthrough</label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            id="gridElectricityPassthrough"
                            checked={inputs.financials.gridElectricityPassthrough}
                            onChange={(e) => setInputs({...inputs, financials: {...inputs.financials, gridElectricityPassthrough: e.target.checked}})}
                            className="w-4 h-4 rounded border-white/10 bg-black/40 text-red-600 focus:ring-red-500"
                          />
                          <label htmlFor="gridElectricityPassthrough" className="text-xs font-medium text-gray-400 cursor-pointer">Grid Electricity Passthrough</label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-center">
                      {selectedModelIndices.map((modelIdx, sIdx) => {
                        const model = modellingResults[modelIdx];
                        if (!model) return null;
                        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                        const cardBgClasses = [
                          'bg-[#121212] border-red-500/20 shadow-lg hover:border-red-500/40',
                          'bg-[#121212] border-blue-500/20 shadow-lg hover:border-blue-500/40',
                          'bg-[#121212] border-emerald-500/20 shadow-lg hover:border-emerald-500/40',
                          'bg-[#121212] border-amber-500/20 shadow-lg hover:border-amber-500/40',
                          'bg-[#121212] border-violet-500/20 shadow-lg hover:border-violet-500/40',
                          'bg-[#121212] border-pink-500/20 shadow-lg hover:border-pink-500/40'
                        ];
                        const borderColors = ['border-l-red-500', 'border-l-blue-500', 'border-l-emerald-500', 'border-l-amber-500', 'border-l-violet-500', 'border-l-pink-500'];
                        const textColors = ['text-red-400', 'text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-violet-400', 'text-pink-400'];
                        
                        const selectedBgClass = cardBgClasses[sIdx % cardBgClasses.length];
                        const selectedBorderL = borderColors[sIdx % borderColors.length];
                        const selectedTextColor = textColors[sIdx % textColors.length];
                        const selectedColor = colors[sIdx % colors.length];

                        return (
                          <div key={modelIdx} className={cn("border border-l-4 rounded-xl p-4 md:p-5 space-y-3 shadow-xl transition-all", selectedBgClass, selectedBorderL)}>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className={cn("text-xs font-extrabold uppercase tracking-widest flex items-center gap-2", selectedTextColor)}>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedColor }} />
                                <div className="flex flex-col items-start leading-tight">
                                  <span>{model.name}</span>
                                  <span className="text-[9px] text-gray-400 font-normal mt-0.5 lowercase tracking-normal">
                                    {model.totalAverageLoad?.toFixed(1)} kW{model.actualSolarCapacity && model.actualSolarCapacity > 0 ? ` / ${model.actualSolarCapacity?.toFixed(1)} kWp` : ''}
                                  </span>
                                </div>
                              </span>
                              <span className="text-[8px] text-gray-400 font-bold uppercase font-mono bg-white/[0.04] px-1.5 py-0.5 rounded">
                                Selected Design
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-gray-500 text-[9px] font-semibold uppercase tracking-wider mb-0.5">Breakeven Monthly Revenue</p>
                                <p className={cn("text-lg md:text-2xl font-black font-mono", selectedTextColor)}>
                                  {inputs.financials.currency} {model.breakevenMRR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                              </div>
                              <div className="space-y-1 text-[10px] border-t sm:border-t-0 sm:border-l border-white/5 pt-2 sm:pt-0 sm:pl-4 flex flex-col justify-center">
                                <div className="flex justify-between">
                                  <span className="text-gray-500 font-medium">Initial CAPEX</span>
                                  <span className="text-white font-bold font-mono">
                                    {inputs.financials.currency} {model.initialCapex.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500 font-medium">NPV (Outflow)</span>
                                  <span className="text-white font-bold font-mono">
                                    {inputs.financials.currency} {model.npv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500 font-medium">LCOE</span>
                                  <span className="text-white font-bold font-mono">
                                    {inputs.financials.currency} {model.lcoe?.toFixed(3)}/kWh
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 overflow-x-auto">
                    <h3 className="text-sm font-semibold text-[var(--label)] mb-6">
                      Cash Flow Projection (Outflows) {selectedModelIndices.length > 1 ? "- Comparative View" : ""}
                    </h3>
                    
                    {selectedModelIndices.length === 1 ? (
                      // Single Model View
                      <table className="w-full text-left text-[10px] md:text-xs min-w-[600px] md:min-w-full">
                        <thead>
                          <tr className="text-gray-500 border-b border-white/10">
                            <th className="pb-4 font-bold uppercase tracking-wider text-left">Year</th>
                            <th className="pb-4 font-bold uppercase tracking-wider text-right">CAPEX</th>
                            <th className="pb-4 font-bold uppercase tracking-wider text-right">OPEX</th>
                            <th className="pb-4 font-bold uppercase tracking-wider text-right">Fuel</th>
                            <th className="pb-4 font-bold uppercase tracking-wider text-red-500 text-right">Net Outflow</th>
                            <th className="pb-4 text-right w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {financialStats.cashFlows.map((cf) => (
                            <React.Fragment key={cf.year}>
                              <tr className="hover:bg-white/5 transition-colors group">
                                <td className="py-4 font-bold text-gray-400">T={cf.year}</td>
                                <td className="py-4 text-white">{renderFormattedCost(cf.capex)}</td>
                                <td className="py-4 text-white">{renderFormattedCost(cf.opex)}</td>
                                <td className="py-4 text-white">{renderFormattedCost(cf.fuel)}</td>
                                <td className="py-4 text-red-500 font-bold">{renderFormattedCost(cf.totalOutflow)}</td>
                                <td className="py-4 text-right">
                                  <button 
                                    onClick={() => setExpandedYear(expandedYear === cf.year ? null : cf.year)}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                  >
                                    {expandedYear === cf.year ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  </button>
                                </td>
                              </tr>
                              {expandedYear === cf.year && (
                                <tr className="bg-black/40">
                                  <td colSpan={6} className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      {cf.details?.capexItems && cf.details.capexItems.length > 0 && (
                                        <div className="space-y-2">
                                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">CAPEX Breakdown</h4>
                                          <div className="space-y-1">
                                            {cf.details.capexItems.map((item: any, i: number) => (
                                              <div key={i} className="flex justify-between text-[11px]">
                                                <span className="text-gray-400">{item.name}</span>
                                                <span className="text-white font-mono">{renderFormattedCost(item.cost)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {cf.details?.opexItems && cf.details.opexItems.length > 0 && (
                                        <div className="space-y-2">
                                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">OPEX & Fuel Breakdown</h4>
                                          <div className="space-y-1">
                                            {cf.details.opexItems.map((item: any, i: number) => (
                                              <div key={i} className="flex justify-between text-[11px]">
                                                <span className="text-gray-400">{item.name}</span>
                                                <span className="text-white font-mono">{renderFormattedCost(item.cost)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      // Multiple Models Selected (Comparative View Table)
                      <table className="w-full text-left text-[10px] md:text-xs min-w-[600px] md:min-w-full">
                        <thead>
                          <tr className="text-gray-500 border-b border-white/10">
                            <th className="pb-4 font-bold uppercase tracking-wider w-20">Year</th>
                            {selectedModelIndices.map((modelIdx, sIdx) => {
                              const model = modellingResults[modelIdx];
                              if (!model) return null;
                              const colors = ['text-red-500', 'text-blue-500', 'text-emerald-500', 'text-amber-500', 'text-violet-500', 'text-pink-500'];
                              const modelColorClass = colors[sIdx % colors.length];
                              return (
                                <th key={modelIdx} className="pb-4 font-bold uppercase tracking-wider text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-gray-400 font-semibold">{model.name}</span>
                                    <span className="text-[8px] text-gray-500 font-normal">
                                      {model.totalAverageLoad?.toFixed(1)} kW{model.actualSolarCapacity && model.actualSolarCapacity > 0 ? ` / ${model.actualSolarCapacity?.toFixed(1)} kWp` : ''}
                                    </span>
                                    <span className={cn("text-[10px] font-extrabold mt-0.5", modelColorClass)}>Net Outflow</span>
                                  </div>
                                </th>
                              );
                            })}
                            <th className="pb-4 text-right w-12 text-gray-500 font-bold uppercase tracking-wider">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {Array.from({ length: (inputs.financials.tenure || 15) + 1 }, (_, year) => {
                            return (
                              <React.Fragment key={year}>
                                <tr className="hover:bg-white/5 transition-colors group">
                                  <td className="py-4 font-bold text-gray-400">T={year}</td>
                                  {selectedModelIndices.map((modelIdx, sIdx) => {
                                    const model = modellingResults[modelIdx];
                                    if (!model) return <td key={modelIdx} className="py-4 text-right text-gray-600">-</td>;
                                    const cf = model.cashFlows && model.cashFlows[year];
                                    const colors = ['text-red-500', 'text-blue-500', 'text-emerald-500', 'text-amber-500', 'text-violet-500', 'text-pink-500'];
                                    const textClass = colors[sIdx % colors.length];
                                    return (
                                      <td key={modelIdx} className={cn("py-4 text-right font-black font-mono", textClass)}>
                                        {cf ? renderFormattedCost(cf.totalOutflow) : '-'}
                                      </td>
                                    );
                                  })}
                                  <td className="py-4 text-right">
                                    <button 
                                      onClick={() => setExpandedYear(expandedYear === year ? null : year)}
                                      className="p-1 hover:bg-white/10 rounded transition-colors"
                                    >
                                      {expandedYear === year ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                  </td>
                                </tr>
                                {expandedYear === year && (
                                  <tr className="bg-black/40">
                                    <td colSpan={selectedModelIndices.length + 2} className="p-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {selectedModelIndices.map((modelIdx, sIdx) => {
                                          const model = modellingResults[modelIdx];
                                          if (!model) return null;
                                          const cf = model.cashFlows && model.cashFlows[year];
                                          if (!cf) return null;
                                          
                                          const colors = ['text-red-450 border-l-red-500/40 bg-red-950/20', 'text-blue-450 border-l-blue-500/40 bg-blue-950/20', 'text-emerald-450 border-l-emerald-500/40 bg-emerald-950/20', 'text-amber-450 border-l-amber-500/40 bg-amber-950/20', 'text-violet-450 border-l-violet-500/40 bg-violet-950/20', 'text-pink-450 border-l-pink-500/40 bg-pink-950/20'];
                                          const themeClass = colors[sIdx % colors.length];

                                          return (
                                            <div key={modelIdx} className={cn("border border-white/5 border-l-4 rounded-xl p-3.5 space-y-3", themeClass)}>
                                              <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                                                <span className="font-extrabold uppercase tracking-widest text-[9px] text-gray-300">
                                                  {model.name}
                                                </span>
                                                <span className="text-[10px] font-black font-mono text-white">
                                                  {renderFormattedCost(cf.totalOutflow)}
                                                </span>
                                              </div>
                                              
                                              <div className="space-y-1 text-[10px]">
                                                <div className="flex justify-between">
                                                  <span className="text-gray-500 font-medium">CAPEX</span>
                                                  <span className="text-white font-mono">{renderFormattedCost(cf.capex)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-500 font-medium">OPEX</span>
                                                  <span className="text-white font-mono">{renderFormattedCost(cf.opex)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-500 font-medium">Fuel</span>
                                                  <span className="text-white font-mono">{renderFormattedCost(cf.fuel)}</span>
                                                </div>
                                              </div>

                                              {/* Short Itemized Breakdown if present */}
                                              {(cf.details?.capexItems && cf.details.capexItems.length > 0) && (
                                                <div className="pt-2 border-t border-white/5">
                                                  <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">CAPEX Items</div>
                                                  <div className="space-y-0.5 font-mono text-[9px]">
                                                    {cf.details.capexItems.map((item: any, i: number) => (
                                                      <div key={i} className="flex justify-between">
                                                        <span className="text-gray-400 truncate max-w-[120px]">{item.name}</span>
                                                        <span className="text-white">{renderFormattedCost(item.cost)}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {(cf.details?.opexItems && cf.details.opexItems.length > 0) && (
                                                <div className="pt-2 border-t border-white/5">
                                                  <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">OPEX & Fuel Items</div>
                                                  <div className="space-y-0.5 font-mono text-[9px]">
                                                    {cf.details.opexItems.map((item: any, i: number) => (
                                                      <div key={i} className="flex justify-between">
                                                        <span className="text-gray-400 truncate max-w-[120px]">{item.name}</span>
                                                        <span className="text-white">{renderFormattedCost(item.cost)}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'breakdown' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-red-500" />
                      Cost breakdown
                    </h2>
                    <div className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded font-bold uppercase tracking-wider">
                      Currency: {inputs.financials.currency}
                    </div>
                  </div>

                  {/* Energy Analysis Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--label)] border-b border-white/10 pb-2">Energy Analysis (Daily)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">DC System Consumption</p>
                        <p className="text-xl font-bold text-white">{rectifierStats.dailyLoadEnergy?.toFixed(1)} <span className="text-xs font-normal text-gray-400">kWh (DC)</span></p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">Solar Contribution</span>
                            <span className="text-white">{rectifierStats.dailySolarEnergy?.toFixed(1)} kWh</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">Grid Contribution</span>
                            <span className="text-white">{rectifierStats.dailyGridEnergy?.toFixed(1)} kWh</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">DG Contribution</span>
                            <span className="text-white">{rectifierStats.dgDailyEnergyGeneration?.toFixed(1)} kWh</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Source Energy</p>
                        <p className="text-xl font-bold text-white">{rectifierStats.dailyEnergyTotal?.toFixed(1)} <span className="text-xs font-normal text-gray-400">kWh (AC+Solar)</span></p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">AC Input (Grid+DG)</span>
                            <span className="text-white">{rectifierStats.dailyEnergyAC?.toFixed(1)} kWh</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">Solar Contribution</span>
                            <span className="text-white">{rectifierStats.dailySolarEnergy?.toFixed(1)} kWh</span>
                          </div>
                          <div className="flex justify-between text-[10px] pt-1 border-t border-white/5 mt-1">
                            <span className="text-gray-500">Rectifier Losses</span>
                            <span className="text-red-400">{(rectifierStats.dailyEnergyAC - (rectifierStats.dailyGridEnergy + rectifierStats.dgDailyEnergyGeneration))?.toFixed(1)} kWh</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CAPEX Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--label)] border-b border-white/10 pb-2">Itemized CAPEX</h3>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-gray-500 bg-white/5">
                            <th className="p-4 font-bold uppercase tracking-wider">Item Name</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-right">Unit Cost</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-center">Qty</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-right">Total Cost</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-center">Replacement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {[...boq].sort((a, b) => {
                            const indexA = BOQ_SORT_ORDER.indexOf(a.item);
                            const indexB = BOQ_SORT_ORDER.indexOf(b.item);
                            if (indexA === -1 && indexB === -1) return a.item.localeCompare(b.item);
                            if (indexA === -1) return 1;
                            if (indexB === -1) return -1;
                            return indexA - indexB;
                          }).map((item, idx) => {
                            const unitCost = item.unitCost;
                            const totalCost = item.total;
                            const life = item.lifespan;
                            const replacement = life ? `Every ${life < 100 ? life.toFixed(1) : Math.floor(life)} Years` : 'N/A';

                            return (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-medium text-gray-200">{item.item}</td>
                                <td className="p-4 text-right text-white font-mono">{inputs.financials.currency} {unitCost.toLocaleString()}</td>
                                <td className="p-4 text-center text-white">{item.quantity} {item.unit}</td>
                                <td className="p-4 text-right text-white font-bold font-mono">{inputs.financials.currency} {totalCost.toLocaleString()}</td>
                                <td className="p-4 text-center text-gray-400">{replacement}</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-red-600/10">
                            <td colSpan={3} className="p-4 font-bold text-red-400 uppercase tracking-wider">Total Initial CAPEX</td>
                            <td className="p-4 text-right text-red-500 font-black text-lg font-mono">
                              {inputs.financials.currency} {financialStats.initialCapex.toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* OPEX Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--label)] border-b border-white/10 pb-2">Itemized Annual OPEX (Year 1)</h3>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-gray-500 bg-white/5">
                            <th className="p-4 font-bold uppercase tracking-wider">Expense Item</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-right">Unit Rate</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-center">Qty/Frequency</th>
                            <th className="p-4 font-bold uppercase tracking-wider text-right">Annual Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {/* Annual PM */}
                          <tr className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-medium text-gray-200">Annual Preventive Maintenance</td>
                            <td className="p-4 text-right text-white font-mono">{inputs.financials.currency} {inputs.costs.opex.annualPM.toLocaleString()}</td>
                            <td className="p-4 text-center text-white">1 / Year</td>
                            <td className="p-4 text-right text-white font-bold font-mono">{inputs.financials.currency} {inputs.costs.opex.annualPM.toLocaleString()}</td>
                          </tr>

                          {/* Solar PM */}
                          {inputs.solar.enabled && (
                            <tr className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-medium text-gray-200">Annual Solar Preventive Maintenance</td>
                              <td className="p-4 text-right text-white font-mono">{inputs.financials.currency} {inputs.costs.opex.solarPM.toLocaleString()}</td>
                              <td className="p-4 text-center text-white">1 / Year</td>
                              <td className="p-4 text-right text-white font-bold font-mono">{inputs.financials.currency} {inputs.costs.opex.solarPM.toLocaleString()}</td>
                            </tr>
                          )}

                          {/* DG OPEX */}
                          {inputs.dg.enabled && (
                            <>
                              {(() => {
                                const annualHours = (rectifierStats.dgRunningHoursPerDay || 0) * 365;
                                const pmCount = inputs.dg.periodicMaintenanceHours > 0 ? annualHours / inputs.dg.periodicMaintenanceHours : 0;
                                const minorCount = inputs.dg.minorOverhaulHours > 0 ? annualHours / inputs.dg.minorOverhaulHours : 0;
                                const majorCount = inputs.dg.majorOverhaulHours > 0 ? annualHours / inputs.dg.majorOverhaulHours : 0;

                                return (
                                  <>
                                    <tr className="hover:bg-white/5 transition-colors">
                                      <td className="p-4 font-medium text-gray-200">DG Periodic Maintenance</td>
                                      <td className="p-4 text-right text-white font-mono">{inputs.financials.currency} {(inputs.costs.opex.dgPM || 0).toLocaleString()}</td>
                                      <td className="p-4 text-center text-white">{(pmCount || 0).toFixed(2)} / Year</td>
                                      <td className="p-4 text-right text-white font-bold font-mono">{inputs.financials.currency} {(pmCount * (inputs.costs.opex.dgPM || 0)).toLocaleString()}</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                      <td className="p-4 font-medium text-gray-200">DG Minor Overhaul</td>
                                      <td className="p-4 text-right text-white font-mono">{inputs.financials.currency} {(inputs.costs.opex.dgMinorOverhaul || 0).toLocaleString()}</td>
                                      <td className="p-4 text-center text-white">{(minorCount || 0).toFixed(3)} / Year</td>
                                      <td className="p-4 text-right text-white font-bold font-mono">{inputs.financials.currency} {(minorCount * (inputs.costs.opex.dgMinorOverhaul || 0)).toLocaleString()}</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                      <td className="p-4 font-medium text-gray-200">DG Major Overhaul</td>
                                      <td className="p-4 text-right text-white font-mono">{inputs.financials.currency} {(inputs.costs.opex.dgMajorOverhaul || 0).toLocaleString()}</td>
                                      <td className="p-4 text-center text-white">{(majorCount || 0).toFixed(4)} / Year</td>
                                      <td className="p-4 text-right text-white font-bold font-mono">{inputs.financials.currency} {(majorCount * (inputs.costs.opex.dgMajorOverhaul || 0)).toLocaleString()}</td>
                                    </tr>
                                  </>
                                );
                              })()}
                            </>
                          )}

                          {/* Fuel Hauling */}
                          <tr className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-medium text-gray-200">Fuel Hauling Cost</td>
                            <td className="p-4 text-right text-white font-mono">{inputs.financials.currency} {inputs.costs.opex.fuelHaulingMonthly.toLocaleString()}</td>
                            <td className="p-4 text-center text-white">12 Months / Year</td>
                            <td className="p-4 text-right text-white font-bold font-mono">{inputs.financials.currency} {(inputs.costs.opex.fuelHaulingMonthly * 12).toLocaleString()}</td>
                          </tr>

                          {/* Grid Tariff */}
                          {(() => {
                            const dailyGridEnergyAC = rectifierStats.dailyGridEnergy / (inputs.rectifier.efficiency / 100);
                            if (dailyGridEnergyAC > 0) {
                              const annualGridCost = dailyGridEnergyAC * 365 * inputs.costs.opex.gridTariffPerKWh;
                              return (
                                <tr className="hover:bg-white/5 transition-colors">
                                  <td className="p-4 font-medium text-gray-200">Grid Electricity Consumption</td>
                                  <td className="p-4 text-right text-white font-mono">{inputs.financials.currency} {inputs.costs.opex.gridTariffPerKWh?.toFixed(2)} / kWh</td>
                                  <td className="p-4 text-center text-white">{(dailyGridEnergyAC * 365).toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh / Year</td>
                                  <td className="p-4 text-right text-white font-bold font-mono">{inputs.financials.currency} {annualGridCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                              );
                            }
                            return null;
                          })()}

                          {/* Fuel Cost */}
                          {inputs.dg.enabled && (
                            <tr className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-medium text-gray-200">Fuel Consumption</td>
                              <td className="p-4 text-right text-white font-mono">{inputs.financials.currency} {inputs.costs.opex.fuelCostPerLiter?.toFixed(2)} / L</td>
                              <td className="p-4 text-center text-white">{(rectifierStats.dgDailyFuel * 365).toLocaleString(undefined, { maximumFractionDigits: 0 })} L / Year</td>
                              <td className="p-4 text-right text-white font-bold font-mono">{inputs.financials.currency} {(rectifierStats.dgDailyFuel * 365 * inputs.costs.opex.fuelCostPerLiter).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                            </tr>
                          )}

                          <tr className="bg-red-600/10">
                            <td colSpan={3} className="p-4 font-bold text-red-400 uppercase tracking-wider">Total Annual OPEX (Year 1)</td>
                            <td className="p-4 text-right text-red-500 font-black text-lg font-mono">
                              {inputs.financials.currency} {(financialStats.cashFlows[1]?.opex + financialStats.cashFlows[1]?.fuel).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'modelling' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-red-500" />
                    Modelling
                  </h2>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={inputs.modelling.multipleModels}
                        onChange={(e) => setInputs({...inputs, modelling: {...inputs.modelling, multipleModels: e.target.checked}})}
                        className="w-4 h-4 rounded border-white/10 bg-black/40 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Multiple Iterations</span>
                    </label>
                  </div>
                  {inputs.modelling.multipleModels && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Iterations</label>
                      <input 
                        type="number"
                        value={inputs.modelling.iterations ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, modelling: {...inputs.modelling, iterations: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Load Increment (kW)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={inputs.modelling.loadIncrement ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, modelling: {...inputs.modelling, loadIncrement: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Solar Increment (kWp)</label>
                      <input 
                        type="number"
                        step="1"
                        value={inputs.modelling.solarIncrement ?? ""}
                        onChange={(e) => handleNumericInput(e.target.value, (val) => setInputs({...inputs, modelling: {...inputs.modelling, solarIncrement: val}}))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  )}

                  {modellingResults && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[var(--label)]">Sensitivity Results: Breakeven MRR</h3>
                      </div>
                      <div className={cn(
                        "border rounded-2xl overflow-x-auto",
                        isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
                      )}>
                        <table className="w-full text-left text-[10px] min-w-[800px] md:min-w-full">
                          <thead>
                            <tr className={cn(
                              "font-bold uppercase tracking-wider",
                              isDarkMode ? "text-gray-500 bg-white/5" : "text-gray-600 bg-gray-50"
                            )}>
                              <th className={cn(
                                "p-2 font-bold uppercase sticky left-0 z-20 min-w-[60px] max-w-[100px] whitespace-normal border-b",
                                isDarkMode ? "bg-[#121212] text-gray-500 border-white/10" : "bg-gray-50 text-gray-600 border-gray-200"
                              )}>Load Added</th>
                              <th className={cn("p-3 font-bold uppercase border-b", isDarkMode ? "border-white/10" : "border-gray-200")}>Solar Added</th>
                              <th className={cn("p-3 font-bold uppercase border-b", isDarkMode ? "border-white/10" : "border-gray-200")}>Total Load</th>
                              <th className={cn("p-3 font-bold uppercase border-b", isDarkMode ? "border-white/10" : "border-gray-200")}>Total Solar</th>
                              <th className={cn("p-3 font-bold uppercase text-right border-b", isDarkMode ? "border-white/10" : "border-gray-200")}>Breakeven MRR</th>
                              <th className={cn("p-3 font-bold uppercase text-right border-b", isDarkMode ? "border-white/10" : "border-gray-200")}>MRR Variance</th>
                              <th className={cn("p-3 font-bold uppercase text-right border-b", isDarkMode ? "border-white/10" : "border-gray-200")}>Initial CAPEX</th>
                            </tr>
                          </thead>
                          <tbody className={cn("divide-y", isDarkMode ? "divide-white/5" : "divide-gray-100")}>
                            {modellingResults.map((res, idx) => (
                              <tr key={idx} className={cn(
                                "transition-colors group",
                                isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                              )}>
                                <td className={cn(
                                  "p-2 sticky left-0 transition-colors z-10 border-r whitespace-normal break-words leading-tight",
                                  isDarkMode 
                                    ? "bg-[#121212] group-hover:bg-[#1a1a1a] text-gray-400 border-white/5" 
                                    : "bg-white group-hover:bg-gray-50 text-gray-800 border-gray-100"
                                )}>+{res.loadAdded?.toFixed(1)} kW</td>
                                <td className={cn("p-3", isDarkMode ? "text-gray-400" : "text-gray-700")}>+{res.solarAdded?.toFixed(0)} kWp</td>
                                <td className={cn("p-3 font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>{res.totalAverageLoad?.toFixed(1)} kW</td>
                                <td className={cn("p-3 font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>{res.actualSolarCapacity?.toFixed(1)} kWp</td>
                                <td className={cn("p-3 text-right font-bold", isDarkMode ? "text-red-500" : "text-red-700")}>
                                  {renderFormattedCost(res.breakevenMRR || 0)}
                                </td>
                                <td className={cn("p-3 text-right font-bold", isDarkMode ? "text-yellow-500" : "text-amber-700")}>
                                  <div className="flex flex-col items-end leading-tight">
                                    <span className="text-[8px] md:text-[9px] opacity-60 font-bold">{inputs.financials.currency}</span>
                                    <span className="font-mono">{res.mrrVariance > 0 ? '+' : ''}{res.mrrVariance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                  </div>
                                </td>
                                <td className={cn("p-3 text-right font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                                  {renderFormattedCost(res.initialCapex || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'report' && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 gap-6">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                        <FileText className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
                        Executive summary
                      </h2>
                      <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Proposal and financial analysis</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 no-print">
                      <button 
                        onClick={handleExportReportXLS}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 h-9 rounded-[var(--radius-control)] bg-[var(--fill-tertiary)] text-[length:var(--text-footnote-size)] font-medium text-[var(--label)] hover:bg-[var(--fill-secondary)] whitespace-nowrap"
                      >
                        <Save className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                        Export XLS
                      </button>
                      <button 
                        onClick={triggerExportReportPDF}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 h-9 rounded-[var(--radius-control)] bg-[var(--fill-tertiary)] text-[length:var(--text-footnote-size)] font-medium text-[var(--label)] hover:bg-[var(--fill-secondary)] whitespace-nowrap"
                      >
                        <Download className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                        Export PDF
                      </button>
                    </div>
                  </div>

                  {modellingResults && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 no-print">
                      <span className="text-[length:var(--text-footnote-size)] font-medium text-[var(--label-secondary)]">Model</span>
                      <div className="flex flex-wrap gap-2">
                        {modellingResults.map((res, idx) => {
                          const loadText = `${res.totalAverageLoad?.toFixed(1)} kW`;
                          const solarVal = res.actualSolarCapacity ?? 0;
                          const specs = solarVal > 0 ? `${loadText} / ${solarVal.toFixed(1)} kWp` : loadText;
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedModelIndex(idx)}
                              className={cn(
                                "px-3 py-1 text-left rounded-lg text-[10px] font-bold transition-all border flex flex-col cursor-pointer",
                                selectedModelIndex === idx 
                                  ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20" 
                                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                              )}
                            >
                              <span>{res.name}</span>
                              <span className={cn("text-[8px] font-normal font-mono", selectedModelIndex === idx ? "text-red-200" : "text-gray-500")}>
                                {specs}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {modellingResults && (
                    <div className="space-y-4">
                      <h3 className={cn(
                        "text-xs font-bold uppercase tracking-widest",
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      )}>Model Comparison Summary</h3>
                      <div className={cn(
                        "border rounded-2xl overflow-x-auto",
                        isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
                      )}>
                        <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
                          <thead>
                            <tr className={cn(
                              "text-[10px] font-bold uppercase tracking-widest",
                              isDarkMode ? "text-gray-500 bg-white/5" : "text-gray-600 bg-gray-50"
                            )}>
                              <th className={cn(
                                "p-2 border-b sticky left-0 z-20 min-w-[60px] max-w-[100px] whitespace-normal font-bold/10",
                                isDarkMode ? "bg-[#121212] border-white/10 text-gray-550" : "bg-gray-50 border-gray-200 text-gray-600"
                              )}>Model Name</th>
                              <th className={cn("p-3 border-b", isDarkMode ? "border-white/10" : "border-gray-200")}>Total Load</th>
                              <th className={cn("p-3 border-b", isDarkMode ? "border-white/10" : "border-gray-200")}>Total Solar</th>
                              <th className={cn("p-3 border-b text-right", isDarkMode ? "border-white/10" : "border-gray-200")}>Breakeven MRR</th>
                              <th className={cn("p-3 border-b text-right", isDarkMode ? "border-white/10" : "border-gray-200")}>MRR Variance</th>
                              <th className={cn("p-3 border-b text-right", isDarkMode ? "border-white/10" : "border-gray-200")}>LCOE</th>
                              <th className={cn("p-3 border-b text-right", isDarkMode ? "border-white/10" : "border-gray-200")}>Initial CAPEX</th>
                            </tr>
                          </thead>
                          <tbody className={cn("divide-y", isDarkMode ? "divide-white/5" : "divide-gray-100")}>
                            {modellingResults.map((res, idx) => {
                              const isSelected = selectedModelIndex === idx;
                              return (
                                <tr 
                                  key={idx} 
                                  className={cn(
                                    "transition-colors cursor-pointer group",
                                    isDarkMode 
                                      ? (isSelected ? "bg-red-500/10 hover:bg-red-500/15" : "hover:bg-white/5") 
                                      : (isSelected ? "bg-[#FFF5F5] hover:bg-[#FFEBEB]" : "hover:bg-gray-50")
                                  )} 
                                  onClick={() => setSelectedModelIndex(idx)}
                                >
                                  <td className={cn(
                                    "p-2 text-[10px] md:text-xs font-bold sticky left-0 transition-colors z-10 border-r whitespace-normal break-words leading-tight",
                                    isDarkMode 
                                      ? cn(
                                          "border-white/5",
                                          isSelected ? "bg-[#1f1212] text-red-400" : "bg-[#121212] group-hover:bg-[#1a1a1a] text-white"
                                        )
                                      : cn(
                                          "border-gray-100",
                                          isSelected ? "bg-[#FFF5F5] group-hover:bg-[#FFEBEB] text-red-900" : "bg-white group-hover:bg-gray-50 text-gray-900"
                                        )
                                  )}>
                                    <div>{res.name}</div>
                                    <div className={cn(
                                      "text-[9px] font-normal mt-0.5",
                                      isDarkMode ? "text-gray-500" : "text-gray-500"
                                    )}>
                                      {res.totalAverageLoad?.toFixed(1)} kW{res.actualSolarCapacity && res.actualSolarCapacity > 0 ? ` / ${res.actualSolarCapacity?.toFixed(1)} kWp` : ''}
                                    </div>
                                  </td>
                                  <td className={cn(
                                    "p-3 text-[10px] md:text-xs font-medium",
                                    isDarkMode 
                                      ? (isSelected ? "text-red-200" : "text-gray-400") 
                                      : (isSelected ? "text-red-950" : "text-gray-700")
                                  )}>{res.totalAverageLoad?.toFixed(1)} kW</td>
                                  <td className={cn(
                                    "p-3 text-[10px] md:text-xs font-medium",
                                    isDarkMode 
                                      ? (isSelected ? "text-red-200" : "text-gray-400") 
                                      : (isSelected ? "text-red-950" : "text-gray-700")
                                  )}>{res.actualSolarCapacity?.toFixed(1)} kWp</td>
                                  <td className={cn(
                                    "p-3 text-right text-[10px] md:text-xs font-bold",
                                    isDarkMode 
                                      ? "text-red-500" 
                                      : (isSelected ? "text-red-800" : "text-red-700")
                                  )}>{renderFormattedCost(res.breakevenMRR || 0)}</td>
                                  <td className={cn(
                                    "p-3 text-right text-[10px] md:text-xs font-bold",
                                    isDarkMode 
                                      ? "text-yellow-500" 
                                      : (isSelected ? "text-amber-800" : "text-amber-700")
                                  )}>
                                    <div className="flex flex-col items-end leading-tight">
                                      <span className="text-[8px] md:text-[9px] opacity-60 font-bold">{inputs.financials.currency}</span>
                                      <span className="font-mono">{res.mrrVariance > 0 ? '+' : ''}{(res.mrrVariance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                  </td>
                                  <td className={cn(
                                    "p-3 text-right text-[10px] md:text-xs font-bold",
                                    isDarkMode 
                                      ? "text-white" 
                                      : (isSelected ? "text-gray-900" : "text-gray-800")
                                  )}>
                                    <div className="flex flex-col items-end leading-tight">
                                      <span className="text-[8px] md:text-[9px] opacity-60 font-bold">{inputs.financials.currency}</span>
                                      <span className="font-mono">{res.lcoe?.toFixed(3)}/kWh</span>
                                    </div>
                                  </td>
                                  <td className={cn(
                                    "p-3 text-right text-[10px] md:text-xs font-bold",
                                    isDarkMode 
                                      ? "text-white" 
                                      : (isSelected ? "text-gray-900" : "text-gray-800")
                                  )}>{renderFormattedCost(res.initialCapex || 0)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {[
                      { label: 'Initial CAPEX', value: renderFormattedCost(displayedStats.initialCapex || 0), icon: Box, color: 'text-white' },
                      { label: 'Breakeven MRR', value: renderFormattedCost(displayedStats.breakevenMRR || 0), icon: TrendingUp, color: 'text-red-500' },
                      { label: 'LCOE', value: <div className="flex flex-col items-end leading-tight"><span className="text-[8px] md:text-[9px] opacity-60 font-bold">{inputs.financials.currency}</span><span className="font-mono">{displayedStats.lcoe?.toFixed(3)}/kWh</span></div>, icon: Zap, color: 'text-white' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col items-end">
                        <div className="flex items-center justify-between w-full mb-4">
                          <stat.icon className="w-5 h-5 text-gray-500" />
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                        </div>
                        <div className={cn("text-xl font-black", stat.color)}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-6">
                      <h3 className="text-sm font-semibold text-[var(--label)] flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-red-500" />
                        Technical Overview
                      </h3>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-xs text-gray-400">Total Average Load</span>
                          <span className="text-sm font-bold text-white">{displayedStats.totalAverageLoad?.toFixed(2)} kW</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-xs text-gray-400">Battery Backup</span>
                          <span className="text-sm font-bold text-white">{displayedStats.backupHours} Hours</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-xs text-gray-400">Solar PV Capacity</span>
                          <span className="text-sm font-bold text-white">{displayedStats.actualSolarCapacity?.toFixed(1)} kWp</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-xs text-gray-400">DG Requirement</span>
                          <span className="text-sm font-bold text-white">{displayedStats.requiredDGKva?.toFixed(1)} kVA</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-xs text-gray-400">Annual Energy Load</span>
                          <span className="text-sm font-bold text-white">{(displayedStats.totalAverageLoad * 24 * 365).toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</span>
                        </div>
                        <div className="hidden sm:block py-2 border-b border-white/5"></div>
                        
                        {/* Daily Energy Mix & Computed kWh rows */}
                        <div className="flex justify-between items-center py-2 border-b border-white/5 sm:col-span-2 pt-4">
                          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">DAILY ENERGY MIX & COMPUTED KWH (ESTIMATION ONLY)</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-xs text-gray-400">Grid Daily Energy / Mix</span>
                          <span className="text-sm font-bold text-white">
                            {(() => {
                              const g = displayedStats.rectifierStats?.dailyGridEnergy || 0;
                              const d = displayedStats.rectifierStats?.dgDailyEnergyGeneration || 0;
                              const s = displayedStats.rectifierStats?.dailySolarEnergy || 0;
                              const tot = g + d + s;
                              const pct = tot > 0 ? (g / tot) * 100 : 0;
                              return `${g.toFixed(2)} kWh (${pct.toFixed(1)}%)`;
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-xs text-gray-400">DG Daily Generation / Mix</span>
                          <span className="text-sm font-bold text-white">
                            {(() => {
                              const g = displayedStats.rectifierStats?.dailyGridEnergy || 0;
                              const d = displayedStats.rectifierStats?.dgDailyEnergyGeneration || 0;
                              const s = displayedStats.rectifierStats?.dailySolarEnergy || 0;
                              const tot = g + d + s;
                              const pct = tot > 0 ? (d / tot) * 100 : 0;
                              return `${d.toFixed(2)} kWh (${pct.toFixed(1)}%)`;
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-xs text-gray-400">Solar Daily Generation / Mix</span>
                          <span className="text-sm font-bold text-white">
                            {(() => {
                              const g = displayedStats.rectifierStats?.dailyGridEnergy || 0;
                              const d = displayedStats.rectifierStats?.dgDailyEnergyGeneration || 0;
                              const s = displayedStats.rectifierStats?.dailySolarEnergy || 0;
                              const tot = g + d + s;
                              const pct = tot > 0 ? (s / tot) * 100 : 0;
                              return `${s.toFixed(2)} kWh (${pct.toFixed(1)}%)`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-[var(--label)] flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-red-500" />
                      Detailed Bill of Quantities
                    </h3>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto scrollbar-hide">
                      <table className="w-full text-left border-collapse table-fixed md:table-auto">
                        <colgroup>
                          <col className="w-[60px] md:w-[150px]" />
                          <col className="w-[60px] md:w-[100px]" />
                          {modellingResults.map((_, i) => (
                            <React.Fragment key={i}>
                              <col className="w-[40px] md:w-[60px]" />
                              <col className="w-[70px] md:w-[100px]" />
                              <col className="w-[35px] md:w-[60px]" />
                            </React.Fragment>
                          ))}
                        </colgroup>
                        <thead>
                          <tr className="text-[7px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5">
                            <th className="px-1 py-2 border-b border-white/10 sticky left-0 bg-[#121212] z-20 whitespace-normal break-all w-[60px] min-w-[60px] max-w-[60px]">Item Description</th>
                            <th className="px-1 py-2 border-b border-white/10 text-right w-[60px] min-w-[60px] max-w-[60px]">Unit Cost</th>
                            {modellingResults.map((res, idx) => {
                              const loadText = `${res.totalAverageLoad?.toFixed(1)} kW`;
                              const solarVal = res.actualSolarCapacity ?? 0;
                              const subtext = solarVal > 0 ? `${loadText} / ${solarVal.toFixed(1)} kWp` : loadText;
                              return (
                                <th key={idx} colSpan={3} className="px-1 py-2 border-b border-l border-white/10 text-center bg-red-500/5 min-w-[145px]">
                                  <div className="font-bold text-white text-[8px] md:text-xs">{res.name}</div>
                                  <div className="text-[7px] md:text-[9px] text-gray-400 font-normal mt-0.5 whitespace-nowrap">{subtext}</div>
                                </th>
                              );
                            })}
                          </tr>
                          <tr className="text-[6px] md:text-[9px] font-bold text-gray-600 uppercase tracking-widest bg-white/5">
                            <th className="px-1 py-1 border-b border-white/10 sticky left-0 bg-[#121212] z-20 w-[60px] min-w-[60px] max-w-[60px]"></th>
                            <th className="px-1 py-1 border-b border-white/10 w-[60px] min-w-[60px] max-w-[60px]"></th>
                            {modellingResults.map((_, idx) => (
                              <React.Fragment key={idx}>
                                <th className="px-0.5 py-1 border-b border-l border-white/10 text-center w-[40px] min-w-[40px] max-w-[40px]">Qty</th>
                                <th className="px-0.5 py-1 border-b border-white/10 text-right w-[70px] min-w-[70px] max-w-[70px]">Total</th>
                                <th className="px-0.5 py-1 border-b border-white/10 text-center w-[35px] min-w-[35px] max-w-[35px]">Life</th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {Array.from(new Set(modellingResults.flatMap(r => r.boq.map(b => b.item))))
                            .sort((a: string, b: string) => {
                              const indexA = BOQ_SORT_ORDER.indexOf(a);
                              const indexB = BOQ_SORT_ORDER.indexOf(b);
                              if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                              if (indexA === -1) return 1;
                              if (indexB === -1) return -1;
                              return indexA - indexB;
                            })
                            .map((itemName) => {
                            const firstItem = modellingResults.find(r => r.boq.some(b => b.item === itemName))?.boq.find(b => b.item === itemName);
                            return (
                              <tr key={itemName} className="hover:bg-white/5 transition-colors group">
                                <td className="px-1 py-2 text-[7px] md:text-xs text-gray-300 sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-all leading-tight w-[60px] min-w-[60px] max-w-[60px]">
                                  <p className="font-bold text-white">{itemName}</p>
                                  <p className="text-[6px] md:text-[10px] text-gray-500 mt-0.5">{firstItem?.description}</p>
                                </td>
                                <td className="px-1 py-2 text-right text-[7px] md:text-xs text-gray-400 font-mono w-[60px] min-w-[60px] max-w-[60px]">
                                  {renderFormattedCost(firstItem?.unitCost || 0)}
                                </td>
                                {modellingResults.map((res, idx) => {
                                  const modelItem = res.boq.find(b => b.item === itemName);
                                  return (
                                    <React.Fragment key={idx}>
                                      <td className="px-0.5 py-2 text-center text-[7px] md:text-xs text-white border-l border-white/5 w-[40px] min-w-[40px] max-w-[40px]">
                                        {modelItem?.quantity || 0}<span className="text-[5px] md:text-[10px] text-gray-500">{modelItem?.unit}</span>
                                      </td>
                                      <td className="px-0.5 py-2 text-right text-[7px] md:text-xs font-bold text-white font-mono w-[70px] min-w-[70px] max-w-[70px]">
                                        <CostTooltip content={modelItem?.derivation || ''}>
                                          <span className="cursor-help border-b border-dotted border-white/30 pb-0.5">
                                            {renderFormattedCost(modelItem?.total || 0)}
                                          </span>
                                        </CostTooltip>
                                      </td>
                                      <td className="px-0.5 py-2 text-center text-[7px] md:text-xs text-gray-400 w-[35px] min-w-[35px] max-w-[35px]">
                                        {modelItem?.lifespan}Y
                                      </td>
                                    </React.Fragment>
                                  );
                                })}
                              </tr>
                            );
                          })}
                          <tr className="bg-red-600/5 font-bold">
                            <td className="px-1 py-2 text-[7px] md:text-xs font-bold text-white sticky left-0 bg-[#121212] z-10 border-r border-white/5 uppercase tracking-wider whitespace-normal leading-tight w-[60px] min-w-[60px] max-w-[60px]">TOTAL CAPEX</td>
                            <td className="px-1 py-2 w-[60px] min-w-[60px] max-w-[60px]"></td>
                            {modellingResults.map((res, idx) => (
                              <React.Fragment key={idx}>
                                <td className="px-0.5 py-2 border-l border-white/10 w-[40px] min-w-[40px] max-w-[40px]"></td>
                                <td className="px-0.5 py-2 text-right text-red-500 font-black text-[7px] md:text-sm font-mono w-[70px] min-w-[70px] max-w-[70px]">
                                  {renderFormattedCost(res.initialCapex)}
                                </td>
                                <td className="px-0.5 py-2 w-[35px] min-w-[35px] max-w-[35px]"></td>
                              </React.Fragment>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-[var(--label)] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      Annual Operating Expenses (Year 1)
                    </h3>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto scrollbar-hide">
                      <table className="w-full text-left border-collapse table-fixed md:table-auto">
                        <colgroup>
                          <col className="w-[60px] md:w-[150px]" />
                          {modellingResults.map((_, i) => (
                            <col key={i} className="w-[80px] md:w-[120px]" />
                          ))}
                        </colgroup>
                        <thead>
                          <tr className="text-[7px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5">
                            <th className="px-1 py-2 border-b border-white/10 sticky left-0 bg-[#121212] z-20 whitespace-normal break-all w-[60px] min-w-[60px] max-w-[60px]">Expense Item</th>
                            {modellingResults.map((res, idx) => (
                              <th key={idx} className="px-1 py-2 border-b border-l border-white/10 text-right bg-red-500/5 min-w-[80px]">
                                {res.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {Array.from(new Set(modellingResults.flatMap(r => r.opexItemsYear1.map(o => o.name))))
                            .map((opexName) => (
                              <tr key={opexName} className="hover:bg-white/5 transition-colors group">
                                <td className="px-1 py-2 text-[7px] md:text-xs font-bold text-white sticky left-0 bg-[#121212] group-hover:bg-[#1a1a1a] transition-colors z-10 border-r border-white/5 whitespace-normal break-all leading-tight w-[60px] min-w-[60px] max-w-[60px]">{opexName}</td>
                                {modellingResults.map((res, idx) => {
                                  const opexItem = res.opexItemsYear1.find(o => o.name === opexName);
                                  return (
                                    <td key={idx} className="px-1 py-2 text-right text-[7px] md:text-xs text-gray-400 font-mono border-l border-white/5 w-[80px] min-w-[80px] max-w-[80px]">
                                      <CostTooltip content={opexItem?.derivation || ''}>
                                        <span className="cursor-help border-b border-dotted border-white/30 pb-0.5">
                                          {renderFormattedCost(opexItem?.cost || 0)}
                                        </span>
                                      </CostTooltip>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          <tr className="bg-red-600/5 font-bold">
                            <td className="px-1 py-2 text-[7px] md:text-xs font-bold text-white sticky left-0 bg-[#121212] z-10 border-r border-white/5 uppercase tracking-wider whitespace-normal leading-tight w-[60px] min-w-[60px] max-w-[60px]">TOTAL ANNUAL OPEX</td>
                            {modellingResults.map((res, idx) => (
                              <td key={idx} className="px-1 py-2 text-right text-red-500 font-black text-[7px] md:text-sm font-mono border-l border-white/5 w-[80px] min-w-[80px] max-w-[80px]">
                                {renderFormattedCost(res.cashFlows[1].opex)}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Removed Ready to proceed bar as requested */}
                </div>
              )}

              {activeSection === 'comparison' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-[var(--space-3)]">
                    <div className="p-[var(--space-3)] bg-[var(--tint-soft)] rounded-[var(--radius-element)]">
                      <GitCompare className="w-6 h-6 text-[var(--tint)]" />
                    </div>
                    <div>
                      <h2 className="text-[length:var(--text-title-3-size)] leading-[var(--text-title-3-line)] font-semibold text-[var(--label)]">
                        Project comparison
                      </h2>
                      <p className="text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] text-[var(--label-secondary)] mt-0.5">Load, cost, energy mix, and replacement year — side by side</p>
                    </div>
                  </div>

                  {userDbTemplates.length < 2 ? (
                    <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-[var(--space-8)] flex flex-col items-center justify-center text-center space-y-4 shadow-[0_0_0_0.5px_var(--separator)]">
                      <div className="p-[var(--space-4)] bg-[var(--tint-soft)] rounded-full text-[var(--tint)]">
                        <GitCompare className="w-8 h-8" />
                      </div>
                      <p className="text-[length:var(--text-subhead-size)] text-[var(--label-secondary)] max-w-md">
                        {userDbTemplates.length === 1
                          ? `“${userDbTemplates[0].name}” is saved. Save one more to compare.`
                          : 'Save two projects to compare them.'}
                      </p>
                      <Button
                        variant="filled"
                        onClick={() => {
                          setSaveTemplateDbName(currentTemplateName);
                          setShowSaveTemplateDbModal(true);
                        }}
                      >
                        Save as project
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Drag and Drop Box */}
                      <div 
                        onDragOver={(e) => {
                          e.preventDefault();
                          // Set standard drop Effect
                          e.dataTransfer.dropEffect = "copy";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          try {
                            const dataStr = e.dataTransfer.getData('text/plain');
                            if (!dataStr) return;
                            const project = JSON.parse(dataStr);
                            if (project && project.id) {
                              if (comparedProjects.some(cp => cp.id === project.id)) {
                                notify(`“${project.name}” is already in this comparison.`, 'info');
                                return;
                              }
                              if (comparedProjects.length >= 4) {
                                notify("You can compare up to 4 projects.", 'info');
                                return;
                              }
                              setComparedProjects([...comparedProjects, project]);
                            }
                          } catch (err) {
                            console.error("Failed to drop project:", err);
                          }
                        }}
                        className="rounded-[var(--radius-element)] p-[var(--space-6)] bg-[var(--fill-quaternary)] shadow-[0_0_0_0.5px_var(--separator)] relative flex flex-col justify-between min-h-[140px]"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] font-semibold text-[var(--label)] flex items-center gap-2">
                              <Columns className="w-4 h-4 text-[var(--tint)]" />
                              Selected ({comparedProjects.length} / 4)
                            </h3>
                            {comparedProjects.length > 0 && (
                              <button 
                                onClick={() => setComparedProjects([])}
                                className="text-[length:var(--text-footnote-size)] font-medium text-[var(--tint)] hover:opacity-80 cursor-pointer"
                              >
                                Clear all
                              </button>
                            )}
                          </div>

                          {comparedProjects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                              <p className="text-[length:var(--text-subhead-size)] text-[var(--label-secondary)]">Add a project with Quick add, or drag one here.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                              {comparedProjects.map((p) => (
                                <div 
                                  key={p.id}
                                  className="flex items-center justify-between px-3 py-2 bg-[var(--bg-elevated)] rounded-[var(--radius-element)] group shadow-[0_0_0_0.5px_var(--separator)]"
                                >
                                  <span className="text-[length:var(--text-footnote-size)] text-[var(--label)] font-medium truncate max-w-[130px] pr-2" title={p.name}>{p.name || "Untitled Project"}</span>
                                  <button 
                                    onClick={() => setComparedProjects(comparedProjects.filter(item => item.id !== p.id))}
                                    className="p-1 text-[var(--label-tertiary)] hover:text-[var(--system-red)] hover:bg-[var(--fill-tertiary)] rounded-[var(--radius-control)] cursor-pointer"
                                    title="Remove project"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              {comparedProjects.length < 4 && (
                                <div className="rounded-[var(--radius-element)] flex items-center justify-center p-2.5 text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] shadow-[0_0_0_0.5px_var(--separator)]">
                                  + Drop or click next slot
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quick select drawer */}
                        <div className="mt-4 pt-4 shadow-[inset_0_0.5px_0_var(--separator)] flex flex-wrap items-center gap-2">
                          <span className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] mr-1">Quick add</span>
                          {userDbTemplates.map((t) => {
                            const isAdded = comparedProjects.some(cp => cp.id === t.id);
                            return (
                              <button
                                key={t.id}
                                disabled={isAdded || comparedProjects.length >= 4}
                                onClick={() => {
                                  setComparedProjects([...comparedProjects, { id: t.id, name: t.name, data: t.data }]);
                                }}
                                className={cn(
                                  "px-2.5 py-1 text-[length:var(--text-caption-1-size)] rounded-[var(--radius-capsule)] cursor-pointer",
                                  isAdded 
                                    ? "bg-[color-mix(in_srgb,var(--system-green)_14%,transparent)] text-[var(--system-green)] cursor-default"
                                    : comparedProjects.length >= 4
                                      ? "bg-[var(--fill-tertiary)] text-[var(--label-quaternary)] cursor-not-allowed"
                                      : "bg-[var(--tint-soft)] text-[var(--tint)] hover:opacity-90"
                                )}
                              >
                                {t.name} {isAdded && "✓"}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Side by side columns */}
                      {comparedProjects.length > 0 ? (
                        <div className={cn(
                          "grid gap-4 items-start",
                          comparedProjects.length === 1 ? "grid-cols-1" :
                          comparedProjects.length === 2 ? "grid-cols-1 md:grid-cols-2" :
                          comparedProjects.length === 3 ? "grid-cols-1 md:grid-cols-3" :
                          "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                        )}>
                          {comparedProjects.map((project) => {
                            const models = getModelsForProject(project.data);
                            const selectedIdx = selectedModelForProject[project.id] ?? 0;
                            const modelStats = models[selectedIdx] || models[0] || {};
                            const currency = project.data.financials?.currency || "$";

                            // Energy mix computation
                            const g = modelStats.rectifierStats?.dailyGridEnergy || 0;
                            const d = modelStats.rectifierStats?.dgDailyEnergyGeneration || 0;
                            const s = modelStats.rectifierStats?.dailySolarEnergy || 0;
                            const tot = g + d + s;
                            const gridPct = tot > 0 ? (g / tot) * 100 : 0;
                            const dgPct = tot > 0 ? (d / tot) * 100 : 0;
                            const solarPct = tot > 0 ? (s / tot) * 100 : 0;

                            return (
                              <div 
                                key={project.id}
                                className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-5 space-y-5 flex flex-col justify-between shadow-[0_0_0_0.5px_var(--separator)] relative min-w-[200px]"
                              >
                                {/* Upper selection head */}
                                <div className="space-y-3 pb-3 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-[length:var(--text-subhead-size)] text-[var(--label)] truncate pr-2" title={project.name}>{project.name}</span>
                                    <button 
                                      onClick={() => setComparedProjects(comparedProjects.filter(p => p.id !== project.id))}
                                      className="text-[var(--label-tertiary)] hover:text-[var(--system-red)]"
                                      title="Remove from comparison"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  {/* Model Dropdown Menu */}
                                  <div className="space-y-1">
                                    <label className="text-[length:var(--text-caption-1-size)] text-[var(--label-secondary)] block">Model</label>
                                    <select
                                      value={selectedIdx}
                                      onChange={(e) => {
                                        setSelectedModelForProject({
                                          ...selectedModelForProject,
                                          [project.id]: parseInt(e.target.value, 10)
                                        });
                                      }}
                                      className="w-full px-2.5 py-1.5 text-[length:var(--text-footnote-size)] outline-none cursor-pointer"
                                    >
                                      {models.map((m, idx) => (
                                        <option key={idx} value={idx}>
                                          {m.name} (Total Load: {(m.totalPeakLoad || 0).toFixed(1)} kW Peak)
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* KEY INFO */}
                                <div className="space-y-3">
                                  <span className="text-[length:var(--text-caption-1-size)] font-semibold text-[var(--label-secondary)] block">Core performance</span>
                                  
                                  {/* Grid condition */}
                                  <div className="flex items-center justify-between text-[length:var(--text-footnote-size)] py-1.5 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                    <span className="text-[var(--label-secondary)]">Grid condition</span>
                                    <span className={cn(
                                      "font-medium text-[length:var(--text-caption-1-size)] px-2 py-0.5 rounded-[var(--radius-capsule)]",
                                      modelStats.gridCondition === 'Good' ? 'bg-[color-mix(in_srgb,var(--system-green)_14%,transparent)] text-[var(--system-green)]' : 
                                      modelStats.gridCondition === 'Poor' ? 'bg-[color-mix(in_srgb,var(--system-yellow)_20%,transparent)] text-[var(--system-orange)]' :
                                      modelStats.gridCondition === 'Bad' ? 'bg-[color-mix(in_srgb,var(--system-orange)_14%,transparent)] text-[var(--system-orange)]' : 
                                      'bg-[var(--tint-soft)] text-[var(--tint)]'
                                    )}>
                                      {modelStats.gridCondition}
                                    </span>
                                  </div>

                                  {/* total grid hours */}
                                  <div className="flex items-center justify-between text-[length:var(--text-footnote-size)] py-1.5 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                    <span className="text-[var(--label-secondary)]">Total grid hours</span>
                                    <span className="font-medium text-[var(--label)] font-[family-name:var(--font-numeric)]">
                                      {modelStats.totalGridHours?.toFixed(1)} Hrs/Day
                                    </span>
                                  </div>

                                  {/* total load stats */}
                                  <div className="space-y-1.5 py-1.5 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                    <div className="flex justify-between text-[length:var(--text-footnote-size)]">
                                      <span className="text-[var(--label-secondary)]">Total load</span>
                                      <span className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)]">kW</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 text-center font-[family-name:var(--font-numeric)]">
                                      <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-control)] p-1 shadow-[0_0_0_0.5px_var(--separator)]">
                                        <span className="block text-[var(--label-tertiary)] text-[length:var(--text-caption-2-size)]">Peak</span>
                                        <span className="text-[var(--label)] text-[length:var(--text-footnote-size)]">{(modelStats.totalPeakLoad || 0).toFixed(1)}</span>
                                      </div>
                                      <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-control)] p-1 shadow-[0_0_0_0.5px_var(--separator)]">
                                        <span className="block text-[var(--label-tertiary)] text-[length:var(--text-caption-2-size)]">Avg</span>
                                        <span className="text-[var(--label)] text-[length:var(--text-footnote-size)]">{(modelStats.totalAverageLoad || 0).toFixed(1)}</span>
                                      </div>
                                      <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-control)] p-1 shadow-[0_0_0_0.5px_var(--separator)]">
                                        <span className="block text-[var(--label-tertiary)] text-[length:var(--text-caption-2-size)]">Run</span>
                                        <span className="text-[var(--label)] text-[length:var(--text-footnote-size)]">{(modelStats.totalRunningLoad || 0).toFixed(1)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* total solar */}
                                  <div className="flex items-center justify-between text-[length:var(--text-footnote-size)] py-1.5 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                    <span className="text-[var(--label-secondary)]">Total solar</span>
                                    <span className={cn(
                                      "font-medium font-[family-name:var(--font-numeric)]",
                                      modelStats.actualSolarCapacity > 0 ? "text-[var(--system-green)]" : "text-[var(--label-tertiary)]"
                                    )}>
                                      {modelStats.actualSolarCapacity > 0 ? `${modelStats.actualSolarCapacity.toFixed(1)} kWp` : 'None / Disabled'}
                                    </span>
                                  </div>

                                  {/* backup hours */}
                                  <div className="flex items-center justify-between text-[length:var(--text-footnote-size)] py-1.5 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                    <span className="text-[var(--label-secondary)]">Backup hours</span>
                                    <span className="font-medium text-[var(--label)] font-[family-name:var(--font-numeric)]">
                                      {modelStats.rectifierStats?.batteryBackupHours?.toFixed(1)} Hrs
                                    </span>
                                  </div>

                                  {/* breakeven MRR */}
                                  <div className="flex items-center justify-between text-[length:var(--text-footnote-size)] py-1.5 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                    <span className="text-[var(--label-secondary)] font-medium">Breakeven MRR</span>
                                    <span className="font-semibold text-[var(--tint)] font-[family-name:var(--font-numeric)]">
                                      {currency} {Math.round(modelStats.breakevenMRR || 0).toLocaleString()}
                                    </span>
                                  </div>

                                  {/* LCOE */}
                                  <div className="flex items-center justify-between text-[length:var(--text-footnote-size)] py-1.5 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                    <span className="text-[var(--label-secondary)] font-medium">LCOE</span>
                                    <span className="font-semibold text-[var(--label)] font-[family-name:var(--font-numeric)]">
                                      {currency} {(modelStats.lcoe || 0).toFixed(4)} <span className="text-[length:var(--text-caption-2-size)] text-[var(--label-tertiary)]">/kWh</span>
                                    </span>
                                  </div>

                                  {/* Initial Capex */}
                                  <div className="flex items-center justify-between text-[length:var(--text-footnote-size)] py-1.5">
                                    <span className="text-[var(--label-secondary)] font-medium">Initial CAPEX</span>
                                    <span className="font-semibold text-[var(--system-orange)] font-[family-name:var(--font-numeric)]">
                                      {currency} {Math.round(modelStats.initialCapex || 0).toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                {/* ADDITIONAL INFO */}
                                <div className="space-y-3 pt-3 shadow-[inset_0_0.5px_0_var(--separator)] -mx-5 -mb-5 p-5 rounded-b-[var(--radius-element)] bg-[var(--bg-elevated)]">
                                  <span className="text-[length:var(--text-caption-1-size)] font-semibold text-[var(--label-secondary)] block">Operational details</span>
                                  
                                  {/* Daily DG Hours */}
                                  <div className="flex items-center justify-between text-[length:var(--text-footnote-size)] py-1 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                    <span className="text-[var(--label-secondary)]">DG running hours</span>
                                    <span className="font-medium text-[var(--label)] font-[family-name:var(--font-numeric)]">
                                      {modelStats.rectifierStats?.dgRunningHoursPerDay?.toFixed(1)} Hrs/Day
                                    </span>
                                  </div>

                                  {/* Daily fuel */}
                                  <div className="flex items-center justify-between text-[length:var(--text-footnote-size)] py-1 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                    <span className="text-[var(--label-secondary)]">Daily fuel vol</span>
                                    <span className="font-medium text-[var(--label)] font-[family-name:var(--font-numeric)]">
                                      {modelStats.rectifierStats?.dgDailyFuel?.toFixed(1)} L/Day
                                    </span>
                                  </div>

                                  {/* Energy mix visually stacked bar */}
                                  <div className="space-y-1.5 py-1 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                    <span className="text-[var(--label-secondary)] text-[length:var(--text-footnote-size)] block">Estimated energy mix</span>
                                    <div className="h-2 rounded-[var(--radius-capsule)] overflow-hidden flex w-full bg-[var(--fill-tertiary)]">
                                      {gridPct > 0 && <div className="bg-[var(--tint)] h-full" style={{ width: `${gridPct}%` }} title={`Grid: ${gridPct.toFixed(1)}%`} />}
                                      {dgPct > 0 && <div className="bg-[var(--system-orange)] h-full" style={{ width: `${dgPct}%` }} title={`DG: ${dgPct.toFixed(1)}%`} />}
                                      {solarPct > 0 && <div className="bg-[var(--system-green)] h-full" style={{ width: `${solarPct}%` }} title={`Solar: ${solarPct.toFixed(1)}%`} />}
                                    </div>
                                    <div className="flex justify-between text-[length:var(--text-caption-2-size)]">
                                      <span className="text-[var(--tint)]">Grid {gridPct.toFixed(0)}%</span>
                                      <span className="text-[var(--system-orange)]">DG {dgPct.toFixed(0)}%</span>
                                      <span className="text-[var(--system-green)]">Solar {solarPct.toFixed(0)}%</span>
                                    </div>
                                  </div>

                                  {/* Battery replacement */}
                                  <div className="flex items-center justify-between text-[length:var(--text-footnote-size)] py-1 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                    <span className="text-[var(--label-secondary)]">Battery replacement</span>
                                    <span className="font-medium text-[var(--system-green)] font-[family-name:var(--font-numeric)]">
                                      Year {modelStats.rectifierStats?.batteryLifeYears != null && modelStats.rectifierStats.batteryLifeYears < 100 ? modelStats.rectifierStats.batteryLifeYears : project.data.financials?.tenure || 10}
                                    </span>
                                  </div>

                                  {/* DG replacement */}
                                  <div className="flex items-center justify-between text-[length:var(--text-footnote-size)] py-0.5">
                                    <span className="text-[var(--label-secondary)]">DG replacement</span>
                                    <span className="font-medium text-[var(--system-green)] font-[family-name:var(--font-numeric)]">
                                      Year {modelStats.rectifierStats?.dgLifeYears != null && modelStats.rectifierStats.dgLifeYears < 100 ? modelStats.rectifierStats.dgLifeYears : project.data.financials?.tenure || 10}
                                    </span>
                                  </div>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-[0_0_0_0.5px_var(--separator)]">
                          <p className="text-[length:var(--text-subhead-size)] text-[var(--label-secondary)]">Add a project to compare.</p>
                          {userDbTemplates[0] && (
                            <Button
                              variant="filled"
                              onClick={() => setComparedProjects([{ id: userDbTemplates[0].id, name: userDbTemplates[0].name, data: userDbTemplates[0].data }])}
                            >
                              Add “{userDbTemplates[0].name}”
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'optimization' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-[var(--space-3)]">
                    <div className="p-[var(--space-3)] bg-[var(--tint-soft)] rounded-[var(--radius-element)]">
                      <Sparkles className="w-6 h-6 text-[var(--tint)]" />
                    </div>
                    <div>
                      <h2 className="text-[length:var(--text-title-3-size)] leading-[var(--text-title-3-line)] font-semibold text-[var(--label)]">
                        Design optimization
                      </h2>
                      <p className="text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] text-[var(--label-secondary)] mt-0.5">Try other battery, charger, generator, and solar sizes to lower LCOE and breakeven MRR</p>
                    </div>
                  </div>

                  {!optimizedProject ? (
                    <div className="space-y-6">
                      <div 
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "copy";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          try {
                            const dataStr = e.dataTransfer.getData('text/plain');
                            if (!dataStr) return;
                            const project = JSON.parse(dataStr);
                            if (project && project.id) {
                              setOptimizedProject(project);
                              setSelectedOptimizationOptionIndex(null);
                              setNewOptimizedProjectName(`${project.name}_Optimized`);
                              notify(`“${project.name}” is ready to optimize.`, 'success');
                            }
                          } catch (err) {
                            console.error("Failed to drop project:", err);
                          }
                        }}
                        className="rounded-[var(--radius-element)] p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[220px] bg-[var(--fill-quaternary)] shadow-[0_0_0_0.5px_var(--separator)]"
                      >
                        <div className="p-4 rounded-full text-[var(--tint)] bg-[var(--tint-soft)]">
                          <Sliders className="w-8 h-8" />
                        </div>
                        <div className="max-w-md space-y-4">
                          <p className="text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] text-[var(--label-secondary)]">
                            {userDbTemplates.length === 0
                              ? 'Save a project, then optimize it.'
                              : 'Pick a saved project below, or drag one here.'}
                          </p>
                          {userDbTemplates.length === 0 && (
                            <Button
                              variant="filled"
                              onClick={() => {
                                setSaveTemplateDbName(currentTemplateName);
                                setShowSaveTemplateDbModal(true);
                              }}
                            >
                              Save as project
                            </Button>
                          )}
                        </div>
                      </div>

                      {userDbTemplates.length > 0 && (
                        <div className="rounded-[var(--radius-element)] p-6 space-y-3 bg-[var(--fill-quaternary)] shadow-[0_0_0_0.5px_var(--separator)]">
                          <span className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] block text-center">Quick select</span>
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            {userDbTemplates.map((t) => (
                              <button
                                key={t.id}
                                onClick={() => {
                                  setOptimizedProject({ id: t.id, name: t.name, data: t.data });
                                  setSelectedOptimizationOptionIndex(null);
                                  setNewOptimizedProjectName(`${t.name}_Optimized`);
                                  notify(`“${t.name}” is ready to optimize.`, 'success');
                                }}
                                className="px-3.5 py-1.5 text-[length:var(--text-caption-1-size)] rounded-[var(--radius-capsule)] cursor-pointer bg-[var(--tint-soft)] text-[var(--tint)] hover:opacity-90"
                              >
                                {t.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Active Project Card */}
                      <div className="flex items-center justify-between px-5 py-4 bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] shadow-[0_0_0_0.5px_var(--separator)]">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[var(--tint-soft)] rounded-[var(--radius-control)]">
                            <Sliders className="w-4 h-4 text-[var(--tint)]" />
                          </div>
                          <div>
                            <span className="text-[length:var(--text-caption-1-size)] text-[var(--label-tertiary)] block">Selected project</span>
                            <span className="text-[length:var(--text-subhead-size)] font-semibold text-[var(--label)] font-[family-name:var(--font-numeric)]">{optimizedProject.name}</span>
                          </div>
                        </div>
                        <Button
                          variant="gray"
                          size="compact"
                          onClick={() => {
                            setOptimizedProject(null);
                            setSelectedOptimizationOptionIndex(null);
                            setNewOptimizedProjectName("");
                          }}
                        >
                          Change project
                        </Button>
                      </div>

                      {/* Proposals Container */}
                      <div className="space-y-4">
                        <div className="pb-2 shadow-[inset_0_-0.5px_0_var(--separator)]">
                          <h3 className="text-[length:var(--text-subhead-size)] font-semibold text-[var(--label)]">Optimized configurations</h3>
                        </div>

                        {(() => {
                          const options = getOptimizationOptions(optimizedProject.data);
                          const baselineStats = calculateAllStats(optimizedProject.data);
                          const currency = optimizedProject.data.financials?.currency || "$";
                          return (
                            <div className="space-y-6">
                              {options.length === 0 ? (
                                <div className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-8 max-w-xl mx-auto text-center space-y-4 shadow-[0_0_0_0.5px_var(--separator)]">
                                  <Sparkles className="w-8 h-8 text-[var(--system-green)] mx-auto" />
                                  <p className="text-[length:var(--text-subhead-size)] text-[var(--label-secondary)] leading-relaxed max-w-md mx-auto">
                                    No cheaper option found — other sizes would raise LCOE or breakeven MRR.
                                  </p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                  {options.map((option, idx) => {
                                    const isSelected = selectedOptimizationOptionIndex === idx;

                                    // calc improvements percentage
                                    const mrrDiffPct = baselineStats.breakevenMRR ? ((option.mrr - baselineStats.breakevenMRR) / baselineStats.breakevenMRR) * 100 : 0;
                                    const lcoeDiffPct = baselineStats.lcoe ? ((option.lcoe - baselineStats.lcoe) / baselineStats.lcoe) * 100 : 0;

                                    return (
                                      <div
                                        key={idx}
                                        onClick={() => setSelectedOptimizationOptionIndex(idx)}
                                        className={cn(
                                          "rounded-[var(--radius-element)] p-5 flex flex-col justify-between space-y-4 cursor-pointer relative bg-[var(--fill-quaternary)] shadow-[0_0_0_0.5px_var(--separator)]",
                                          isSelected && "shadow-[0_0_0_2px_var(--tint-soft),0_0_0_0.5px_var(--tint)]"
                                        )}
                                      >
                                        {isSelected && (
                                          <div className="absolute top-3 right-3 bg-[var(--tint)] text-[var(--on-tint)] px-2 py-0.5 rounded-[var(--radius-capsule)] text-[length:var(--text-caption-2-size)] font-medium">
                                            Selected
                                          </div>
                                        )}

                                        <div className="space-y-1.5">
                                          <h4 className={cn(
                                            "text-[length:var(--text-subhead-size)] font-semibold pr-12",
                                            idx === 0 ? "text-[var(--system-orange)]" : idx === 1 ? "text-[var(--tint)]" : "text-[var(--system-green)]"
                                          )}>
                                            {option.name}
                                          </h4>
                                          <p className="text-[length:var(--text-caption-1-size)] text-[var(--label-secondary)] leading-relaxed">
                                            {option.description}
                                          </p>
                                        </div>

                                        {/* Comparative Metrics Grid */}
                                        <div className="grid grid-cols-2 gap-2 bg-[var(--bg-elevated)] rounded-[var(--radius-element)] p-3 shadow-[0_0_0_0.5px_var(--separator)]">
                                          <div className="space-y-1">
                                            <span className="text-[length:var(--text-caption-2-size)] text-[var(--label-tertiary)] block">Breakeven MRR</span>
                                            <div className="flex items-baseline gap-1.5">
                                              <span className="font-[family-name:var(--font-numeric)] text-[length:var(--text-footnote-size)] font-semibold text-[var(--label)]">
                                                {currency} {Math.round(option.mrr).toLocaleString()}
                                              </span>
                                              {mrrDiffPct !== 0 && (
                                                <span className={cn(
                                                  "text-[length:var(--text-caption-2-size)] font-[family-name:var(--font-numeric)]",
                                                  mrrDiffPct < 0 ? "text-[var(--system-green)]" : "text-[var(--system-red)]"
                                                )}>
                                                  {mrrDiffPct < 0 ? '' : '+'}{mrrDiffPct.toFixed(1)}%
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-[length:var(--text-caption-2-size)] text-[var(--label-tertiary)] block">Baseline: {currency} {Math.round(baselineStats.breakevenMRR || 0).toLocaleString()}</span>
                                          </div>

                                          <div className="space-y-1">
                                            <span className="text-[length:var(--text-caption-2-size)] text-[var(--label-tertiary)] block">Amortized LCOE</span>
                                            <div className="flex items-baseline gap-1.5">
                                              <span className="font-[family-name:var(--font-numeric)] text-[length:var(--text-footnote-size)] font-semibold text-[var(--label)]">
                                                {currency} {option.lcoe.toFixed(4)}
                                              </span>
                                              {lcoeDiffPct !== 0 && (
                                                <span className={cn(
                                                  "text-[length:var(--text-caption-2-size)] font-[family-name:var(--font-numeric)]",
                                                  lcoeDiffPct < 0 ? "text-[var(--system-green)]" : "text-[var(--system-red)]"
                                                )}>
                                                  {lcoeDiffPct < 0 ? '' : '+'}{lcoeDiffPct.toFixed(1)}%
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-[length:var(--text-caption-2-size)] text-[var(--label-tertiary)] block">Baseline: {currency} {(baselineStats.lcoe || 0).toFixed(4)}</span>
                                          </div>

                                          <div className="col-span-2 pt-2 shadow-[inset_0_0.5px_0_var(--separator)] flex items-center justify-between text-[length:var(--text-caption-1-size)]">
                                            <span className="text-[var(--label-secondary)]">CAPEX</span>
                                            <span className="font-[family-name:var(--font-numeric)] font-semibold text-[var(--system-orange)]">
                                              {currency} {Math.round(option.capex).toLocaleString()}
                                              <span className="text-[var(--label-tertiary)] text-[length:var(--text-caption-2-size)] font-normal ml-1">
                                                (Baseline: {currency} {Math.round(baselineStats.initialCapex || 0).toLocaleString()})
                                              </span>
                                            </span>
                                          </div>
                                        </div>

                                        {/* Tweaks list */}
                                        <div className="space-y-1.5">
                                          <span className="text-[length:var(--text-caption-1-size)] font-semibold text-[var(--label-secondary)] block pb-1 shadow-[inset_0_-0.5px_0_var(--separator)]">Proposed tweaks</span>
                                          <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar">
                                            {option.tweaks.map((tweak: any, tIdx: number) => (
                                              <div key={tIdx} className="flex justify-between items-center text-[length:var(--text-caption-1-size)] py-1 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                                <span className="text-[var(--label-secondary)]">{tweak.label}</span>
                                                <div className="flex items-center gap-1 font-[family-name:var(--font-numeric)] text-[length:var(--text-caption-2-size)]">
                                                  <span className="text-[var(--label-tertiary)] line-through pr-0.5">{tweak.previous}</span>
                                                  <ArrowRight className="w-3 h-3 text-[var(--system-orange)]" />
                                                  <span className="text-[var(--system-green)]">{tweak.value}</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* DG Performance & Energy Mix */}
                                        {(() => {
                                          const bDgEnabled = optimizedProject.data.dg.enabled;
                                          const oDgEnabled = option.data.dg.enabled;
                                          
                                          const bDgHours = bDgEnabled ? (baselineStats.rectifierStats?.dgRunningHoursPerDay ?? 0) : 0;
                                          const oDgHours = oDgEnabled ? (option.stats?.rectifierStats?.dgRunningHoursPerDay ?? 0) : 0;
                                          
                                          const bDgFuel = bDgEnabled ? (baselineStats.rectifierStats?.dgDailyFuel ?? 0) : 0;
                                          const oDgFuel = oDgEnabled ? (option.stats?.rectifierStats?.dgDailyFuel ?? 0) : 0;

                                          const bg = baselineStats.rectifierStats?.dailyGridEnergy || 0;
                                          const bd = baselineStats.rectifierStats?.dgDailyEnergyGeneration || 0;
                                          const bs = baselineStats.rectifierStats?.dailySolarEnergy || 0;
                                          const btot = bg + bd + bs;
                                          const bGridPct = btot > 0 ? (bg / btot) * 100 : 0;
                                          const bDgPct = btot > 0 ? (bd / btot) * 100 : 0;
                                          const bSolarPct = btot > 0 ? (bs / btot) * 100 : 0;

                                          const og = option.stats?.rectifierStats?.dailyGridEnergy || 0;
                                          const od = option.stats?.rectifierStats?.dgDailyEnergyGeneration || 0;
                                          const os = option.stats?.rectifierStats?.dailySolarEnergy || 0;
                                          const otot = og + od + os;
                                          const oGridPct = otot > 0 ? (og / otot) * 100 : 0;
                                          const oDgPct = otot > 0 ? (od / otot) * 100 : 0;
                                          const oSolarPct = otot > 0 ? (os / otot) * 100 : 0;

                                          // Calculate differences
                                          const hoursDiff = oDgHours - bDgHours;
                                          const fuelDiff = oDgFuel - bDgFuel;

                                          return (
                                            <div className="space-y-2 pt-1 shadow-[inset_0_0.5px_0_var(--separator)]">
                                              <span className="text-[length:var(--text-caption-1-size)] font-semibold text-[var(--label-secondary)] block pb-1 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                                DG and energy mix
                                              </span>
                                              
                                              {/* DG Metrics Rows */}
                                              <div className="space-y-1.5 text-[length:var(--text-caption-1-size)]">
                                                {/* Run Hours */}
                                                <div className="flex justify-between items-center py-0.5 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                                  <span className="text-[var(--label-secondary)]">DG run time</span>
                                                  <div className="flex items-center gap-1 font-[family-name:var(--font-numeric)] text-[length:var(--text-caption-2-size)]">
                                                    <span className="text-[var(--label-tertiary)] line-through">
                                                      {bDgEnabled ? `${bDgHours.toFixed(1)} h/d` : "Disabled"}
                                                    </span>
                                                    <ArrowRight className="w-3 h-3 text-[var(--system-orange)]" />
                                                    <span className={cn(
                                                      oDgEnabled ? (hoursDiff <= 0 ? "text-[var(--system-green)]" : "text-[var(--system-orange)]") : "text-[var(--label-tertiary)]"
                                                    )}>
                                                      {oDgEnabled ? `${oDgHours.toFixed(1)} h/d` : "Disabled"}
                                                    </span>
                                                    {bDgEnabled && oDgEnabled && hoursDiff !== 0 && (
                                                      <span className={cn(
                                                        "text-[length:var(--text-caption-2-size)] ml-1 px-1 rounded-[var(--radius-control)]",
                                                        hoursDiff < 0 ? "bg-[color-mix(in_srgb,var(--system-green)_14%,transparent)] text-[var(--system-green)]" : "bg-[color-mix(in_srgb,var(--system-orange)_14%,transparent)] text-[var(--system-orange)]"
                                                      )}>
                                                        ({hoursDiff < 0 ? "" : "+"}{hoursDiff.toFixed(1)} h)
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Fuel Consumption */}
                                                <div className="flex justify-between items-center py-0.5 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                                  <span className="text-[var(--label-secondary)]">Daily fuel</span>
                                                  <div className="flex items-center gap-1 font-[family-name:var(--font-numeric)] text-[length:var(--text-caption-2-size)]">
                                                    <span className="text-[var(--label-tertiary)] line-through">
                                                      {bDgEnabled ? `${Math.round(bDgFuel)} L` : "N/A"}
                                                    </span>
                                                    <ArrowRight className="w-3 h-3 text-[var(--system-orange)]" />
                                                    <span className={cn(
                                                      oDgEnabled ? (fuelDiff <= 0 ? "text-[var(--system-green)]" : "text-[var(--system-orange)]") : "text-[var(--label-tertiary)]"
                                                    )}>
                                                      {oDgEnabled ? `${Math.round(oDgFuel)} L` : "Disabled"}
                                                    </span>
                                                    {bDgEnabled && oDgEnabled && fuelDiff !== 0 && (
                                                      <span className={cn(
                                                        "text-[length:var(--text-caption-2-size)] ml-1 px-1 rounded-[var(--radius-control)]",
                                                        fuelDiff < 0 ? "bg-[color-mix(in_srgb,var(--system-green)_14%,transparent)] text-[var(--system-green)]" : "bg-[color-mix(in_srgb,var(--system-orange)_14%,transparent)] text-[var(--system-orange)]"
                                                      )}>
                                                        ({fuelDiff < 0 ? "" : "+"}{Math.round(fuelDiff)} L)
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Energy Mix Stacked Bar / Breakdown */}
                                                <div className="space-y-1.5 pt-1.5">
                                                  <div className="flex justify-between items-center text-[length:var(--text-caption-2-size)] text-[var(--label-tertiary)]">
                                                    <span>Baseline mix</span>
                                                    <div className="flex gap-2">
                                                      <span className="text-[var(--system-blue)]">Grid: {bGridPct.toFixed(0)}%</span>
                                                      <span className="text-[var(--system-green)]">Solar: {bSolarPct.toFixed(0)}%</span>
                                                      <span className="text-[var(--tint)]">DG: {bDgPct.toFixed(0)}%</span>
                                                    </div>
                                                  </div>
                                                  {/* Baseline segment bar */}
                                                  <div className="h-1.5 w-full bg-[var(--fill-tertiary)] rounded-[var(--radius-capsule)] overflow-hidden flex">
                                                    {bGridPct > 0 && <div className="h-full bg-[var(--system-blue)]" style={{ width: `${bGridPct}%` }} />}
                                                    {bSolarPct > 0 && <div className="h-full bg-[var(--system-green)]" style={{ width: `${bSolarPct}%` }} />}
                                                    {bDgPct > 0 && <div className="h-full bg-[var(--tint)]" style={{ width: `${bDgPct}%` }} />}
                                                    {btot === 0 && <div className="h-full bg-[var(--fill)] w-full" />}
                                                  </div>

                                                  <div className="flex justify-between items-center text-[length:var(--text-caption-2-size)] text-[var(--label-secondary)] pt-0.5">
                                                    <span>Option mix</span>
                                                    <div className="flex gap-2">
                                                      <span className="text-[var(--system-blue)]">Grid: {oGridPct.toFixed(0)}%</span>
                                                      <span className="text-[var(--system-green)]">Solar: {oSolarPct.toFixed(0)}%</span>
                                                      <span className="text-[var(--tint)]">DG: {oDgPct.toFixed(0)}%</span>
                                                    </div>
                                                  </div>
                                                  {/* Option segment bar */}
                                                  <div className="h-1.5 w-full bg-[var(--fill-tertiary)] rounded-[var(--radius-capsule)] overflow-hidden flex">
                                                    {oGridPct > 0 && <div className="h-full bg-[var(--system-blue)]" style={{ width: `${oGridPct}%` }} />}
                                                    {oSolarPct > 0 && <div className="h-full bg-[var(--system-green)]" style={{ width: `${oSolarPct}%` }} />}
                                                    {oDgPct > 0 && <div className="h-full bg-[var(--tint)]" style={{ width: `${oDgPct}%` }} />}
                                                    {otot === 0 && <div className="h-full bg-[var(--fill)] w-full" />}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })()}

                                        {/* CAPEX Line-Item Breakdown Differences */}
                                        {option.capexDiffs && option.capexDiffs.length > 0 && (
                                          <div className="space-y-1.5 pt-1">
                                            <span className="text-[length:var(--text-caption-1-size)] font-semibold text-[var(--label-secondary)] block pb-1 shadow-[inset_0_-0.5px_0_var(--separator)]">CAPEX changes</span>
                                            <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar">
                                              {option.capexDiffs.map((diff: any, dIdx: number) => (
                                                <div key={dIdx} className="flex justify-between items-start text-[length:var(--text-caption-1-size)] py-1 shadow-[inset_0_-0.5px_0_var(--separator)]">
                                                  <div className="flex flex-col">
                                                    <span className="font-medium text-[var(--label)]">{diff.item}</span>
                                                    <span className="text-[length:var(--text-caption-2-size)] text-[var(--label-tertiary)] font-[family-name:var(--font-numeric)]">
                                                      Qty: {diff.previousQty} → {diff.currentQty}
                                                    </span>
                                                  </div>
                                                  <div className="flex flex-col items-end">
                                                    <span className={cn(
                                                      "font-[family-name:var(--font-numeric)] text-[length:var(--text-caption-2-size)] font-semibold",
                                                      diff.difference < 0 ? "text-[var(--system-green)]" : "text-[var(--system-orange)]"
                                                    )}>
                                                      {diff.difference < 0 ? "" : "+"}{diff.difference < 0 ? "-" : ""}{currency}{Math.abs(Math.round(diff.difference)).toLocaleString()}
                                                    </span>
                                                    <span className="text-[length:var(--text-caption-2-size)] text-[var(--label-tertiary)] font-[family-name:var(--font-numeric)]">
                                                      {currency}{Math.round(diff.previousCost).toLocaleString()} → {currency}{Math.round(diff.currentCost).toLocaleString()}
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        <Button
                                          variant={isSelected ? "filled" : "gray"}
                                          className="w-full"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedOptimizationOptionIndex(idx);
                                          }}
                                        >
                                          {isSelected ? "Selected" : "Choose configuration"}
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Apply optimized project section */}
                              {selectedOptimizationOptionIndex !== null && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-[var(--fill-quaternary)] rounded-[var(--radius-element)] p-6 space-y-4 max-w-xl mx-auto text-center shadow-[0_0_0_0.5px_var(--separator)]"
                                >
                                  <div>
                                    <h4 className="text-[length:var(--text-headline-size)] font-semibold text-[var(--label)] flex items-center justify-center gap-2">
                                      <Sliders className="w-4 h-4 text-[var(--tint)]" />
                                      Apply and save
                                    </h4>
                                    <p className="text-[length:var(--text-footnote-size)] text-[var(--label-secondary)] mt-1">Creates a new project with the recommended tweaks. The original baseline is left unchanged.</p>
                                  </div>

                                  <div className="pt-2">
                                    <Button
                                      variant="filled"
                                      className="w-full"
                                      onClick={() => setShowSaveOptimizedModal(true)}
                                    >
                                      Apply and save optimized project
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'life_sim' && (
                <div className="space-y-6">
                  <LifeSimulationPanel
                    projects={userDbTemplates.map(t => ({ id: t.id, name: t.name, data: t.data }))}
                    onSaveProject={() => {
                      setSaveTemplateDbName(currentTemplateName);
                      setShowSaveTemplateDbModal(true);
                    }}
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              {activeSection !== 'comparison' && activeSection !== 'optimization' && (
                <div className="pt-[var(--space-8)] mt-[var(--space-8)] flex items-center justify-between shadow-[inset_0_0.5px_0_var(--separator)]">
                  <Button
                    variant="gray"
                    onClick={handlePrevStep}
                    disabled={currentStep === 1}
                    className={cn(currentStep === 1 && "opacity-0")}
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  <Button
                    variant="filled"
                    onClick={handleNextStep}
                    disabled={currentStep === STEPS.length}
                    className={cn(currentStep === STEPS.length && "hidden")}
                  >
                    <span>{currentStep === 6 ? 'Report' : currentStep === 7 ? 'Life simulation' : 'Next'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        )}

      </main>

      <AnimatePresence>
        {showNewProjectModal && (
          <div className="sheet-backdrop z-[200]">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              className="sheet max-w-md"
            >
              <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-6)]">
                <div className="p-[var(--space-3)] bg-[var(--tint-soft)] rounded-[var(--radius-element)]">
                  <FilePlus className="w-5 h-5 text-[var(--tint)]" />
                </div>
                <div>
                  <h2 className="text-[length:var(--text-title-3-size)] leading-[var(--text-title-3-line)] font-semibold text-[var(--label)]">New project</h2>
                  <p className="text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] text-[var(--label-secondary)]">Choose a starting point for your design</p>
                </div>
              </div>

              <div className="flex flex-col gap-[var(--space-5)]">
                <Field label="Template">
                  <div className="relative flex items-center overflow-hidden h-[var(--control-height)] min-h-[var(--control-height)] rounded-[var(--radius-control)] bg-[var(--fill-tertiary)] shadow-[0_0_0_0.5px_var(--separator)] focus-within:shadow-[0_0_0_2px_var(--tint-soft),0_0_0_0.5px_var(--tint)]">
                    <select
                      value={selectedTemplate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedTemplate(val);
                        if (val === 'blank') {
                          setNewProjectName("");
                        } else {
                          setNewProjectName(val);
                        }
                      }}
                      className="ui-field-input w-full h-full appearance-none cursor-pointer bg-transparent border-0 outline-none px-[var(--space-3)] pr-10 text-[length:var(--text-body-size)] text-[var(--label)]"
                    >
                      <option value="" disabled>Choose a template…</option>
                      {systemTemplates.map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
                      <option value="blank">Start from scratch (blank)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--label-tertiary)] pointer-events-none" />
                  </div>
                </Field>

                {selectedTemplate && (
                  <Field
                    label={selectedTemplate === 'blank' ? "Project name (required)" : "Project / template name"}
                    type="text"
                    placeholder="e.g. My custom project"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    autoFocus
                  />
                )}

                <div className="flex gap-[var(--space-3)]">
                  <Button variant="gray" className="flex-1" onClick={() => setShowNewProjectModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="filled"
                    className="flex-1"
                    disabled={!selectedTemplate || !newProjectName.trim()}
                    onClick={() => {
                      if (!selectedTemplate || !newProjectName.trim()) return;
                      if (selectedTemplate === 'blank') {
                        confirmNewProject(BLANK_INPUTS, newProjectName.trim());
                      } else {
                        const template = systemTemplates.find(t => t.name === selectedTemplate);
                        if (template) confirmNewProject(template.data, newProjectName.trim());
                      }
                    }}
                  >
                    Create project
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {promptOpen && (
          <div className="sheet-backdrop z-[300]">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              className="sheet max-w-sm"
            >
              <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-4)]">
                <div className="p-2.5 bg-[var(--tint-soft)] rounded-[var(--radius-element)]">
                  <Download className="w-5 h-5 text-[var(--tint)]" />
                </div>
                <div>
                  <h2 className="text-[length:var(--text-headline-size)] leading-[var(--text-headline-line)] font-semibold text-[var(--label)]">{promptTitle}</h2>
                  <p className="text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line)] text-[var(--label-secondary)]">Specify a filename</p>
                </div>
              </div>

              <div className="flex flex-col gap-[var(--space-4)]">
                <Field
                  label="Filename"
                  type="text"
                  value={promptInputValue}
                  onChange={(e) => setPromptInputValue(e.target.value)}
                  placeholder="Enter filename…"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (promptInputValue.trim()) {
                        promptOnConfirm?.(promptInputValue.trim());
                        setPromptOpen(false);
                      }
                    }
                  }}
                />

                <div className="flex gap-[var(--space-2)]">
                  <Button variant="gray" className="flex-1" onClick={() => setPromptOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="filled"
                    className="flex-1"
                    disabled={!promptInputValue.trim()}
                    onClick={() => {
                      if (promptInputValue.trim()) {
                        promptOnConfirm?.(promptInputValue.trim());
                        setPromptOpen(false);
                      }
                    }}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showReplaceSheet && pendingOpen && (
          <div className="sheet-backdrop z-[280]">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              className="sheet max-w-sm"
            >
              <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-4)]">
                <div className="p-2.5 bg-[var(--tint-soft)] rounded-[var(--radius-element)]">
                  <AlertTriangle className="w-5 h-5 text-[var(--tint)]" />
                </div>
                <div>
                  <h2 className="text-[length:var(--text-headline-size)] leading-[var(--text-headline-line)] font-semibold text-[var(--label)]">Replace working design?</h2>
                  <p className="text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line)] text-[var(--label-secondary)]">
                    You have unsaved changes. Opening “{pendingOpen.name}” will replace them.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-[var(--space-2)]">
                <Button
                  variant="filled"
                  className="w-full"
                  onClick={() => applyOpenDesign(pendingOpen.name, pendingOpen.data)}
                >
                  Replace
                </Button>
                <Button
                  variant="tinted"
                  className="w-full"
                  onClick={() => {
                    setShowReplaceSheet(false);
                    setSaveTemplateDbName(currentTemplateName);
                    setShowSaveTemplateDbModal(true);
                  }}
                >
                  Save first
                </Button>
                <Button
                  variant="gray"
                  className="w-full"
                  onClick={() => {
                    setShowReplaceSheet(false);
                    setPendingOpen(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {showSaveTemplateDbModal && (
          <div className="sheet-backdrop z-[300]">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              className="sheet max-w-sm"
            >
              <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-4)]">
                <div className="p-2.5 bg-[var(--tint-soft)] rounded-[var(--radius-element)]">
                  <CheckCircle2 className="w-5 h-5 text-[var(--tint)]" />
                </div>
                <div>
                  <h2 className="text-[length:var(--text-headline-size)] leading-[var(--text-headline-line)] font-semibold text-[var(--label)]">Save as project</h2>
                  <p className="text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line)] text-[var(--label-secondary)]">Save to your project list for comparison</p>
                </div>
              </div>

              <div className="flex flex-col gap-[var(--space-4)]">
                <Field
                  label="Project name"
                  type="text"
                  placeholder="e.g. ECPH_Bad Grid_G4"
                  value={saveTemplateDbName}
                  onChange={(e) => setSaveTemplateDbName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && saveTemplateDbName.trim()) {
                      handleSaveTemplateToDb(saveTemplateDbName.trim());
                    }
                  }}
                />

                {currentUser?.role === 'admin' && (
                  <label className="flex items-center gap-2 text-[length:var(--text-footnote-size)] text-[var(--label)] cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      checked={saveAsSystem}
                      onChange={(e) => setSaveAsSystem(e.target.checked)}
                      className="w-3.5 h-3.5"
                    />
                    <span>Save as system template (all users, New project)</span>
                  </label>
                )}

                <div className="flex gap-[var(--space-2)]">
                  <Button variant="gray" className="flex-1" onClick={() => setShowSaveTemplateDbModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="filled"
                    className="flex-1"
                    disabled={!saveTemplateDbName.trim()}
                    onClick={() => handleSaveTemplateToDb(saveTemplateDbName.trim())}
                  >
                    Save project
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showSaveOptimizedModal && (
          <div className="sheet-backdrop z-[300]">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              className="sheet max-w-sm"
            >
              <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-4)]">
                <div className="p-2.5 bg-[var(--tint-soft)] rounded-[var(--radius-element)]">
                  <Sparkles className="w-5 h-5 text-[var(--tint)]" />
                </div>
                <div>
                  <h2 className="text-[length:var(--text-headline-size)] leading-[var(--text-headline-line)] font-semibold text-[var(--label)]">Save optimized design</h2>
                  <p className="text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line)] text-[var(--label-secondary)]">Save as a new project</p>
                </div>
              </div>

              <div className="flex flex-col gap-[var(--space-4)]">
                <Field
                  label="Project name"
                  type="text"
                  placeholder="e.g. Project Alpha (LCOE Optimized)"
                  value={newOptimizedProjectName}
                  onChange={(e) => setNewOptimizedProjectName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newOptimizedProjectName.trim() && selectedOptimizationOptionIndex !== null && optimizedProject) {
                      const options = getOptimizationOptions(optimizedProject.data);
                      handleSaveOptimizedProject(options[selectedOptimizationOptionIndex].data);
                    }
                  }}
                />

                <div className="flex gap-[var(--space-2)]">
                  <Button variant="gray" className="flex-1" onClick={() => setShowSaveOptimizedModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="filled"
                    className="flex-1"
                    disabled={!newOptimizedProjectName.trim()}
                    onClick={() => {
                      if (selectedOptimizationOptionIndex !== null && optimizedProject) {
                        const options = getOptimizationOptions(optimizedProject.data);
                        handleSaveOptimizedProject(options[selectedOptimizationOptionIndex].data);
                      }
                    }}
                  >
                    Save project
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {toast && (
        <div className="fixed top-[calc(var(--toolbar-height)+var(--space-3))] left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
          <Toast message={toast.message} tone={toast.tone} onDismiss={dismissToast} />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}
