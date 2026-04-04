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
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (identifier: string, password: string, role?: UserRole) => Promise<User | undefined>;
    loginWithProvider: (provider: 'google' | 'microsoft' | 'apple', role?: UserRole) => Promise<void>;
    logout: () => void;
    register: (data: RegisterData) => Promise<void>;
    completeOnboarding: (farmName: string, location: string) => Promise<void>;
    isLoading: boolean;
    isAuthenticated: boolean;
    requiresOnboarding: boolean;
}

interface RegisterData {
    name: string;
    email?: string;
    password: string;
    phone: string;
    role?: UserRole;
    farmName?: string;
    location?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [requiresOnboarding, setRequiresOnboarding] = useState(false);

    // Restore session from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('agriflux-token');
        const savedUser = localStorage.getItem('agriflux-user');
        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setToken(savedToken);
                setUser(parsedUser);
                axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
            } catch {
                // Corrupted storage — clear it
                localStorage.removeItem('agriflux-token');
                localStorage.removeItem('agriflux-user');
            }
        }
        setIsLoading(false);
    }, []);

    const handleAuthResponse = (data: { token: string; user: User }) => {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('agriflux-token', data.token);
        localStorage.setItem('agriflux-user', JSON.stringify(data.user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    };

    // ── Password Login ────────────────────────────────────────────────────────
    const login = async (identifier: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { identifier, password });
            handleAuthResponse(response.data);
            return response.data.user;
        } catch (error: any) {
            console.error('Login error:', error.response?.data?.message || error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // ── Social / Google Login ─────────────────────────────────────────────────
    const loginWithProvider = async (provider: string, role: UserRole = 'farmer') => {
        setIsLoading(true);
        try {
            if (provider === 'google') {
                // Step 1 - Authenticate with Firebase in the browser
                const result = await signInWithPopup(auth, googleProvider);
                const firebaseUser = result.user;
                const additionalInfo = getAdditionalUserInfo(result);

                // Step 2 - Get the Firebase ID token to verify server-side
                const idToken = await firebaseUser.getIdToken();

                // Step 3 - Send the token to our backend for verification & DB sync
                try {
                    const response = await axios.post(`${API_URL}/auth/social-login`, {
                        idToken,
                        role,
                    });

                    handleAuthResponse(response.data);

                    // Trigger onboarding if it's the first time
                    if (response.data.isNewUser || additionalInfo?.isNewUser) {
                        setRequiresOnboarding(true);
                    }
                } catch (backendErr: any) {
                    // Backend not reachable (e.g. local dev without backend running)
                    // Fall back to a client-only session so the UI still works
                    console.warn('Backend sync failed, using client-only session:', backendErr.message);
                    const fallbackUser: User = {
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || 'Farmer',
                        email: firebaseUser.email || '',
                        phone: '',
                        role,
                        avatar: firebaseUser.photoURL || '',
                        emailVerified: firebaseUser.emailVerified,
                    };
                    const fallbackToken = idToken; // Use Firebase token as session token
                    handleAuthResponse({ token: fallbackToken, user: fallbackUser });

                    // Always trigger onboarding on fallback (no DB to check)
                    if (additionalInfo?.isNewUser) {
                        setRequiresOnboarding(true);
                    }
                }
            } else {
                // Microsoft / Apple — mocked for now
                console.log(`Social login with ${provider} (mocked)`);
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (error: any) {
            // Sign-in was cancelled or popup was blocked
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                console.error(`${provider} login error:`, error.message);
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

            // Sync back to our backend (best-effort)
            try {
                await axios.post(`${API_URL}/auth/social-login`, {
                    idToken: token,   // Pass current token for re-verification
                    farmName,
                    location,
                });
            } catch {
                // Backend not required for completing onboarding locally
            }

            setUser(updatedUser);
            localStorage.setItem('agriflux-user', JSON.stringify(updatedUser));
            setRequiresOnboarding(false);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Registration ──────────────────────────────────────────────────────────
    const register = async (data: RegisterData) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/register`, data);
            handleAuthResponse(response.data);
        } catch (error: any) {
            console.error('Registration error:', error.response?.data?.message || error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = async () => {
        // Sign out from Firebase as well to clear the Google session
        try { await signOut(auth); } catch { /* ignore */ }
        setUser(null);
        setToken(null);
        setRequiresOnboarding(false);
        localStorage.removeItem('agriflux-token');
        localStorage.removeItem('agriflux-user');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{
            user, token, login, loginWithProvider, logout, register,
            completeOnboarding, isLoading, isAuthenticated: !!user && !!token,
            requiresOnboarding
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
