import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wheat, MapPin, Sparkles, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../assets/logo.jpg';
import SEO from '../components/SEO';

const Onboarding: React.FC = () => {
    const { user, completeOnboarding, logout, isLoading } = useAuth();
    const navigate = useNavigate();
    const [farmName, setFarmName] = useState('');
    const [location, setLocation] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!farmName || !location) {
            toast.warning('Please provide both farm name and location.');
            return;
        }

        try {
            await completeOnboarding(farmName, location);
            toast.success(`Welcome to the fold, ${user?.name}! Your profile is ready.`);
            navigate('/dashboard');
        } catch (err) {
            toast.error('Failed to save profile. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <SEO title="Complete Your Profile" />
            
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6 p-3 animate-bounce-slow">
                        <img src={logo} alt="AgriFlux" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white font-display leading-tight">
                        Almost there, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>!
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
                        To personalize your AI insights, we just need a few more details about your farm.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 dark:border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <Sparkles size={120} className="text-primary-500" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10 text-left">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 dark:text-gray-500 ml-1">
                                Farm Name
                            </label>
                            <div className="relative group/input">
                                <Wheat size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-primary-500 transition-colors" />
                                <input
                                    type="text"
                                    value={farmName}
                                    onChange={(e) => setFarmName(e.target.value)}
                                    placeholder="e.g. Green Valley Estates"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 dark:text-gray-500 ml-1">
                                Location (District, State)
                            </label>
                            <div className="relative group/input">
                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-primary-500 transition-colors" />
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Ludhiana, Punjab"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-primary-600 to-green-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Complete Setup
                                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                        <LogOut size={14} />
                        Cancel & Logout
                    </button>
                </div>

                <p className="mt-12 text-center text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest">
                    Secured by AgriFlux AI Intelligence
                </p>
            </div>
        </div>
    );
};

export default Onboarding;
