import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart,
  Area,
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
  Calendar,
  AlertTriangle,
  Send,
  Loader,
  ShieldCheck,
  CheckCircle2,
  RotateCw,
  UserCheck,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Sprout,
  Leaf,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import { toast } from 'react-toastify';

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
  const { t } = useTranslation();

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
            {t('common.viewDetails', 'View details')}{' '}
            <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color} font-display`}>{value}</p>
    </div>
  );
};

interface FieldReviewItem {
  _id?: string;
  recommendationId: string;
  fieldId: string;
  fieldName: string;
  cropType: string;
  cropStage: string;
  action: string;
  actionLabel: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  explanation: string;
  ruleVersion?: string;
  decisionRules?: string[];
  supportingObservations?: {
    soilMoisture?: { value: number; unit: string; provenance?: string };
    soilPh?: { value: number; unit: string };
    ambientTemp?: { value: number; unit: string };
    forecastRainMm?: { value: number; unit: string };
  };
  farmerAction?: {
    actionTaken: string;
    notes?: string;
    recordedAt?: string;
    actorName?: string;
  };
  agronomistReview?: {
    status: 'endorsed' | 'revision_requested' | 'inspection_required';
    notes: string;
    reviewerName: string;
    reviewedAt: string;
  };
  createdAt: string;
}

interface Consultation {
  _id: string;
  userId?:
    | {
        name?: string;
        email?: string;
        farmName?: string;
        location?: string;
      }
    | string;
  expertId: string;
  expertName: string;
  specialization: string;
  date: string;
  time: string;
  query: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

const AgronomistDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const initialTab =
    tabParam === 'consultations' || tabParam === 'fieldVisits'
      ? 'fieldVisits'
      : tabParam === 'fieldDecisions'
        ? 'fieldDecisions'
        : tabParam === 'soilReports'
          ? 'soilReports'
          : tabParam === 'advisory'
            ? 'advisory'
            : 'overview';

  const [activeTab, setActiveTab] = useState<
    'overview' | 'soilReports' | 'fieldVisits' | 'fieldDecisions' | 'advisory'
  >(initialTab);

  useEffect(() => {
    if (tabParam === 'consultations' || tabParam === 'fieldVisits') {
      setActiveTab('fieldVisits');
    } else if (tabParam === 'fieldDecisions') {
      setActiveTab('fieldDecisions');
    } else if (tabParam === 'soilReports') {
      setActiveTab('soilReports');
    } else if (tabParam === 'advisory') {
      setActiveTab('advisory');
    } else if (tabParam === 'overview') {
      setActiveTab('overview');
    }
  }, [tabParam]);

  const handleTabSelect = (
    tab: 'overview' | 'soilReports' | 'fieldVisits' | 'fieldDecisions' | 'advisory'
  ) => {
    setActiveTab(tab);
    setSearchParams(
      tab === 'overview'
        ? {}
        : tab === 'fieldVisits'
          ? { tab: 'consultations' }
          : tab === 'fieldDecisions'
            ? { tab: 'fieldDecisions' }
            : { tab }
    );
  };
  const [advisoryText, setAdvisoryText] = useState('');
  const [sentAdvisories, setSentAdvisories] = useState<{ to: string; msg: string; time: string }[]>(
    []
  );
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);

  // Field Decision Reviews State
  const [reviews, setReviews] = useState<FieldReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const res = await axios.get(`${API_URL}/field-intelligence/reviews`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setReviews(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch agronomist reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'fieldDecisions') {
      fetchReviews();
    }
  }, [activeTab, fetchReviews]);

  const handleReviewDecision = async (
    recommendationId: string,
    status: 'endorsed' | 'revision_requested' | 'inspection_required'
  ) => {
    setSubmittingReview(recommendationId);
    try {
      const notes = reviewNotes[recommendationId] || `Agronomist status: ${status}`;
      const res = await axios.post(
        `${API_URL}/field-intelligence/review`,
        { recommendationId, status, notes },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.success) {
        toast.success(`Decision successfully marked as '${status}'!`);
        fetchReviews();
      }
    } catch {
      toast.error('Failed to submit review.');
    } finally {
      setSubmittingReview(null);
    }
  };

  const fetchConsultations = useCallback(async () => {
    setLoadingConsultations(true);
    let apiData: Consultation[] = [];
    if (token) {
      try {
        const res = await axios.get(`${API_URL}/consultations/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success && Array.isArray(res.data.data)) {
          apiData = res.data.data;
        }
      } catch (error) {
        console.warn('API consultations fetch fallback to local store:', error);
      }
    }
    const local = JSON.parse(localStorage.getItem('agriflux_local_consultations') || '[]');
    const defaultMocks: Consultation[] = [
      {
        _id: 'mock-consultation-1',
        userId: {
          name: 'Demo Farmer (Ravi Kumar)',
          farmName: 'Green Valley Farm',
          location: 'Mysuru, KA',
        },
        expertId: 'exp1',
        expertName: 'Dr. Ramesh Chandra',
        specialization: 'Soil Science',
        date: '2026-06-25',
        time: '10:30',
        query: 'Requesting soil analysis advisory for my upcoming maize crop cultivation.',
        status: 'pending',
      },
      {
        _id: 'mock-consultation-2',
        userId: {
          name: 'Anita Patil',
          farmName: 'Sunrise Fields',
          location: 'Belagavi, KA',
        },
        expertId: 'exp2',
        expertName: 'Dr. Priya Sharma',
        specialization: 'Crop Pathology',
        date: '2026-06-28',
        time: '14:00',
        query:
          'Noticed yellow rust spots on wheat leaves in field B. Need fungicide recommendation.',
        status: 'confirmed',
      },
    ];

    const merged = [...local, ...apiData, ...defaultMocks];
    const unique = Array.from(new Map(merged.map((item) => [item._id, item])).values());
    setConsultations(unique);
    setLoadingConsultations(false);
  }, [token]);

  const handleUpdateStatus = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      if (token && !id.startsWith('mock-') && !id.startsWith('local-')) {
        await axios
          .patch(
            `${API_URL}/consultations/${id}/status`,
            { status: newStatus },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          .catch(() => {});
      }
      // Update local storage if present
      const local = JSON.parse(localStorage.getItem('agriflux_local_consultations') || '[]');
      const updatedLocal = local.map((c: Consultation) =>
        c._id === id ? { ...c, status: newStatus } : c
      );
      localStorage.setItem('agriflux_local_consultations', JSON.stringify(updatedLocal));

      // Update state
      setConsultations((prev) => prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c)));
      toast.success(`Consultation successfully ${newStatus}!`);
    } catch {
      toast.error('Failed to update consultation status.');
    }
  };

  useEffect(() => {
    if (token) {
      fetchConsultations();
    }
  }, [token, fetchConsultations]);

  const visitData = [
    { week: 'W1', visits: 6 },
    { week: 'W2', visits: 9 },
    { week: 'W3', visits: 7 },
    { week: 'W4', visits: 11 },
    { week: 'W5', visits: 8 },
    { week: 'W6', visits: 13 },
  ];

  const caseData = [
    { name: t('common.resolved'), value: 68, color: '#22c55e' },
    { name: t('common.active'), value: 24, color: '#3b82f6' },
    { name: t('common.pending'), value: 8, color: '#f59e0b' },
  ];

  const soilReports = [
    {
      farm: 'Green Valley Farm',
      farmer: 'Ravi Kumar',
      pH: 6.2,
      N: 'Low',
      P: 'Adequate',
      K: 'High',
      salinity: 1.2,
      status: 'Action Required',
      date: '2026-03-01',
    },
    {
      farm: 'Sunrise Fields',
      farmer: 'Anita Patil',
      pH: 7.8,
      N: 'Adequate',
      P: 'Low',
      K: 'Adequate',
      salinity: 2.8,
      status: 'Review',
      date: '2026-02-28',
    },
    {
      farm: 'Mango Grove',
      farmer: 'Suresh Reddy',
      pH: 6.9,
      N: 'Adequate',
      P: 'Adequate',
      K: 'Low',
      salinity: 0.9,
      status: 'Healthy',
      date: '2026-02-26',
    },
    {
      farm: 'Lotus Fields',
      farmer: 'Meena Sharma',
      pH: 8.1,
      N: 'Low',
      P: 'Low',
      K: 'Adequate',
      salinity: 4.2,
      status: 'Action Required',
      date: '2026-02-25',
    },
  ];

  const diseaseAlerts = [
    { crop: 'Tomato', disease: 'Early Blight', farms: 3, severity: 'High', region: 'Karnataka' },
    { crop: 'Wheat', disease: 'Rust Fungus', farms: 7, severity: 'Medium', region: 'Punjab' },
    { crop: 'Cotton', disease: 'Bollworm', farms: 2, severity: 'High', region: 'Telangana' },
    { crop: 'Rice', disease: 'Blast', farms: 5, severity: 'Medium', region: 'West Bengal' },
  ];

  const sendAdvisory = () => {
    if (!advisoryText.trim()) return;
    setSentAdvisories((prev) => [
      { to: t('agronomist.allFarmers'), msg: advisoryText, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
    toast.success('Advisory broadcasted to monitored farmers!');
    setAdvisoryText('');
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-5">
      {/* Welcome Header — Clean & Symmetrical (Farmer Base Reference) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-header">
            {t(`dashboard.${greeting.toLowerCase().replace(' ', '')}`, greeting)},{' '}
            <span className="text-gradient font-black">
              {user?.name?.split(' ')[0] || user?.name || t('agronomist.specialist', 'Specialist')}
            </span>{' '}
            👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
            {t('agronomist.cropDiagnosticsSubtitle', 'Crop diagnostics, consultation triage, and field decision reviews')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold border border-primary-200 dark:border-primary-700/50">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            {t('agronomist.activeDuty', 'Active Duty')} · {user?.expertise || 'Field Agronomy'}
          </span>
        </div>
      </div>

      {/* Stat Cards Grid — Symmetrical 4-Column Layout using Farmer Card Design */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up-fade"
        style={{ animationDelay: '100ms' }}
      >
        <StatCard
          title={t('agronomist.farmsMonitored', 'Farms Monitored')}
          value={`42 ${t('agronomist.parcels', 'Parcels')}`}
          change={t('agronomist.thisMonth', '+4 this month')}
          positive={true}
          icon={<Sprout size={22} className="text-primary-600" />}
          color="text-primary-600 dark:text-primary-400"
          bgColor="bg-primary-100 dark:bg-primary-900/30"
          accentColor="#22c55e"
          onClick={() => handleTabSelect('overview')}
        />
        <StatCard
          title={t('nav.consultationsQueue', 'Farmer Consultations')}
          value={`${consultations.filter((c) => c.status === 'pending').length || 0} ${t('common.pending', 'Pending')}`}
          change={t('agronomist.triageActive', 'Triage Active')}
          positive={true}
          icon={<Calendar size={22} className="text-blue-600" />}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-900/30"
          accentColor="#3b82f6"
          onClick={() => handleTabSelect('fieldVisits')}
        />
        <StatCard
          title={t('nav.fieldDecisions', 'Decision Reviews')}
          value={`${reviews.filter((r) => !r.agronomistReview).length || 0} ${t('agronomist.awaiting', 'Awaiting')}`}
          change="FAO-56 Gates"
          positive={true}
          icon={<Target size={22} className="text-purple-600" />}
          color="text-purple-600 dark:text-purple-400"
          bgColor="bg-purple-100 dark:bg-purple-900/30"
          accentColor="#8b5cf6"
          onClick={() => handleTabSelect('fieldDecisions')}
        />
        <StatCard
          title={t('agronomist.soilReports', 'Soil Diagnostics')}
          value={`88/100 ${t('dashboard.optimal', 'Optimal')}`}
          change={t('agronomist.labCalibrated', 'Lab Calibrated')}
          positive={true}
          icon={<Leaf size={22} className="text-earth-600" />}
          color="text-earth-600 dark:text-earth-400"
          bgColor="bg-earth-100 dark:bg-earth-900/30"
          accentColor="#b8823d"
          onClick={() => handleTabSelect('soilReports')}
        />
      </div>

      <div className="overflow-x-auto max-w-full scrollbar-none pb-1">
        <div
          role="tablist"
          aria-label="Management Views"
          className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1.5 w-max border border-gray-200/50 dark:border-gray-700/50"
        >
          {(
            ['overview', 'fieldVisits', 'fieldDecisions', 'soilReports', 'advisory'] as const
          ).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => handleTabSelect(tab)}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-300'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'overview'
                ? `📊 ${t('common.overview', 'Overview')}`
                : tab === 'fieldVisits'
                  ? `📅 ${t('agronomist.consultationsTab', 'Consultations')} (${consultations.filter((c) => c.status === 'pending').length || 0})`
                  : tab === 'fieldDecisions'
                    ? `🎯 ${t('agronomist.decisionReviewsTab', 'Decision Reviews')} (${reviews.filter((r) => !r.agronomistReview).length || 0})`
                    : tab === 'soilReports'
                      ? `🧪 ${t('agronomist.soilDiagnosticsTab', 'Soil Diagnostics')}`
                      : `📡 ${t('agronomist.regionalAdvisoryTab', 'Regional Advisory')}`}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card">
            <h3 className="section-header mb-4">{t('agronomist.fieldVisitsTrend')}</h3>
            <div role="img" aria-label="Weekly field visits trend chart">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={visitData}>
                  <defs>
                    <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#3b82f6"
                    fill="url(#visitGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" /> {t('agronomist.activeAlerts')}
              </h4>
              <div className="space-y-2">
                {diseaseAlerts.map((a) => (
                  <div
                    key={a.disease}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30"
                  >
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <span className="text-lg">
                        {a.crop === 'Tomato'
                          ? '🍅'
                          : a.crop === 'Wheat'
                            ? '🌿'
                            : a.crop === 'Cotton'
                              ? '🌱'
                              : '🌾'}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {a.crop} — {a.disease}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {a.farms} {t('agronomist.farms')} · {a.region}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                    >
                      {a.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="section-header mb-4">{t('agronomist.caseStatus')}</h3>
            <PieChart width={180} height={180} style={{ margin: '0 auto' }}>
              <Pie
                data={caseData}
                cx={90}
                cy={90}
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
              >
                {caseData.map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="mt-4 space-y-2">
              {caseData.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                    <span className="text-gray-600 dark:text-gray-300">{c.name}</span>
                  </div>
                  <span className="font-bold text-gray-700 dark:text-gray-200">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'soilReports' && (
        <div className="card">
          <h3 className="section-header mb-4">🧪 {t('agronomist.soilReportTitle')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {[
                    t('agronomist.farm'),
                    t('agronomist.farmer'),
                    'pH',
                    t('agronomist.nitrogen'),
                    t('agronomist.phosphorus'),
                    t('agronomist.potassium'),
                    t('agronomist.salinity'),
                    t('agronomist.status'),
                    t('common.date'),
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {soilReports.map((r) => (
                  <tr
                    key={r.farm}
                    className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
                      {r.farm}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">{r.farmer}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold ${r.pH < 6 ? 'text-red-600' : r.pH > 8 ? 'text-amber-600' : 'text-primary-600'}`}
                      >
                        {r.pH}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={
                          r.N === 'Low'
                            ? 'text-red-600 font-semibold'
                            : 'text-gray-600 dark:text-gray-300'
                        }
                      >
                        {r.N}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={
                          r.P === 'Low'
                            ? 'text-red-600 font-semibold'
                            : 'text-gray-600 dark:text-gray-300'
                        }
                      >
                        {r.P}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={
                          r.K === 'Low'
                            ? 'text-red-600 font-semibold'
                            : 'text-gray-600 dark:text-gray-300'
                        }
                      >
                        {r.K}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{r.salinity} dS/m</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${r.status === 'Healthy' ? 'bg-primary-100 text-primary-700' : r.status === 'Review' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 text-xs">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'fieldVisits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-header">📅 {t('agronomist.consultationsBookings', 'Expert Consultations & Bookings')}</h3>
            <button
              onClick={fetchConsultations}
              className="text-xs text-primary-600 hover:underline"
            >
              {t('common.refresh', 'Refresh')}
            </button>
          </div>
          {loadingConsultations ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin text-primary-600" />
            </div>
          ) : consultations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {t('agronomist.noConsultationsYet', 'No consultations requested yet.')}
            </p>
          ) : (
            <div className="space-y-3">
              {consultations.map((v) => {
                const isUserObj = typeof v.userId === 'object' && v.userId !== null;
                const userProps = isUserObj
                  ? (v.userId as { name?: string; farmName?: string; location?: string })
                  : null;
                const farmerName = userProps?.name || 'Demo Farmer';
                const farmName = userProps?.farmName || 'Green Valley Farm';
                const location = userProps?.location || 'Mysuru, KA';
                return (
                  <div
                    key={v._id}
                    className="card flex items-start justify-between gap-4 flex-col md:flex-row hover:shadow-md transition-all border-l-4 border-l-primary-500"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                                                ${v.status === 'confirmed' ? 'bg-primary-100 text-primary-700' : v.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {v.status === 'confirmed' ? '✅' : v.status === 'cancelled' ? '❌' : '⏳'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 dark:text-white">{farmName}</p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                                                        ${v.status === 'confirmed' ? 'bg-primary-100 text-primary-700' : v.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                          >
                            {v.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {t('agronomist.farmerLabel', 'Farmer')}: <strong>{farmerName}</strong> · {t('common.location', 'Location')}:{' '}
                          <strong>{location}</strong>
                        </p>
                        <p className="text-xs text-primary-700 dark:text-primary-400 mt-1">
                          {t('agronomist.requestedExpert', 'Requested Expert')}: <strong>{v.expertName}</strong> ({v.specialization})
                        </p>
                        <div className="mt-2 p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-xs text-gray-600 dark:text-gray-300 font-medium italic border border-gray-100 dark:border-gray-800">
                          " {v.query} "
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto gap-3 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-800">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {v.date}
                        </p>
                        <p className="text-[11px] text-gray-500 font-bold mt-0.5">{t('agronomist.time', 'Time')}: {v.time}</p>
                      </div>
                      {v.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(v._id, 'confirmed')}
                            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                          >
                            {t('common.approve', 'Approve')}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(v._id, 'cancelled')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                          >
                            {t('common.reject', 'Reject')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'advisory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="section-header mb-4 flex items-center gap-2">
              <Send size={15} /> {t('agronomist.sendAdvisory')}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="label">{t('agronomist.targetAudience')}</label>
                <select className="input-field">
                  <option>{t('agronomist.allFarmers')} (42)</option>
                  <option>{t('agronomist.regionalFarmers')}</option>
                  <option>{t('agronomist.cropFarmers')}</option>
                  <option>{t('agronomist.highRiskFarms')}</option>
                </select>
              </div>
              <div>
                <label className="label">{t('agronomist.advisoryMessage')}</label>
                <textarea
                  className="input-field min-h-[120px] resize-none"
                  placeholder={t('agronomist.advisoryPlaceholder')}
                  value={advisoryText}
                  onChange={(e) => setAdvisoryText(e.target.value)}
                />
              </div>
              <button
                onClick={sendAdvisory}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <Send size={14} /> {t('agronomist.sendButton')}
              </button>
            </div>
          </div>
          <div className="card">
            <h3 className="section-header mb-4">📨 {t('agronomist.sentAdvisories')}</h3>
            {sentAdvisories.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                {t('agronomist.noAdvisories')}
              </p>
            )}
            <div className="space-y-3">
              {sentAdvisories.map((a, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400">
                      {t('common.to')}: {a.to}
                    </p>
                    <p className="text-[10px] text-gray-400">{a.time}</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{a.msg}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fieldDecisions' && (
        <div className="space-y-4">
          <div className="card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white font-display flex items-center gap-2">
                <Target size={20} className="text-emerald-500" /> Agronomic Decision Reviews
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Phase 7 specialist workflow: evaluate deterministic FAO-56 decision rules, review
                farmer actions, endorse recommendations or mandate field inspection.
              </p>
            </div>
            <button
              onClick={fetchReviews}
              disabled={loadingReviews}
              className="btn-outline flex items-center gap-1.5 text-xs py-2 px-3 self-end sm:self-auto"
            >
              <RotateCw size={14} className={loadingReviews ? 'animate-spin' : ''} /> {t('agronomist.refreshQueue', 'Refresh Queue')}
            </button>
          </div>

          {loadingReviews ? (
            <div className="card text-center py-12">
              <Loader size={24} className="animate-spin text-primary-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">{t('agronomist.loadingReviews', 'Loading pending field reviews...')}</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="card text-center py-12">
              <ShieldCheck size={32} className="text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {t('agronomist.noPendingReviews', 'No Pending Field Decision Reviews')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t('agronomist.noPendingReviewsDesc', 'All farmer recommendations are endorsed or operating within normal agronomic thresholds.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reviews.map((rec) => {
                const isUnderReview = submittingReview === rec.recommendationId;
                const noteValue = reviewNotes[rec.recommendationId] || '';

                return (
                  <div
                    key={rec.recommendationId}
                    className="card p-4 sm:p-5 border border-gray-200/80 dark:border-gray-700/60 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-gray-900 dark:text-white">
                          {rec.fieldName} · {rec.cropType} ({rec.cropStage})
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          {rec.ruleVersion || 'v2.1-QUANTEX-FAO56'}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            rec.urgency === 'critical' || rec.urgency === 'high'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {rec.urgency} priority
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(rec.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                        {rec.actionLabel || rec.action}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                        {rec.explanation}
                      </p>
                      {rec.decisionRules && rec.decisionRules.length > 0 && (
                        <p className="text-[11px] font-semibold text-gray-500 mt-1 flex items-center gap-1">
                          <Zap size={12} className="text-amber-500" />
                          Rule trigger: {rec.decisionRules[0]}
                        </p>
                      )}
                    </div>

                    {rec.farmerAction && (
                      <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40 text-xs">
                        <span className="font-bold text-blue-900 dark:text-blue-300">
                          Farmer Response:{' '}
                        </span>
                        <span className="font-extrabold uppercase text-blue-700 dark:text-blue-400">
                          {rec.farmerAction.actionTaken}
                        </span>
                        {rec.farmerAction.notes && (
                          <span className="text-gray-600 dark:text-gray-400 ml-2">
                            ({rec.farmerAction.notes})
                          </span>
                        )}
                      </div>
                    )}

                    {rec.agronomistReview ? (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                        <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck size={14} /> Endorsed by{' '}
                            {rec.agronomistReview.reviewerName}
                          </span>
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                            {rec.agronomistReview.status}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          {rec.agronomistReview.notes}
                        </p>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                        <input
                          type="text"
                          value={noteValue}
                          onChange={(e) =>
                            setReviewNotes((prev) => ({
                              ...prev,
                              [rec.recommendationId]: e.target.value,
                            }))
                          }
                          placeholder={t('agronomist.diagnosticNotesPlaceholder', 'Diagnostic directive or field validation notes...')}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleReviewDecision(rec.recommendationId, 'endorsed')}
                            disabled={isUnderReview}
                            className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={13} /> {t('agronomist.endorseDecision', 'Endorse Decision')}
                          </button>
                          <button
                            onClick={() =>
                              handleReviewDecision(rec.recommendationId, 'revision_requested')
                            }
                            disabled={isUnderReview}
                            className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
                          >
                            <AlertTriangle size={13} /> {t('agronomist.requestRevision', 'Request Revision')}
                          </button>
                          <button
                            onClick={() =>
                              handleReviewDecision(rec.recommendationId, 'inspection_required')
                            }
                            disabled={isUnderReview}
                            className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <UserCheck size={13} /> {t('agronomist.inspectionRequired', 'Field Inspection Required')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgronomistDashboard;
