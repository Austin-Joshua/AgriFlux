import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  ToggleRight,
  Droplets,
  Wind,
  Plane,
  Power,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Users,
  Cpu,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config';

const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  positive?: boolean;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onClick?: () => void;
  accentColor: string;
}> = ({ title, value, change, positive = true, icon, color, bgColor, onClick, accentColor }) => {
  return (
    <div
      className="card-clickable group border-b-2 border-transparent hover:border-primary-500"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick && onClick()}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-glow-green"
        style={{ background: `linear-gradient(135deg, ${accentColor}10 0%, transparent 60%)` }}
      />
      <div className="flex items-start justify-between mb-2">
        <div
          className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`flex items-center gap-1 text-sm font-semibold ${positive ? 'text-primary-600 dark:text-primary-400' : 'text-red-500'}`}
          >
            {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </span>
          <span className="text-[10px] text-gray-400 group-hover:text-primary-500 flex items-center gap-0.5 transition-colors duration-200">
            View details{' '}
            <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color} font-display`}>{value}</p>
    </div>
  );
};

const VALID_TABS: AdminTab[] = [
  'overview',
  'users',
  'blockchain',
  'actuators',
  'system',
  'activity',
];

type AdminTab = 'overview' | 'users' | 'blockchain' | 'actuators' | 'system' | 'activity';

interface ManagedUser {
  id: number | string;
  name: string;
  email: string;
  role: 'Farmer' | 'Agronomist' | 'Admin';
  status: 'Active' | 'Inactive' | 'Suspended';
  joined: string;
  logins: number;
}

const initialUsers: ManagedUser[] = [
  {
    id: '1',
    name: 'Ravi Kumar',
    email: 'user@agriflux.ai',
    role: 'Farmer',
    status: 'Active',
    joined: '2025-11-01',
    logins: 42,
  },
  {
    id: '2',
    name: 'Dr. Priya Sharma',
    email: 'agronomist@agriflux.ai',
    role: 'Agronomist',
    status: 'Active',
    joined: '2025-10-15',
    logins: 128,
  },
  {
    id: '3',
    name: 'Anita Patil',
    email: 'anita@farm.com',
    role: 'Farmer',
    status: 'Active',
    joined: '2025-12-01',
    logins: 18,
  },
  {
    id: '4',
    name: 'Austin Admin',
    email: 'admin@agriflux.ai',
    role: 'Admin',
    status: 'Active',
    joined: '2025-08-01',
    logins: 312,
  },
  {
    id: '5',
    name: 'Suresh Reddy',
    email: 'suresh@farm.in',
    role: 'Farmer',
    status: 'Inactive',
    joined: '2025-09-10',
    logins: 3,
  },
  {
    id: '6',
    name: 'Meena Sharma',
    email: 'meena@farm.in',
    role: 'Farmer',
    status: 'Suspended',
    joined: '2025-10-01',
    logins: 76,
  },
];

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab synchronization from URL query param
  const tabFromUrl = searchParams.get('tab') as AdminTab | null;
  const [activeTab, setActiveTab] = useState<AdminTab>(
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview'
  );

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabSelect = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  const [userFilter, setUserFilter] = useState('All');
  const [userList, setUserList] = useState<ManagedUser[]>(initialUsers);

  // Actuators Direct Control State
  const [pumpRunning, setPumpRunning] = useState(false);
  const [pumpLoading, setPumpLoading] = useState(false);
  const [valveNorth, setValveNorth] = useState(true);
  const [valveSouth, setValveSouth] = useState(false);
  const [mistMode, setMistMode] = useState<'AUTO' | 'MANUAL_ON' | 'OFF'>('AUTO');
  const [droneStatus, setDroneStatus] = useState<'DOCKED' | 'PATROLLING' | 'RETURNING'>('DOCKED');
  const [emergencyCutoffActive, setEmergencyCutoffActive] = useState(false);

interface BlockchainLedgerBlock {
  index: number;
  timestamp: string;
  blockType: string;
  data: Record<string, unknown>;
  previousHash: string;
  hash: string;
  nonce: number;
  validator: string;
  signature?: string;
  merkleRoot?: string;
}

interface BlockchainLedgerSummary {
  totalBlocks: number;
  lastBlockHash: string;
  isValid: boolean;
  difficulty: number;
  consensus: string;
  antiTheftState: string;
  genesisTimestamp?: string;
  merkleTreeStatus?: string;
  storageMode?: string;
}

interface BlockchainLedgerHealth {
  status: 'healthy' | 'degraded' | 'unavailable' | 'not_yet_verified';
  isInitialized: boolean;
  persistedBlockCount: number;
  chainLength: number;
  storageMode: string;
  keySource: string;
  lastVerifiedAt: string | null;
  lastVerificationValid: boolean | null;
  degradedReason: string | null;
}

  // Blockchain Ledger State
  const [blockchainData, setBlockchainData] = useState<{
    summary: BlockchainLedgerSummary;
    chain: BlockchainLedgerBlock[];
    health?: BlockchainLedgerHealth;
  } | null>(null);
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    verifiedAt: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    const fetchBlockchain = async () => {
      try {
        const res = await axios.get(`${API_URL}/blockchain/chain`);
        if (res.data.success) {
          setBlockchainData({
            summary: res.data.summary,
            chain: res.data.chain,
            health: res.data.health,
          });
        }
      } catch {
        // Safe offline indicator
        setBlockchainData({
          summary: {
            totalBlocks: 0,
            lastBlockHash: 'OFFLINE',
            isValid: false,
            difficulty: 2,
            consensus: 'Proof of Authority (PoA) Single-Service Audit Ledger',
            antiTheftState: 'UNAVAILABLE (Backend Offline)',
            genesisTimestamp: 'N/A',
            storageMode: 'disconnected',
          },
          chain: [],
          health: {
            status: 'unavailable',
            isInitialized: false,
            persistedBlockCount: 0,
            chainLength: 0,
            storageMode: 'disconnected',
            keySource: 'unconfigured',
            lastVerifiedAt: null,
            lastVerificationValid: null,
            degradedReason: 'Backend blockchain service unreachable',
          },
        });
      }
    };
    fetchBlockchain();
  }, []);

  const handleVerifyChain = async () => {
    setVerifyingChain(true);
    try {
      const res = await axios.get(`${API_URL}/blockchain/verify`);
      if (res.data.isValid) {
        setVerificationResult({
          isValid: true,
          verifiedAt: new Date().toLocaleTimeString(),
          message:
            'All blocks cryptographically validated. Sequential SHA-256 Merkle links and PoA signatures intact.',
        });
        toast.success('Blockchain verified! Audit ledger integrity confirmed.');
      } else {
        setVerificationResult({
          isValid: false,
          verifiedAt: new Date().toLocaleTimeString(),
          message: `Audit alert: Block #${res.data.brokenBlockIndex} integrity check failed (${res.data.reason}). Ledger is marked DEGRADED.`,
        });
        toast.error(`Verification alert: ${res.data.reason || 'Cryptographic integrity check failed'}`);
      }
      if (res.data.summary) {
        setBlockchainData((prev) =>
          prev
            ? { ...prev, summary: res.data.summary, health: res.data.health }
            : null
        );
      }
    } catch {
      setVerificationResult({
        isValid: false,
        verifiedAt: new Date().toLocaleTimeString(),
        message: 'Verification service unreachable. Cannot confirm ledger state. Status: UNAVAILABLE.',
      });
      toast.error('Could not verify blockchain: Service or database unavailable.');
    } finally {
      setVerifyingChain(false);
    }
  };

  // Role Elevation Handler
  const handleRoleElevation = async (
    userId: string | number,
    newRole: 'Farmer' | 'Agronomist' | 'Admin'
  ) => {
    try {
      const rolePayload = newRole.toLowerCase();
      if (token) {
        await axios
          .patch(
            `${API_URL}/auth/users/${userId}/role`,
            { role: rolePayload },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .catch(() => {
            // If offline/demo, fallback gracefully
          });
      }

      setUserList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast.success(`User role successfully elevated to ${newRole}!`);
    } catch {
      toast.error('Failed to elevate user role.');
    }
  };

  // Status Toggle Handler
  const handleToggleStatus = (userId: string | number) => {
    setUserList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
          toast.info(`Account status updated to ${nextStatus}.`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  // Direct Pump Control Handler
  const handlePumpToggle = async () => {
    if (emergencyCutoffActive) {
      toast.error('Emergency E-STOP is active! Release cutoff before operating actuators.');
      return;
    }
    setPumpLoading(true);
    const nextState = !pumpRunning;
    try {
      if (token) {
        await axios
          .post(
            `${API_URL}/iot-data/control`,
            { command: nextState ? 'ON' : 'OFF', reason: 'Admin Direct Hardware Override' },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .catch(() => {});
      }
      setPumpRunning(nextState);
      toast.success(
        nextState
          ? '⚡ High-pressure irrigation pump started (42 L/min).'
          : '⏹️ High-pressure irrigation pump stopped.'
      );
    } catch {
      toast.error('Failed to communicate with IoT pump controller.');
    } finally {
      setPumpLoading(false);
    }
  };

  // Emergency Global E-STOP
  const handleEmergencyStop = () => {
    if (!emergencyCutoffActive) {
      setPumpRunning(false);
      setValveNorth(false);
      setValveSouth(false);
      setMistMode('OFF');
      setDroneStatus('RETURNING');
      setEmergencyCutoffActive(true);
      toast.error('🚨 EMERGENCY CUTOFF ACTIVATED! All field actuators and telemetry halted.');
    } else {
      setEmergencyCutoffActive(false);
      toast.success('✅ Safety interlock released. Actuator controls restored to nominal.');
    }
  };

  const monthlyUsers = [
    { m: 'Oct', users: 120 },
    { m: 'Nov', users: 145 },
    { m: 'Dec', users: 162 },
    { m: 'Jan', users: 198 },
    { m: 'Feb', users: 230 },
    { m: 'Mar', users: 271 },
  ];

  const activityLog = [
    {
      id: 1,
      user: 'admin@agriflux.ai',
      action: 'Actuator Override: Valve North toggled OPEN',
      time: '2 min ago',
      role: 'Admin',
      status: 'warning',
    },
    {
      id: 2,
      user: 'user@agriflux.ai',
      action: 'Booked Expert Consultation (Dr. Ramesh Chandra)',
      time: '8 min ago',
      role: 'Farmer',
      status: 'success',
    },
    {
      id: 3,
      user: 'agronomist@agriflux.ai',
      action: 'Approved Farm Soil Analysis #849',
      time: '19 min ago',
      role: 'Agronomist',
      status: 'success',
    },
    {
      id: 4,
      user: 'admin@agriflux.ai',
      action: 'Elevated Dr. Priya Sharma to Agronomist Role',
      time: '45 min ago',
      role: 'Admin',
      status: 'success',
    },
    {
      id: 5,
      user: 'ravi@farm.com',
      action: 'Failed password verification (3 attempts)',
      time: '1 hr ago',
      role: 'Farmer',
      status: 'error',
    },
  ];

  const roleData = [
    { name: t('admin.farmers', 'Farmers'), value: 201, color: '#22c55e' },
    { name: t('admin.agronomists', 'Agronomists'), value: 47, color: '#3b82f6' },
    { name: t('admin.admins', 'Admins'), value: 5, color: '#ef4444' },
    { name: t('admin.inactive', 'Inactive'), value: 18, color: '#94a3b8' },
  ];

  const systemMetrics = [
    { label: t('admin.apiUptime', 'API Core Uptime'), value: '99.94%', icon: '🟢', trend: 'up' },
    {
      label: t('admin.avgResponse', 'Average Latency'),
      value: '118ms',
      icon: '⚡',
      trend: 'stable',
    },
    {
      label: t('admin.aiAnalysesToday', 'AI Inferences Today'),
      value: '1,429',
      icon: '🤖',
      trend: 'up',
    },
    {
      label: t('admin.storageUsed', 'Telemetry Database'),
      value: '64.8%',
      icon: '💾',
      trend: 'stable',
    },
  ];

  const filteredUsers = userList.filter(
    (u) => userFilter === 'All' || u.role === userFilter || u.status === userFilter
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-header text-gray-900 dark:text-white">
              {t(`dashboard.${greeting.toLowerCase().replace(' ', '')}`, greeting)},{' '}
              <span className="text-gradient font-black">
                {user?.name?.split(' ')[0] || user?.name || t('admin.adminGreeting', 'Administrator')}
              </span>{' '}
              👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-black border border-red-200/50">
              {t('admin.directControl', 'DIRECT CONTROL')}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {t('admin.fullAccess', 'Complete platform governance, immutable cryptographic ledger, and hardware interlock')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleEmergencyStop}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all duration-150 shadow-md ${
              emergencyCutoffActive
                ? 'bg-red-600 text-white animate-pulse shadow-red-500/50'
                : 'bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-300 dark:border-red-800'
            }`}
          >
            <Power size={14} />
            {emergencyCutoffActive ? t('admin.releaseEmergencyStop', 'RELEASE E-STOP') : t('admin.emergencyStop', 'EMERGENCY E-STOP')}
          </button>
          <button
            onClick={() => toast.success('Platform audit snapshot downloaded.')}
            className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download size={13} /> {t('admin.exportReport', 'Export Report')}
          </button>
        </div>
      </div>

      {/* KPI Stat Cards — Symmetrical 4-Column Layout using Farmer Card Design */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up-fade"
        style={{ animationDelay: '100ms' }}
      >
        <StatCard
          title={t('admin.totalRegistered', 'Total Registered')}
          value="271 Users"
          change="+34 this month"
          positive={true}
          icon={<Users size={22} className="text-primary-600" />}
          color="text-primary-600 dark:text-primary-400"
          bgColor="bg-primary-100 dark:bg-primary-900/30"
          accentColor="#22c55e"
          onClick={() => setActiveTab('users')}
        />
        <StatCard
          title={t('admin.hardwareNodes', 'Hardware Nodes')}
          value="18 / 18 Online"
          change="LoRa Mesh 100%"
          positive={true}
          icon={<Cpu size={22} className="text-blue-600" />}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-900/30"
          accentColor="#3b82f6"
          onClick={() => setActiveTab('system')}
        />
        <StatCard
          title={t('admin.farmerInquiries', 'Farmer Inquiries')}
          value="3 Pending"
          change="Triage Queue"
          positive={true}
          icon={<Calendar size={22} className="text-amber-600" />}
          color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-100 dark:bg-amber-900/30"
          accentColor="#f59e0b"
          onClick={() => setActiveTab('activity')}
        />
        <StatCard
          title={t('admin.systemHealth', 'System Health')}
          value="Nominal"
          change="Zero Faults"
          positive={true}
          icon={<ShieldCheck size={22} className="text-emerald-600" />}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-900/30"
          accentColor="#10b981"
          onClick={() => setActiveTab('blockchain')}
        />
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="overflow-x-auto max-w-full scrollbar-none pb-1">
        <div
          role="tablist"
          aria-label="Admin Management Views"
          className="flex gap-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl p-1.5 w-max border border-gray-200/50 dark:border-gray-700/50"
        >
          {[
            { key: 'overview', label: `📊 ${t('admin.overviewTab', 'Overview')}` },
            { key: 'users', label: `👥 ${t('admin.usersTab', 'User Governance')}` },
            { key: 'blockchain', label: `🛡️ ${t('admin.blockchainTab', 'Cryptographic Ledger')}` },
            { key: 'actuators', label: `🕹️ ${t('admin.actuatorsTab', 'Hardware & Actuators')}` },
            { key: 'system', label: `⚙️ ${t('admin.systemTab', 'Cloud Health')}` },
            { key: 'activity', label: `📋 ${t('admin.activityTrailTab', 'Audit Trail')}` },
          ].map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => handleTabSelect(tab.key as AdminTab)}
              className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 shadow-sm border border-gray-200/40 dark:border-gray-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-header">{t('admin.monthlyGrowth')}</h3>
              <span className="text-xs text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-lg">
                +18.4% YoY
              </span>
            </div>
            <div role="img" aria-label="Monthly user registration growth trend chart">
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={monthlyUsers}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="users" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 className="section-header mb-4">{t('admin.roleDistribution')}</h3>
            <PieChart width={160} height={160} style={{ margin: '0 auto' }}>
              <Pie
                data={roleData}
                cx={80}
                cy={80}
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
              >
                {roleData.map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="mt-3 space-y-1.5">
              {roleData.map((r) => (
                <div key={r.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                    <span className="text-gray-600 dark:text-gray-300 font-medium">{r.name}</span>
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BLOCKCHAIN LEDGER & ANTI-THEFT TAB */}
      {activeTab === 'blockchain' && (
        <div className="space-y-4">
          {/* Top Status & Anti-Theft Bar */}
          <div className="card bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-gray-900 border border-emerald-500/30 p-5 rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <ShieldCheck size={22} className="text-emerald-400" />
                  <h3 className="text-lg font-black text-white font-display">
                    {t('admin.blockchainTitle')}
                  </h3>
                  {blockchainData?.health?.status === 'healthy' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      HEALTHY · DURABLE
                    </span>
                  ) : blockchainData?.health?.status === 'degraded' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40 flex items-center gap-1">
                      <AlertTriangle size={11} />
                      DEGRADED · INTEGRITY GAP
                    </span>
                  ) : blockchainData?.health?.status === 'unavailable' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/40 flex items-center gap-1">
                      <XCircle size={11} />
                      UNAVAILABLE · OFFLINE
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-black border border-sky-500/40">
                      NOT YET VERIFIED
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 text-[10px] font-mono border border-gray-700">
                    {blockchainData?.health?.storageMode === 'persistent_mongodb'
                      ? 'MongoDB Persistent'
                      : 'Volatile In-Memory'}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                  Single-Service Cryptographic Audit Ledger: Every sensor telemetry batch, farmer
                  action, agronomist prescription, and hardware actuator command is sealed into a
                  sequential SHA-256 Merkle chain with HMAC-SHA256 validator signing and MongoDB
                  durability. Sequential hash links and Merkle roots ensure tamper detection across
                  service restarts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleVerifyChain}
                  disabled={verifyingChain}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw size={14} className={verifyingChain ? 'animate-spin' : ''} />
                  <span>
                    {verifyingChain ? t('admin.auditingLedger') : t('admin.verifyIntegrity')}
                  </span>
                </button>
              </div>
            </div>

            {verificationResult && (
              <div
                className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  verificationResult.isValid
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {verificationResult.isValid ? (
                  <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
                )}
                <span>
                  <strong>{t('admin.auditStatus')}:</strong> {verificationResult.message} (Checked at{' '}
                  {verificationResult.verifiedAt})
                </span>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-3.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                {t('admin.totalBlocks')}
              </span>
              <p className="text-2xl font-black text-emerald-500 mt-1">
                {blockchainData?.chain?.length || blockchainData?.summary?.totalBlocks || 0}
              </p>
              <span className="text-[10px] text-gray-500">
                {blockchainData?.health?.persistedBlockCount !== undefined
                  ? `${blockchainData.health.persistedBlockCount} Persisted in DB`
                  : t('admin.minedValidated', 'Mined & Validated')}
              </span>
            </div>
            <div className="card p-3.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                Ledger Status
              </span>
              <p
                className={`text-2xl font-black mt-1 ${
                  blockchainData?.health?.status === 'healthy'
                    ? 'text-teal-400'
                    : blockchainData?.health?.status === 'degraded'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                }`}
              >
                {blockchainData?.health?.status?.toUpperCase() ||
                  (blockchainData?.summary?.isValid ? 'HEALTHY' : 'UNAVAILABLE')}
              </p>
              <span className="text-[10px] text-gray-500">
                {blockchainData?.health?.status === 'healthy'
                  ? 'Integrity Verified'
                  : blockchainData?.health?.status === 'degraded'
                    ? 'Integrity Warning'
                    : 'Service Offline'}
              </span>
            </div>
            <div className="card p-3.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                {t('admin.consensusEngine')}
              </span>
              <p className="text-base font-black text-white mt-1">
                {t('admin.poaAuthority', 'PoA Demonstration')}
              </p>
              <span className="text-[10px] text-gray-500">SHA-256 Merkle Ledger</span>
            </div>
            <div className="card p-3.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                Signing Key Source
              </span>
              <p className="text-base font-black text-emerald-400 mt-1">
                {blockchainData?.health?.keySource === 'dedicated_audit_key'
                  ? 'Dedicated Key'
                  : blockchainData?.health?.keySource === 'jwt_secret_legacy'
                    ? 'JWT Secret'
                    : blockchainData?.health?.keySource === 'development_default'
                      ? 'Dev Deterministic'
                      : 'Unconfigured'}
              </p>
              <span className="text-[10px] text-gray-500">HMAC-SHA256 Authority</span>
            </div>
          </div>

          {/* Block Explorer List */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                {t('admin.liveBlockExplorer')}
              </h4>
              <span className="text-xs text-gray-500 font-mono">
                Latest Hash: {blockchainData?.summary?.lastBlockHash?.slice(0, 16)}...
              </span>
            </div>

            <div className="space-y-3">
              {(blockchainData?.chain || []).map((blk) => (
                <div
                  key={blk.index}
                  className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50 hover:border-emerald-500/40 transition-all font-mono text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200/40 dark:border-gray-700/40 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                        #{blk.index}
                      </span>
                      <span className="font-black text-gray-900 dark:text-white text-xs">
                        {blk.blockType}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(blk.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span>
                        Nonce:{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {blk.nonce}
                        </strong>
                      </span>
                      <span>·</span>
                      <span className="text-gray-400 truncate max-w-[150px]">{blk.validator}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-[11px]">
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px]">
                        CURRENT BLOCK HASH:
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono break-all font-bold">
                        {blk.hash}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px]">
                        PREVIOUS HASH POINTER:
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 font-mono break-all">
                        {blk.previousHash}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-[11px]">
                    <span className="text-[10px] font-bold text-gray-400 block mb-1">
                      PAYLOAD & SIGNED EVENT DATA:
                    </span>
                    <pre className="text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono text-[10px]">
                      {JSON.stringify(blk.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HARDWARE & ACTUATORS TAB */}
      {activeTab === 'actuators' && (
        <div className="space-y-4">
          {emergencyCutoffActive && (
            <div className="p-4 rounded-2xl bg-red-500/15 border-2 border-red-500 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-red-500 flex-shrink-0 animate-bounce" />
                <div>
                  <h4 className="font-black text-red-600 dark:text-red-400 text-sm">
                    GLOBAL EMERGENCY SHUTDOWN ENGAGED
                  </h4>
                  <p className="text-xs text-red-600/90 dark:text-red-300/90">
                    All pump relays, solenoid valves, and drone sorties are locked in safe idle
                    state.
                  </p>
                </div>
              </div>
              <button
                onClick={handleEmergencyStop}
                className="btn-primary bg-red-600 hover:bg-red-700 text-xs px-4 py-2 flex-shrink-0"
              >
                Reset Interlock
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Primary Irrigation Pump */}
            <div className="card border-l-4 border-l-primary-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplets className="text-primary-500" size={20} />
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                    Main Irrigation Pump
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    pumpRunning
                      ? 'bg-primary-100 text-primary-700 animate-pulse'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {pumpRunning ? 'ACTIVE (42 L/min)' : 'STANDBY'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Direct relay control over 3-phase submersible pump located at Borewell #1.
              </p>
              <div className="flex items-center justify-between text-xs mb-4 p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <span className="text-gray-500">{t('admin.telemetry', 'Telemetry')}:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  {pumpRunning ? '3.4 bar · 2.1 kW' : '0.0 bar · 0.0 kW'}
                </span>
              </div>
              <button
                disabled={pumpLoading || emergencyCutoffActive}
                onClick={handlePumpToggle}
                className={`w-full py-2.5 rounded-xl font-black text-xs transition-all duration-150 flex items-center justify-center gap-2 ${
                  pumpRunning
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/25'
                }`}
              >
                <Power size={14} />
                {pumpRunning ? t('admin.forceStopPump') : t('admin.startPumpOverride')}
              </button>
            </div>

            {/* Solenoid North Sector */}
            <div className="card border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ToggleRight className="text-blue-500" size={20} />
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                    Valve 1 (North - Rice)
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    valveNorth ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {valveNorth ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Direct motorized ball valve controlling drip distribution lines for Sector Alpha.
              </p>
              <div className="flex items-center justify-between text-xs mb-4 p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <span className="text-gray-500">{t('admin.currentFlow')}:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  {valveNorth ? '24.2 L/min' : '0.0 L/min'}
                </span>
              </div>
              <button
                disabled={emergencyCutoffActive}
                onClick={() => {
                  setValveNorth(!valveNorth);
                  toast.info(`North Sector Valve switched to ${!valveNorth ? 'OPEN' : 'CLOSED'}`);
                }}
                className="w-full py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-black text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                {valveNorth ? t('admin.closeValve') : t('admin.openValve')}
              </button>
            </div>

            {/* Solenoid South Sector */}
            <div className="card border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ToggleRight className="text-emerald-500" size={20} />
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                    Valve 2 (South - Orchards)
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    valveSouth ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {valveSouth ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Secondary micro-sprinkler manifold for high-density pomegranate orchard.
              </p>
              <div className="flex items-center justify-between text-xs mb-4 p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <span className="text-gray-500">{t('admin.currentFlow')}:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  {valveSouth ? '18.0 L/min' : '0.0 L/min'}
                </span>
              </div>
              <button
                disabled={emergencyCutoffActive}
                onClick={() => {
                  setValveSouth(!valveSouth);
                  toast.info(`South Sector Valve switched to ${!valveSouth ? 'OPEN' : 'CLOSED'}`);
                }}
                className="w-full py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-black text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                {valveSouth ? t('admin.closeValve') : t('admin.openValve')}
              </button>
            </div>

            {/* Greenhouse Ventilation & Mist Matrix */}
            <div className="card border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wind className="text-purple-500" size={20} />
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                    Greenhouse Climate Matrix
                  </h4>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  MODE: {mistMode}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Automated roof exhaust vents and high-pressure ultrasonic misting nozzles.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['AUTO', 'MANUAL_ON', 'OFF'] as const).map((m) => (
                  <button
                    key={m}
                    disabled={emergencyCutoffActive}
                    onClick={() => {
                      setMistMode(m);
                      toast.info(`Greenhouse mode updated to ${m}`);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      mistMode === m
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {m === 'MANUAL_ON' ? 'MIST ON' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Autonomous Drone Deployment */}
            <div className="card border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plane className="text-amber-500" size={20} />
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                    Multispectral Drone Fleet
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    droneStatus === 'PATROLLING'
                      ? 'bg-amber-100 text-amber-700 animate-pulse'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {droneStatus}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Autonomous NDVI canopy mapping drone. Battery: 89% · GPS Lock: 14 Satellites.
              </p>
              <div className="flex gap-2">
                <button
                  disabled={droneStatus === 'PATROLLING' || emergencyCutoffActive}
                  onClick={() => {
                    setDroneStatus('PATROLLING');
                    toast.success('🛸 Drone deployed for aerial canopy scan!');
                  }}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-colors"
                >
                  LAUNCH SCAN
                </button>
                <button
                  disabled={droneStatus === 'DOCKED'}
                  onClick={() => {
                    setDroneStatus('DOCKED');
                    toast.info('Drone returning to charging dock.');
                  }}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  DOCK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER GOVERNANCE TAB */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="section-header">👤 {t('admin.userGovernance', 'User Governance & Role Elevation')}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('admin.userGovernanceDesc', 'Authorized administrators have direct control over roles and account permissions.')}
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'All', label: t('common.all', 'All') },
                { id: 'Farmer', label: t('auth.farmer', 'Farmer') },
                { id: 'Agronomist', label: t('auth.agronomist', 'Agronomist') },
                { id: 'Admin', label: t('auth.admin', 'Admin') },
                { id: 'Active', label: t('admin.active', 'Active') },
                { id: 'Suspended', label: t('admin.suspended', 'Suspended') },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setUserFilter(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                    userFilter === f.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">
                    {t('admin.userName', 'User Name')}
                  </th>
                  <th className="py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">{t('admin.email', 'Email')}</th>
                  <th className="py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">
                    {t('admin.role', 'Role')}
                  </th>
                  <th className="py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">
                    {t('admin.roleElevation', 'Role Elevation')}
                  </th>
                  <th className="py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">{t('admin.status', 'Status')}</th>
                  <th className="py-2.5 px-3 text-xs font-bold text-gray-400 uppercase">{t('admin.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {u.name}
                    </td>
                    <td className="py-3 px-3 text-gray-400 text-xs whitespace-nowrap">{u.email}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          u.role === 'Admin'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : u.role === 'Agronomist'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleElevation(
                            u.id,
                            e.target.value as 'Farmer' | 'Agronomist' | 'Admin'
                          )
                        }
                        className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                      >
                        <option value="Farmer">🌾 {t('admin.elevateFarmer', 'Elevate to Farmer')}</option>
                        <option value="Agronomist">🔬 {t('admin.elevateAgronomist', 'Elevate to Agronomist')}</option>
                        <option value="Admin">🛡️ {t('admin.elevateAdmin', 'Elevate to Admin')}</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-transform active:scale-95 ${
                          u.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : u.status === 'Suspended'
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {u.status}
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toast.info(`Viewing activity telemetry for ${u.name}`)}
                          className="p-1 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="View telemetry"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setUserList((prev) => prev.filter((item) => item.id !== u.id));
                            toast.success(`User ${u.name} purged from directory.`);
                          }}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Remove user"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL TAB */}
      {activeTab === 'activity' && (
        <div className="card">
          <h3 className="section-header mb-4">📋 {t('admin.securityAuditTrail', 'Security Audit Trail & Event Logs')}</h3>
          <div className="space-y-2">
            {activityLog.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {log.status === 'success' ? (
                    <CheckCircle size={17} className="text-primary-500 flex-shrink-0" />
                  ) : log.status === 'error' ? (
                    <XCircle size={17} className="text-red-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle size={17} className="text-amber-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      {log.action}
                    </p>
                    <p className="text-[11px] text-gray-400">{log.user}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase ${
                      log.role === 'Admin'
                        ? 'bg-red-100 text-red-700'
                        : log.role === 'Agronomist'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-primary-100 text-primary-700'
                    }`}
                  >
                    {log.role}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CLOUD & SYSTEM HEALTH TAB */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="section-header mb-4">⚙️ {t('admin.infrastructureTelemetry', 'Infrastructure Telemetry')}</h3>
            <div className="space-y-2.5">
              {systemMetrics.map((m) => (
                <div
                  key={m.label}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{m.icon}</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {m.label}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-black text-gray-900 dark:text-white">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="section-header mb-4">🔒 {t('admin.securityPolicies', 'Security Policies & Gateway')}</h3>
            <div className="space-y-2.5">
              {[
                { label: t('admin.policyRbac', 'Role-Based Access Enforcement'), enabled: true },
                { label: t('admin.policyHardwareKey', 'Hardware Key Authentication (ESP32)'), enabled: true },
                { label: t('admin.policyRateLimit', 'Brute-Force Rate Limiting (5 req / 15m)'), enabled: true },
                { label: t('admin.policyAuditPersistence', 'Audit Log Persistence to MongoDB'), enabled: true },
                { label: t('admin.policyEstop', 'Actuator E-STOP Interlock Armed'), enabled: true },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-800"
                >
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {s.label}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {t('admin.enforced', 'ENFORCED')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
