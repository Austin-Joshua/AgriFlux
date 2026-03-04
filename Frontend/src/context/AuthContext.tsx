import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'farmer' | 'agronomist' | 'admin';

export interface User {
    id: string;
    name: string;
    email: string;
    farmName?: string;
    location?: string;
    role: UserRole;
    avatar?: string;
    expertise?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string, role?: UserRole) => Promise<void>;
    loginWithProvider: (provider: 'google' | 'microsoft' | 'apple', role?: UserRole) => Promise<void>;
    logout: () => void;
    register: (data: RegisterData) => Promise<void>;
    isLoading: boolean;
    isAuthenticated: boolean;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
    farmName?: string;
    location?: string;
    phone?: string;
}

const demoUsers: Record<UserRole, User> = {
    farmer: {
        id: '1', name: 'Ravi Kumar', email: 'user@agriflux.ai',
        farmName: 'Green Valley Farm', location: 'Karnataka, India', role: 'farmer',
    },
    agronomist: {
        id: '2', name: 'Dr. Priya Sharma', email: 'agronomist@agriflux.ai',
        location: 'Pune, Maharashtra', role: 'agronomist',
        expertise: 'Soil Science & Crop Pathology',
    },
    admin: {
        id: '3', name: 'Admin User', email: 'admin@agriflux.ai',
        location: 'Bengaluru, India', role: 'admin',
    },
};

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
        }
        setIsLoading(false);
    }, []);

    const persistUser = (u: User) => {
        const tok = 'demo-jwt-' + u.role + '-' + Date.now();
        setUser(u);
        setToken(tok);
        localStorage.setItem('agriflux-token', tok);
        localStorage.setItem('agriflux-user', JSON.stringify(u));
    };

    const login = async (email: string, password: string, role: UserRole = 'farmer') => {
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 700)); // simulate network
        try {
            // role-specific demo users
            const roleKeys: UserRole[] = ['farmer', 'agronomist', 'admin'];
            const matchedRole = roleKeys.find(r => demoUsers[r].email === email.toLowerCase()) ?? role;
            const u: User = { ...demoUsers[matchedRole], email };
            persistUser(u);
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithProvider = async (provider: 'google' | 'microsoft' | 'apple', role: UserRole = 'farmer') => {
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1200)); // simulate OAuth
        try {
            const providerNames: Record<string, string> = { google: 'Google', microsoft: 'Microsoft', apple: 'Apple' };
            const base = demoUsers[role];
            const u: User = { ...base, name: base.name + ' (' + providerNames[provider] + ')', id: provider + '-' + Date.now() };
            persistUser(u);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterData) => {
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 800));
        try {
            const u: User = {
                id: Date.now().toString(), name: data.name, email: data.email,
                farmName: data.farmName || 'My Farm', location: data.location || 'India', role: 'farmer',
            };
            persistUser(u);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('agriflux-token');
        localStorage.removeItem('agriflux-user');
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
