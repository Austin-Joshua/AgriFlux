import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
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

                                <button type="submit" className="btn-primary w-full py-3">Send Reset Link</button>
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
