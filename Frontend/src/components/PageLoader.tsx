import React from 'react';
import { Leaf } from 'lucide-react';

const PageLoader: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        {/* Animated leaf spinner */}
        <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary-100 dark:border-primary-900/40 border-t-primary-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Leaf size={22} className="text-primary-500 animate-pulse-slow" />
            </div>
        </div>
        {/* Skeleton placeholders */}
        <div className="w-full max-w-2xl space-y-3 px-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl shimmer w-1/3 mx-auto" />
            <div className="grid grid-cols-4 gap-3 mt-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl shimmer" />
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl shimmer" style={{ animationDelay: '0.2s' }} />
            </div>
        </div>
    </div>
);

export default PageLoader;
