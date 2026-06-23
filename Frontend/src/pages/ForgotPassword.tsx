import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/auth/forgot-password`, { email });
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center gradient-hero dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="w-full max-w-md animate-slide-up">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 gradient-green rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-3">
                        <Leaf size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">AgriFlux</h1>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                    {sent ? (
                        <div className="text-center">
                            <CheckCircle size={48} className="text-primary-500 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                We sent a password reset link to <strong>{email}</strong>
                            </p>
                            <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                                <ArrowLeft size={16} /> Back to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-display mb-1">Forgot Password?</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Enter your email to receive a reset link</p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="label">Email Address</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="input-field pl-10"
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                                </button>
                            </form>

                            <div className="mt-4 text-center">
                                <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center justify-center gap-1">
                                    <ArrowLeft size={14} /> Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
