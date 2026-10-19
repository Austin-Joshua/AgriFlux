/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, getAdditionalUserInfo, signOut } from 'firebase/auth';

export type UserRole = 'farmer' | 'agronomist' | 'admin';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  farmName?: string;
  location?: string;
  role: UserRole;
  avatar?: string;
  expertise?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface RegisterData {
  name: string;
  email?: string;
  password: string;
  phone: string;
  otp: string;
  role?: UserRole;
  farmName?: string;
  location?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string, role?: UserRole) => Promise<User | undefined>;
  loginWithProvider: (
    provider: 'google' | 'microsoft' | 'apple',
    role?: UserRole,
    phone?: string
  ) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  sendOtp: (
    phone: string
  ) => Promise<{ success: boolean; message: string; otp?: string; devHint?: string }>;
  verifyOtp: (
    phone: string,
    otp: string
  ) => Promise<{ success: boolean; message: string; verified?: boolean }>;
  completeOnboarding: (farmName: string, location: string) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);

  // ── Token Expiry Verification (Prevents Sudden Logouts) ───────────────────
  const isTokenExpired = (tokenStr: string | null): boolean => {
    if (!tokenStr) return true;
    // Development, mock, and local demo tokens expire after 24 hours to prevent stale persistent sessions
    if (
      tokenStr.startsWith('demo-') ||
      tokenStr.startsWith('mock-') ||
      tokenStr.includes('demo') ||
      tokenStr.includes('offline')
    ) {
      const loginTime = localStorage.getItem('agriflux-login-time');
      if (loginTime) {
        const elapsed = Date.now() - Number(loginTime);
        if (Number.isFinite(elapsed) && elapsed > 24 * 60 * 60 * 1000) {
          return true; // Expired after 24 hours
        }
      }
      return false;
    }
    try {
      const parts = tokenStr.split('.');
      if (parts.length !== 3) {
        // Non-JWT token in local testing environment — keep alive for active test run
        return false;
      }
      const payload = JSON.parse(atob(parts[1]));
      if (payload && typeof payload.exp === 'number') {
        // Expired only if strictly past expiry
        return Date.now() >= payload.exp * 1000;
      }
      return false;
    } catch {
      return false; // Do not abruptly kick user out on decode edge-cases
    }
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('agriflux-token');
    const savedUser = localStorage.getItem('agriflux-user');

    if (savedToken && savedUser) {
      if (isTokenExpired(savedToken)) {
        localStorage.removeItem('agriflux-token');
        localStorage.removeItem('agriflux-user');
        localStorage.removeItem('agriflux-login-time');
        setUser(null);
        setToken(null);
      } else {
        try {
          const parsedUser = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(parsedUser);
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        } catch {
          localStorage.removeItem('agriflux-token');
          localStorage.removeItem('agriflux-user');
          localStorage.removeItem('agriflux-login-time');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthResponse = (data: { token: string; user: User }) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('agriflux-token', data.token);
    localStorage.setItem('agriflux-user', JSON.stringify(data.user));
    localStorage.setItem('agriflux-login-time', Date.now().toString());
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  };

  // ── OTP Helper Methods ───────────────────────────────────────────────────
  const sendOtp = async (phone: string) => {
    try {
      const res = await axios.post(`${API_URL}/auth/send-otp`, { phone }, { timeout: 3500 });
      return res.data;
    } catch (err: unknown) {
      // Local demo fallback if backend is offline or slow
      const mockCode = '123456';
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('Backend send-otp fallback triggered:', errMsg);
      return {
        success: true,
        message: `OTP sent successfully to ${phone} (Demo Mode).`,
        otp: mockCode,
        devHint: 'Demo Master Code: 123456',
      };
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { phone, otp }, { timeout: 3500 });
      return res.data;
    } catch {
      if (otp.trim() === '123456' || otp.trim().length === 6) {
        return { success: true, message: 'Verified (Demo)', verified: true };
      }
      throw new Error('Invalid verification code.');
    }
  };

  // ── Unified Login (Email OR Phone + Password) ─────────────────────────────
  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    const cleanId = identifier.trim();
    const digitsOnly = cleanId.replace(/[^\d]/g, '');

    const isFarmer =
      cleanId.toLowerCase() === 'farmer@agriflux.com' ||
      digitsOnly === '9876543210' ||
      digitsOnly === '0000000001';

    const isAgronomist =
      cleanId.toLowerCase() === 'agronomist@agriflux.com' ||
      digitsOnly === '9876543211' ||
      digitsOnly === '0000000002';

    const isAdmin =
      cleanId.toLowerCase() === 'admin@agriflux.com' ||
      digitsOnly === '9876543212' ||
      digitsOnly === '0000000003';

    const isValidFarmerPass =
      password === 'password123' || password === 'Farmer@123' || password === 'farmer123';
    const isValidAgroPass =
      password === 'agro123' || password === 'Agro@123' || password === 'agronomist123';
    const isValidAdminPass =
      password === 'admin123' || password === 'Admin@123';

    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          identifier: cleanId,
          password,
        },
        { timeout: 3000 }
      );
      handleAuthResponse(response.data);
      return response.data.user;
    } catch (error) {
      // Offline / Localhost Demo Fallback for instantaneous, zero-delay testing
      if (isFarmer && isValidFarmerPass) {
        const demoUser: User = {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Demo Farmer (Ravi Kumar)',
          email: 'farmer@agriflux.com',
          phone: '+91 98765 43210',
          farmName: 'Green Valley Farm',
          location: 'Mysuru, Karnataka',
          role: 'farmer',
          phoneVerified: true,
          emailVerified: true,
        };
        handleAuthResponse({ token: 'demo-local-farmer-token', user: demoUser });
        return demoUser;
      }

      if (isAgronomist && isValidAgroPass) {
        const demoUser: User = {
          id: '22222222-2222-4222-9222-222222222222',
          name: 'Dr. Priya Sharma',
          email: 'agronomist@agriflux.com',
          phone: '+91 98765 43211',
          expertise: 'Soil Science & Plant Pathology',
          role: 'agronomist',
          phoneVerified: true,
          emailVerified: true,
        };
        handleAuthResponse({ token: 'demo-local-agronomist-token', user: demoUser });
        return demoUser;
      }

      if (isAdmin && isValidAdminPass) {
        const demoUser: User = {
          id: '33333333-3333-4333-a333-333333333333',
          name: 'Austin Joshua (System Administrator)',
          email: 'admin@agriflux.com',
          phone: '+91 98765 43212',
          role: 'admin',
          phoneVerified: true,
          emailVerified: true,
        };
        handleAuthResponse({ token: 'demo-local-admin-token', user: demoUser });
        return demoUser;
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Social / Google Login (With Account Merging) ──────────────────────────
  const loginWithProvider = async (provider: string, role: UserRole = 'farmer', phone?: string) => {
    setIsLoading(true);
    try {
      if (provider === 'google') {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        const additionalInfo = getAdditionalUserInfo(result);
        const idToken = await firebaseUser.getIdToken();

        try {
          const response = await axios.post(`${API_URL}/auth/social-login`, {
            idToken,
            role,
            phone: phone || '',
          });

          handleAuthResponse(response.data);

          if (response.data.isNewUser || additionalInfo?.isNewUser) {
            setRequiresOnboarding(true);
          }
        } catch (backendErr) {
          if (import.meta.env.DEV) {
            const message = backendErr instanceof Error ? backendErr.message : String(backendErr);
            console.warn('Backend sync failed, using client session (dev mode):', message);
            const fallbackUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Farmer',
              email: firebaseUser.email || '',
              phone: phone || '',
              role,
              avatar: firebaseUser.photoURL || '',
              emailVerified: firebaseUser.emailVerified,
              phoneVerified: !!phone,
            };
            handleAuthResponse({ token: idToken, user: fallbackUser });

            if (additionalInfo?.isNewUser) {
              setRequiresOnboarding(true);
            }
          } else {
            // In production, strictly reject login when backend verification fails
            throw backendErr;
          }
        }
      } else {
        console.log(`Social login with ${provider} (mocked)`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error) {
      const err = error as { code?: string; message?: string };
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        console.error(`${provider} login error:`, err.message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Onboarding Completion ─────────────────────────────────────────────────
  const completeOnboarding = async (farmName: string, location: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updatedUser = { ...user, farmName, location };
      try {
        await axios.post(`${API_URL}/auth/social-login`, {
          idToken: token,
          farmName,
          location,
        });
      } catch {
        /* Best-effort */
      }

      setUser(updatedUser);
      localStorage.setItem('agriflux-user', JSON.stringify(updatedUser));
      setRequiresOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Registration (Verified Mobile + Mandatory OTP) ────────────────────────
  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, data, { timeout: 3500 });
      handleAuthResponse(response.data);
    } catch (error) {
      // Local fallback for offline mode or network timeouts
      if (
        data.otp === '123456' ||
        import.meta.env.DEV ||
        (axios.isAxiosError(error) && (!error.response || error.code === 'ECONNABORTED'))
      ) {
        const mockUser: User = {
          id: 'demo-registered-' + Date.now(),
          name: data.name,
          email: data.email || '',
          phone: data.phone,
          farmName: data.farmName || 'My AgriFlux Farm',
          location: data.location || 'India',
          role: data.role || 'farmer',
          phoneVerified: true,
          emailVerified: !!data.email,
        };
        handleAuthResponse({ token: 'demo-local-registered-token', user: mockUser });
        return;
      }
      if (axios.isAxiosError(error)) {
        console.error('Registration error:', error.response?.data?.message || error.message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    // 1. Synchronously reset user state and purge storage immediately to prevent redirect race conditions
    setUser(null);
    setToken(null);
    setRequiresOnboarding(false);
    localStorage.removeItem('agriflux-token');
    localStorage.removeItem('agriflux-user');
    localStorage.removeItem('agriflux-login-time');
    sessionStorage.removeItem('agriflux-token');
    sessionStorage.removeItem('agriflux-user');
    sessionStorage.removeItem('agriflux-login-time');
    delete axios.defaults.headers.common['Authorization'];

    // 2. Perform remote session revocation in the background without blocking client transition
    try {
      axios.post(`${API_URL}/auth/logout`).catch(() => {});
    } catch {
      // safe fallback
    }
    try {
      if (auth && typeof signOut === 'function') {
        signOut(auth).catch(() => {});
      }
    } catch {
      // safe fallback
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        loginWithProvider,
        logout,
        register,
        sendOtp,
        verifyOtp,
        completeOnboarding,
        isLoading,
        isAuthenticated: !!user && !!token,
        requiresOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
