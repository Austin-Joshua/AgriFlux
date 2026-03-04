import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Leaf, Mail, Lock, User, Phone, MapPin, Wheat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
    const { t } = useTranslation();
    const { register, isLoading } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        farmName: '', phone: '', location: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setError('');
        try {
            await register(form);
            navigate('/dashboard');
        } catch {
            setError('Registration failed. Please try again.');
        }
    };

    const fields = [
        { name: 'name', label: t('auth.fullName'), icon: User, type: 'text', placeholder: 'Ravi Kumar', required: true },
        { name: 'email', label: t('auth.email'), icon: Mail, type: 'email', placeholder: 'ravi@farm.com', required: true },
        { name: 'farmName', label: t('auth.farmName'), icon: Wheat, type: 'text', placeholder: 'Green Valley Farm', required: false },
        { name: 'phone', label: t('auth.phone'), icon: Phone, type: 'tel', placeholder: '+91 9876543210', required: false },
        { name: 'location', label: t('auth.location'), icon: MapPin, type: 'text', placeholder: 'Karnataka, India', required: false },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center gradient-hero dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="w-full max-w-lg animate-slide-up">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 gradient-green rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-3">
                        <Leaf size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">Join AgriFlux</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Start your AI-powered farming journey</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {fields.map(field => (
                                <div key={field.name} className={field.name === 'email' ? 'sm:col-span-2' : ''}>
                                    <label className="label">{field.label}</label>
                                    <div className="relative">
                                        <field.icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type={field.type}
                                            name={field.name}
                                            value={form[field.name as keyof typeof form]}
                                            onChange={handleChange}
                                            className="input-field pl-10"
                                            placeholder={field.placeholder}
                                            required={field.required}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="label">{t('auth.password')}</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="input-field pl-10 pr-10"
                                    placeholder="••••••••"
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="label">{t('auth.confirmPassword')}</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    className="input-field pl-10"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-base mt-2">
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating account...
                                </span>
                            ) : t('auth.register')}
                        </button>
                    </form>

                    <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        {t('auth.hasAccount')}{' '}
                        <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                            {t('auth.login')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
