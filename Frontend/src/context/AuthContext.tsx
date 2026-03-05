import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

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
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (phone: string, password: string, role?: UserRole) => Promise<void>;
    loginWithProvider: (provider: 'google' | 'microsoft' | 'apple', role?: UserRole) => Promise<void>;
    logout: () => void;
    register: (data: RegisterData) => Promise<void>;
    isLoading: boolean;
    isAuthenticated: boolean;
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

    useEffect(() => {
        const savedToken = localStorage.getItem('agriflux-token');
        const savedUser = localStorage.getItem('agriflux-user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
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

    const login = async (phone: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { phone, password });
            handleAuthResponse(response.data);
        } catch (error: any) {
            console.error('Login error:', error.response?.data?.message || error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithProvider = async (provider: string, role: UserRole = 'farmer') => {
        // Social login would normally follow a similar flow to a dedicated endpoint
        console.log(`Simulating social login with ${provider} for role ${role}`);
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        setIsLoading(false);
    };

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

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('agriflux-token');
        localStorage.removeItem('agriflux-user');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, loginWithProvider, logout, register, isLoading, isAuthenticated: !!user && !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
