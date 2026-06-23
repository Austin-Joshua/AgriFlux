import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FlaskConical, MapPin, Calendar, CheckCircle, Clock, AlertTriangle, Leaf, Users, BookOpen, ClipboardList, Send, FileText, TrendingUp, XCircle, Loader } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import { toast } from 'react-toastify';

const AgronomistDashboard: React.FC = () => {
    const { t } = useTranslation();
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'soilReports' | 'fieldVisits' | 'advisory'>('overview');
    const [advisoryText, setAdvisoryText] = useState('');
    const [sentAdvisories, setSentAdvisories] = useState<{ to: string; msg: string; time: string }[]>([]);
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loadingConsultations, setLoadingConsultations] = useState(false);

    const fetchConsultations = async () => {
        if (!token) return;
        setLoadingConsultations(true);
        try {
            const res = await axios.get(`${API_URL}/consultations/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setConsultations(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching consultations:', error);
            toast.error('Failed to load consultations.');
        } finally {
            setLoadingConsultations(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
        try {
            const res = await axios.patch(`${API_URL}/consultations/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success(`Consultation ${newStatus} successfully!`);
                fetchConsultations();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update consultation status.');
        }
    };

    useEffect(() => {
        if (token) {
            fetchConsultations();
        }
    }, [token]);

    const visitData = [
        { week: 'W1', visits: 6 }, { week: 'W2', visits: 9 }, { week: 'W3', visits: 7 },
        { week: 'W4', visits: 11 }, { week: 'W5', visits: 8 }, { week: 'W6', visits: 13 },
    ];

    const caseData = [
        { name: t('common.resolved'), value: 68, color: '#22c55e' },
        { name: t('common.active'), value: 24, color: '#3b82f6' },
        { name: t('common.pending'), value: 8, color: '#f59e0b' },
    ];

    const soilReports = [
        { farm: 'Green Valley Farm', farmer: 'Ravi Kumar', pH: 6.2, N: 'Low', P: 'Adequate', K: 'High', salinity: 1.2, status: 'Action Required', date: '2026-03-01' },
        { farm: 'Sunrise Fields', farmer: 'Anita Patil', pH: 7.8, N: 'Adequate', P: 'Low', K: 'Adequate', salinity: 2.8, status: 'Review', date: '2026-02-28' },
        { farm: 'Mango Grove', farmer: 'Suresh Reddy', pH: 6.9, N: 'Adequate', P: 'Adequate', K: 'Low', salinity: 0.9, status: 'Healthy', date: '2026-02-26' },
        { farm: 'Lotus Fields', farmer: 'Meena Sharma', pH: 8.1, N: 'Low', P: 'Low', K: 'Adequate', salinity: 4.2, status: 'Action Required', date: '2026-02-25' },
    ];



    const diseaseAlerts = [
        { crop: 'Tomato', disease: 'Early Blight', farms: 3, severity: 'High', region: 'Karnataka' },
        { crop: 'Wheat', disease: 'Rust Fungus', farms: 7, severity: 'Medium', region: 'Punjab' },
        { crop: 'Cotton', disease: 'Bollworm', farms: 2, severity: 'High', region: 'Telangana' },
        { crop: 'Rice', disease: 'Blast', farms: 5, severity: 'Medium', region: 'West Bengal' },
    ];

    const sendAdvisory = () => {
        if (!advisoryText.trim()) return;
        setSentAdvisories(prev => [{ to: t('agronomist.allFarmers'), msg: advisoryText, time: new Date().toLocaleTimeString() }, ...prev]);
        setAdvisoryText('');
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="page-header">🔬 {t('agronomist.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('common.welcome')}, <strong>{user?.name}</strong> · {user?.expertise}</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-700/50">🔬 {t('agronomist.mode')}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: t('agronomist.farmsMonitored'), value: '42', icon: '🌾', color: 'text-primary-600' },
                    { label: t('agronomist.fieldVisitsMonth'), value: '13', icon: '🚗', color: 'text-blue-600' },
                    { label: t('agronomist.activeCases'), value: '24', icon: '⚠️', color: 'text-amber-600' },
                    { label: t('agronomist.advisoriesSent'), value: '156', icon: '📨', color: 'text-purple-600' },
                ].map(s => (
                    <div key={s.label} className="card text-center">
                        <div className="text-2xl mb-1">{s.icon}</div>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="overflow-x-auto max-w-full scrollbar-none pb-1">
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-max">
                    {(['overview', 'soilReports', 'fieldVisits', 'advisory'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                            {tab === 'overview' ? `📊 ${t('common.overview')}` : tab === 'soilReports' ? `🧪 ${t('agronomist.soilReports')}` : tab === 'fieldVisits' ? `🗺️ ${t('agronomist.fieldVisits')}` : `📡 ${t('agronomist.advisoryTab')}`}
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
                                    <defs><linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis dataKey="week" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip /><Area type="monotone" dataKey="visits" stroke="#3b82f6" fill="url(#visitGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4">
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2"><AlertTriangle size={14} className="text-red-500" /> {t('agronomist.activeAlerts')}</h4>
                            <div className="space-y-2">
                                {diseaseAlerts.map(a => (
                                    <div key={a.disease} className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                                        <div className="flex items-center justify-center md:justify-start gap-2">
                                            <span className="text-lg">{a.crop === 'Tomato' ? '🍅' : a.crop === 'Wheat' ? '🌿' : a.crop === 'Cotton' ? '🌱' : '🌾'}</span>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{a.crop} — {a.disease}</p>
                                                <p className="text-[10px] text-gray-500">{a.farms} {t('agronomist.farms')} · {a.region}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{a.severity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <h3 className="section-header mb-4">{t('agronomist.caseStatus')}</h3>
                        <PieChart width={180} height={180} style={{ margin: '0 auto' }}>
                            <Pie data={caseData} cx={90} cy={90} innerRadius={50} outerRadius={80} dataKey="value">
                                {caseData.map((c, i) => <Cell key={i} fill={c.color} />)}
                            </Pie>
                        </PieChart>
                        <div className="mt-4 space-y-2">
                            {caseData.map(c => <div key={c.name} className="flex items-center justify-between text-sm"><div className="flex items-center justify-center md:justify-start gap-2"><div className="w-3 h-3 rounded-full" style={{ background: c.color }} /><span className="text-gray-600 dark:text-gray-300">{c.name}</span></div><span className="font-bold text-gray-700 dark:text-gray-200">{c.value}</span></div>)}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'soilReports' && (
                <div className="card">
                    <h3 className="section-header mb-4">🧪 {t('agronomist.soilReportTitle')}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b border-gray-100 dark:border-gray-700">{[t('agronomist.farm'), t('agronomist.farmer'), 'pH', t('agronomist.nitrogen'), t('agronomist.phosphorus'), t('agronomist.potassium'), t('agronomist.salinity'), t('agronomist.status'), t('common.date')].map(h => <th key={h} className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
                            <tbody>
                                {soilReports.map(r => (
                                    <tr key={r.farm} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                        <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">{r.farm}</td>
                                        <td className="py-2.5 px-3 text-gray-500">{r.farmer}</td>
                                        <td className="py-2.5 px-3"><span className={`font-bold ${r.pH < 6 ? 'text-red-600' : r.pH > 8 ? 'text-amber-600' : 'text-primary-600'}`}>{r.pH}</span></td>
                                        <td className="py-2.5 px-3"><span className={r.N === 'Low' ? 'text-red-600 font-semibold' : 'text-gray-600 dark:text-gray-300'}>{r.N}</span></td>
                                        <td className="py-2.5 px-3"><span className={r.P === 'Low' ? 'text-red-600 font-semibold' : 'text-gray-600 dark:text-gray-300'}>{r.P}</span></td>
                                        <td className="py-2.5 px-3"><span className={r.K === 'Low' ? 'text-red-600 font-semibold' : 'text-gray-600 dark:text-gray-300'}>{r.K}</span></td>
                                        <td className="py-2.5 px-3 font-semibold">{r.salinity} dS/m</td>
                                        <td className="py-2.5 px-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${r.status === 'Healthy' ? 'bg-primary-100 text-primary-700' : r.status === 'Review' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span></td>
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
                        <h3 className="section-header">📅 Expert Consultations & Bookings</h3>
                        <button onClick={fetchConsultations} className="text-xs text-primary-600 hover:underline">Refresh</button>
                    </div>
                    {loadingConsultations ? (
                        <div className="flex justify-center py-8">
                            <Loader className="animate-spin text-primary-600" />
                        </div>
                    ) : consultations.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">No consultations requested yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {consultations.map(v => {
                                const farmerName = v.userId?.name || 'Demo Farmer';
                                const farmName = v.userId?.farmName || 'Green Valley Farm';
                                const location = v.userId?.location || 'Mysuru, KA';
                                return (
                                    <div key={v._id} className="card flex items-start justify-between gap-4 flex-col md:flex-row hover:shadow-md transition-all border-l-4 border-l-primary-500">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                                                ${v.status === 'confirmed' ? 'bg-primary-100 text-primary-700' : v.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {v.status === 'confirmed' ? '✅' : v.status === 'cancelled' ? '❌' : '⏳'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-bold text-gray-900 dark:text-white">{farmName}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                                                        ${v.status === 'confirmed' ? 'bg-primary-100 text-primary-700' : v.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {v.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                    Farmer: <strong>{farmerName}</strong> · Location: <strong>{location}</strong>
                                                </p>
                                                <p className="text-xs text-primary-700 dark:text-primary-400 mt-1">
                                                    Requested Expert: <strong>{v.expertName}</strong> ({v.specialization})
                                                </p>
                                                <div className="mt-2 p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-xs text-gray-600 dark:text-gray-300 font-medium italic border border-gray-100 dark:border-gray-800">
                                                    " {v.query} "
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto gap-3 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-800">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12} />{v.date}</p>
                                                <p className="text-[11px] text-gray-500 font-bold mt-0.5">Time: {v.time}</p>
                                            </div>
                                            {v.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(v._id, 'confirmed')}
                                                        className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(v._id, 'cancelled')}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                                                    >
                                                        Reject
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
                        <h3 className="section-header mb-4 flex items-center gap-2"><Send size={15} /> {t('agronomist.sendAdvisory')}</h3>
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
                                <textarea className="input-field min-h-[120px] resize-none" placeholder={t('agronomist.advisoryPlaceholder')} value={advisoryText} onChange={e => setAdvisoryText(e.target.value)} />
                            </div>
                            <button onClick={sendAdvisory} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                                <Send size={14} /> {t('agronomist.sendButton')}
                            </button>
                        </div>
                    </div>
                    <div className="card">
                        <h3 className="section-header mb-4">📨 {t('agronomist.sentAdvisories')}</h3>
                        {sentAdvisories.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{t('agronomist.noAdvisories')}</p>}
                        <div className="space-y-3">
                            {sentAdvisories.map((a, i) => (
                                <div key={i} className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-bold text-primary-600 dark:text-primary-400">{t('common.to')}: {a.to}</p>
                                        <p className="text-[10px] text-gray-400">{a.time}</p>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{a.msg}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgronomistDashboard;
