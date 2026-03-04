import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    farmName?: string;
    location?: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load from localStorage on startup
        const savedToken = localStorage.getItem('agriflux-token');
        const savedUser = localStorage.getItem('agriflux-user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // Demo login - in production this calls the backend
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            }).catch(() => null);

            if (response && response.ok) {
                const data = await response.json();
                setUser(data.user);
                setToken(data.token);
                localStorage.setItem('agriflux-token', data.token);
                localStorage.setItem('agriflux-user', JSON.stringify(data.user));
            } else {
                // Demo mode fallback
                const demoUser: User = {
                    id: '1',
                    name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                    email,
                    farmName: 'Green Valley Farm',
                    location: 'Karnataka, India',
                    role: 'farmer',
                };
                const demoToken = 'demo-jwt-token-' + Date.now();
                setUser(demoUser);
                setToken(demoToken);
                localStorage.setItem('agriflux-token', demoToken);
                localStorage.setItem('agriflux-user', JSON.stringify(demoUser));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterData) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).catch(() => null);

            if (response && response.ok) {
                const result = await response.json();
                setUser(result.user);
                setToken(result.token);
                localStorage.setItem('agriflux-token', result.token);
                localStorage.setItem('agriflux-user', JSON.stringify(result.user));
            } else {
                // Demo mode fallback
                const demoUser: User = {
                    id: Date.now().toString(),
                    name: data.name,
                    email: data.email,
                    farmName: data.farmName || 'My Farm',
                    location: data.location || 'India',
                    role: 'farmer',
                };
                const demoToken = 'demo-jwt-token-' + Date.now();
                setUser(demoUser);
                setToken(demoToken);
                localStorage.setItem('agriflux-token', demoToken);
                localStorage.setItem('agriflux-user', JSON.stringify(demoUser));
            }
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
        <AuthContext.Provider value={{
            user, token, login, logout, register, isLoading,
            isAuthenticated: !!user && !!token
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
