import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication.
 * Redirects to /login if the user is not authenticated.
 * Preserves the location the user was trying to access so they can be redirected back after login.
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('farmer' | 'agronomist' | 'admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-primary-600 animate-pulse uppercase tracking-widest">
            Verifying Session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const target =
      user.role === 'admin' ? '/admin' : user.role === 'agronomist' ? '/agronomist' : '/dashboard';
    const roleLabels: Record<string, string> = {
      farmer: 'Farmer',
      agronomist: 'Agronomist',
      admin: 'Administrator',
    };

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-xl text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 text-2xl">
            🛡️
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white font-display">
            Workspace Restricted
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
            This workspace is reserved for{' '}
            <span className="font-bold text-slate-800 dark:text-dark-100">
              {allowedRoles.map((r) => roleLabels[r] || r).join(' / ')}
            </span>{' '}
            accounts. You are currently logged in as a{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">
              {roleLabels[user.role] || user.role}
            </span>
            .
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to={target}
              className="w-full btn-primary py-3 text-xs uppercase tracking-wider font-bold shadow-md text-center"
            >
              Return to My Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
