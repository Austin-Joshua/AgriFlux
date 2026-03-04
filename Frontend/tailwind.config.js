/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'sans-serif'],
            },
            colors: {
                // AgriFlux design system — green & earth tones
                primary: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                earth: {
                    50: '#faf7f2',
                    100: '#f5ede0',
                    200: '#e8d4b8',
                    300: '#d9b88a',
                    400: '#c99a5c',
                    500: '#b8823d',
                    600: '#9d6b2f',
                    700: '#7d5528',
                    800: '#664524',
                    900: '#553b1f',
                },
                // Enhanced dark mode grays
                dark: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    850: '#1a1f2e',
                    900: '#111827',
                    950: '#0a0e1a',
                },
            },
            backgroundColor: {
                'dark-surface': '#1f2937',
                'dark-surface-elevated': '#374151',
                'dark-surface-hover': '#374151',
            },
            textColor: {
                'dark-primary': '#f9fafb',
                'dark-secondary': '#d1d5db',
                'dark-tertiary': '#9ca3af',
            },
            borderColor: {
                'dark-border': '#374151',
                'dark-border-hover': '#4b5563',
            },
            boxShadow: {
                'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
                'glow-earth': '0 0 20px rgba(184, 130, 61, 0.3)',
            },
            animation: {
                'fade-in': 'fade-in 0.6s ease-out forwards',
                'slide-down': 'slide-down 0.6s ease-out forwards',
                'slide-up': 'slide-up 0.6s ease-out forwards',
                'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 8s linear infinite',
            },
            keyframes: {
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'slide-down': {
                    from: { opacity: '0', transform: 'translateY(-20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-up': {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in-up': {
                    from: { opacity: '0', transform: 'translateY(30px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
};
