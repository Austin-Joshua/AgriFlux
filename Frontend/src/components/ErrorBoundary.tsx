import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // In production, send to error reporting service (e.g. Sentry)
        if (import.meta.env.DEV) {
            console.error('[AgriFlux ErrorBoundary]', error, info);
        }
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center border border-red-100 dark:border-red-800">
                        <AlertTriangle size={36} className="text-red-500" />
                    </div>

                    {/* Heading */}
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white font-display">
                            Something went wrong
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
                            AgriFlux encountered an unexpected error. Your farm data is safe — please refresh the page or return home.
                        </p>
                    </div>

                    {/* Error detail (dev only) */}
                    {import.meta.env.DEV && this.state.error && (
                        <div className="text-left bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                                {this.state.error.message}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => this.setState({ hasError: false, error: undefined })}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>
                        <button
                            onClick={() => { window.location.href = '/dashboard'; }}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600 rounded-xl font-semibold transition-all"
                        >
                            <Home size={16} />
                            Go to Dashboard
                        </button>
                    </div>

                    {/* Brand */}
                    <p className="text-xs text-gray-400 dark:text-gray-600">
                        AgriFlux AI · Smart Agricultural Intelligence Platform
                    </p>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
