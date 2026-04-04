import React, { useMemo } from 'react';
import { 
    Bell, CloudRain, TrendingUp, 
    AlertCircle, Lightbulb, X,
    ChevronRight, Info
} from 'lucide-react';
import { useRealisticData } from '../hooks/useRealisticData';

interface Alert {
    id: string;
    type: 'warning' | 'info' | 'success' | 'market';
    title: string;
    message: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
}

const SmartAlerts: React.FC = () => {
    const data = useRealisticData();

    const alerts: Alert[] = useMemo(() => {
        const list: Alert[] = [];

        // Weather Alert
        if (data.rainfall > 500) {
            list.push({
                id: 'weather-1',
                type: 'warning',
                title: 'High Rainfall Expected',
                message: 'Heavy rain predicted within 48h. Ensure drainage channels are clear.',
                icon: <CloudRain size={16} />,
                color: 'text-blue-600',
                bg: 'bg-blue-50 dark:bg-blue-900/20'
            });
        }

        // Soil Alert
        if (data.soilPh < 6.5) {
            list.push({
                id: 'soil-1',
                type: 'info',
                title: 'Soil pH Adjustment',
                message: 'Soil is slightly acidic. Recommended: 50kg/ha Lime application.',
                icon: <Lightbulb size={16} />,
                color: 'text-gold-600',
                bg: 'bg-gold-50 dark:bg-gold-900/20'
            });
        }

        // Market Alert
        if (data.demandScore > 85) {
            list.push({
                id: 'market-1',
                type: 'market',
                title: 'Market Demand Surge',
                message: `${data.crop} demand is peaking in ${data.bestMarket.split(' ')[0]}. Sell now for max profit.`,
                icon: <TrendingUp size={16} />,
                color: 'text-primary-600',
                bg: 'bg-primary-50 dark:bg-primary-900/20'
            });
        }

        // Generic Info
        list.push({
            id: 'info-1',
            type: 'info',
            title: 'Precision Watering',
            message: 'Optimal irrigation window: Tonight 10 PM. Save 12% water today.',
            icon: <Info size={16} />,
            color: 'text-gray-600',
            bg: 'bg-gray-50 dark:bg-gray-700/30'
        });

        return list;
    }, [data.rainfall, data.soilPh, data.demandScore, data.crop, data.bestMarket]);

    return (
        <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                        <Bell size={18} className="animate-swing" />
                    </div>
                    <h3 className="section-header">Live Intelligence Alerts</h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{alerts.length} New</span>
            </div>

            <div className="space-y-3">
                {alerts.map((alert) => (
                    <div 
                        key={alert.id} 
                        className={`group relative p-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all cursor-pointer ${alert.bg}`}
                    >
                        <div className="flex gap-3">
                            <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.color} bg-white/50 dark:bg-black/20 shadow-sm`}>
                                {alert.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-bold ${alert.color} truncate`}>{alert.title}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{alert.message}</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 mt-1" />
                        </div>
                    </div>
                ))}
            </div>

            <button className="mt-4 w-full py-2.5 text-xs font-bold text-gray-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-1.5 border-t border-gray-100 dark:border-gray-800">
                View All Notification History
            </button>
        </div>
    );
};

export default SmartAlerts;
