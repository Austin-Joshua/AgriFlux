import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, ShieldCheck, AlertTriangle, Activity, LogOut, Settings, RefreshCw, Eye, Trash2, CheckCircle, XCircle, Download } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity' | 'system'>('overview');
    const [userFilter, setUserFilter] = useState('All');

    const monthlyUsers = [
        { m: 'Oct', users: 120 }, { m: 'Nov', users: 145 }, { m: 'Dec', users: 162 },
        { m: 'Jan', users: 198 }, { m: 'Feb', users: 230 }, { m: 'Mar', users: 271 },
    ];

    const activityLog = [
        { id: 1, user: 'user@agriflux.ai', action: 'Ran Soil Analysis', time: '10 min ago', role: 'Farmer', status: 'success' },
        { id: 2, user: 'agronomist@agriflux.ai', action: 'Sent bulk advisory', time: '23 min ago', role: 'Agronomist', status: 'success' },
        { id: 3, user: 'ravi@farm.com', action: 'Failed login (3 attempts)', time: '41 min ago', role: 'Farmer', status: 'error' },
        { id: 4, user: 'admin@agriflux.ai', action: 'Updated system config', time: '1 hr ago', role: 'Admin', status: 'success' },
        { id: 5, user: 'priya@agro.com', action: 'Generated Yield Report', time: '2 hr ago', role: 'Agronomist', status: 'success' },
        { id: 6, user: 'meena@farm.in', action: 'API rate limit exceeded', time: '3 hr ago', role: 'Farmer', status: 'warning' },
    ];

    const roleData = [
        { name: t('admin.farmers'), value: 201, color: '#22c55e' },
        { name: t('admin.agronomists'), value: 47, color: '#3b82f6' },
        { name: t('admin.admins'), value: 5, color: '#f59e0b' },
        { name: t('admin.inactive'), value: 18, color: '#e5e7eb' },
    ];

    const userList = [
        { id: 1, name: 'Ravi Kumar', email: 'user@agriflux.ai', role: 'Farmer', status: 'Active', joined: '2025-11-01', logins: 42 },
        { id: 2, name: 'Dr. Priya Sharma', email: 'agronomist@agriflux.ai', role: 'Agronomist', status: 'Active', joined: '2025-10-15', logins: 128 },
        { id: 3, name: 'Anita Patil', email: 'anita@farm.com', role: 'Farmer', status: 'Active', joined: '2025-12-01', logins: 18 },
        { id: 4, name: 'Suresh Reddy', email: 'suresh@farm.in', role: 'Farmer', status: 'Inactive', joined: '2025-09-10', logins: 3 },
        { id: 5, name: 'Meena Sharma', email: 'meena@farm.in', role: 'Farmer', status: 'Suspended', joined: '2025-10-01', logins: 76 },
    ];

    const systemMetrics = [
        { label: t('admin.apiUptime'), value: '99.8%', icon: '🟢', trend: 'up' },
        { label: t('admin.avgResponse'), value: '142ms', icon: '⚡', trend: 'stable' },
        { label: t('admin.aiAnalysesToday'), value: '1,247', icon: '🤖', trend: 'up' },
        { label: t('admin.storageUsed'), value: '68.2%', icon: '💾', trend: 'stable' },
    ];

    const filteredUsers = userList.filter(u => userFilter === 'All' || u.role === userFilter || u.status === userFilter);

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="page-header">🛡️ {t('admin.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('admin.loggedInAs')} <strong>{user?.name}</strong> · {t('admin.fullAccess')}</p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold border border-red-200">🛡️ {t('admin.mode')}</span>
                    <button className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 text-xs flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Download size={12} /> {t('admin.exportReport')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: t('admin.totalUsers'), value: '271', sub: t('admin.newThisMonth'), icon: '👥', color: 'text-primary-600' },
                    { label: t('admin.activeSessions'), value: '43', sub: t('admin.rightNow'), icon: '🟢', color: 'text-green-600' },
                    { label: t('admin.securityAlerts'), value: '2', sub: t('admin.needsReview'), icon: '🚨', color: 'text-red-600' },
                    { label: t('admin.aiEngine'), value: 'Online', sub: t('admin.uptime'), icon: '🤖', color: 'text-blue-600' },
                ].map(s => (
                    <div key={s.label} className="card text-center">
                        <div className="text-2xl mb-1">{s.icon}</div>
                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{s.label}</p>
                        <p className="text-[10px] text-gray-300 dark:text-gray-600">{s.sub}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit flex-wrap">
                {(['overview', 'users', 'activity', 'system'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        {tab === 'overview' ? `📊 ${t('common.overview')}` : tab === 'users' ? `👤 ${t('admin.usersTab')}` : tab === 'activity' ? `📋 ${t('admin.activityTab')}` : `⚙️ ${t('common.settings')}`}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 card">
                        <h3 className="section-header mb-4">{t('admin.userGrowthTrend')}</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={monthlyUsers}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="m" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                                <Tooltip /><Bar dataKey="users" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="card">
                        <h3 className="section-header mb-4">{t('admin.userBreakdown')}</h3>
                        <PieChart width={160} height={160} style={{ margin: '0 auto' }}>
                            <Pie data={roleData} cx={80} cy={80} innerRadius={45} outerRadius={70} dataKey="value">
                                {roleData.map((c, i) => <Cell key={i} fill={c.color} />)}
                            </Pie>
                        </PieChart>
                        <div className="mt-3 space-y-1.5">
                            {roleData.map(r => <div key={r.name} className="flex items-center justify-between text-xs"><div className="flex items-center justify-center md:justify-start gap-2"><div className="w-3 h-3 rounded-full" style={{ background: r.color }} /><span className="text-gray-600 dark:text-gray-300">{r.name}</span></div><span className="font-bold text-gray-700 dark:text-gray-200">{r.value}</span></div>)}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-header">👤 {t('admin.userManagement')}</h3>
                        <div className="flex gap-2">
                            {['All', 'Farmer', 'Agronomist', 'Active', 'Suspended'].map(f => (
                                <button key={f} onClick={() => setUserFilter(f)}
                                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${userFilter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b border-gray-100 dark:border-gray-700">{[t('admin.userName'), t('admin.email'), t('admin.role'), t('admin.status'), t('admin.joined'), t('admin.logins'), t('admin.actions')].map(h => <th key={h} className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                        <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">{u.name}</td>
                                        <td className="py-2.5 px-3 text-gray-400 text-xs">{u.email}</td>
                                        <td className="py-2.5 px-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'Admin' ? 'bg-red-100 text-red-700' : u.role === 'Agronomist' ? 'bg-blue-100 text-blue-700' : 'bg-primary-100 text-primary-700'}`}>{u.role}</span></td>
                                        <td className="py-2.5 px-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.status === 'Active' ? 'bg-primary-100 text-primary-700' : u.status === 'Inactive' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'}`}>{u.status}</span></td>
                                        <td className="py-2.5 px-3 text-gray-400 text-xs">{u.joined}</td>
                                        <td className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-200">{u.logins}</td>
                                        <td className="py-2.5 px-3">
                                            <div className="flex items-center gap-1">
                                                <button className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"><Eye size={13} /></button>
                                                <button className="p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition-colors"><Settings size={13} /></button>
                                                <button className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><Trash2 size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'activity' && (
                <div className="card">
                    <h3 className="section-header mb-4">📋 {t('admin.recentActivity')}</h3>
                    <div className="space-y-2">
                        {activityLog.map(log => (
                            <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    {log.status === 'success' ? <CheckCircle size={16} className="text-primary-500 flex-shrink-0" /> : log.status === 'error' ? <XCircle size={16} className="text-red-500 flex-shrink-0" /> : <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{log.action}</p>
                                        <p className="text-xs text-gray-400">{log.user}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.role === 'Admin' ? 'bg-red-100 text-red-700' : log.role === 'Agronomist' ? 'bg-blue-100 text-blue-700' : 'bg-primary-100 text-primary-700'}`}>{log.role}</span>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{log.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card">
                        <h3 className="section-header mb-4">⚙️ {t('admin.systemMetrics')}</h3>
                        <div className="space-y-3">
                            {systemMetrics.map(m => (
                                <div key={m.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                    <div className="flex items-center gap-3"><span className="text-lg">{m.icon}</span><span className="text-sm font-medium text-gray-600 dark:text-gray-300">{m.label}</span></div>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">{m.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card">
                        <h3 className="section-header mb-4">🔒 {t('admin.securitySettings')}</h3>
                        <div className="space-y-3">
                            {[
                                { label: t('admin.2faEnforcement'), enabled: true },
                                { label: t('admin.rateLimiting'), enabled: true },
                                { label: t('admin.ipAllowlist'), enabled: false },
                                { label: t('admin.auditLogging'), enabled: true },
                                { label: t('admin.apiKeyRotation'), enabled: true },
                            ].map(s => (
                                <div key={s.label} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{s.label}</span>
                                    <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${s.enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${s.enabled ? 'right-0.5' : 'left-0.5'}`} />
                                    </div>
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
