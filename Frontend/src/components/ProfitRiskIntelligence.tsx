import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Calculator, PieChart, Activity } from 'lucide-react';
import { useRealisticData } from '../hooks/useRealisticData';

const ProfitRiskIntelligence: React.FC = () => {
  const { t } = useTranslation();
  const data = useRealisticData();

  // Derived values
  const margin = ((data.profitMax / (data.yieldKgHa * data.priceMax)) * 100).toFixed(1);
  const rainRiskRaw = data.rainfall > 600 ? 'High' : data.rainfall < 400 ? 'Medium' : 'Low';
  const marketRiskRaw = data.demandScore < 80 ? 'Medium' : 'Low';

  const rainRisk = rainRiskRaw === 'Low' ? t('common.riskLow', 'Low') : rainRiskRaw === 'Medium' ? t('common.riskMedium', 'Medium') : t('common.riskHigh', 'High');
  const marketRisk = marketRiskRaw === 'Low' ? t('common.riskLow', 'Low') : t('common.riskMedium', 'Medium');

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="section-header">{t('dashboard.profitRiskTitle', 'Profit & Risk Intelligence')}</h3>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
            {t('dashboard.profitRiskSubtitle', 'Financial forecasting & risk assessment')}
          </p>
        </div>
        <Calculator size={20} className="text-primary-500" />
      </div>

      <div className="space-y-6 flex-1">
        {/* Profit Calculator View */}
        <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-end mb-4">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {t('dashboard.revenueAnalysis', 'Revenue Analysis')}
            </span>
            <span className="text-[10px] text-gray-400">
              {t('dashboard.basedOnCropPrice', 'Based on {{crop}} Price', { crop: data.crop })}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('dashboard.estRevenue', 'Est. Revenue')}</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">
                ₹{(data.profitMax + data.estimatedCost).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('dashboard.productionCost', 'Production Cost')}</span>
              <span className="font-bold text-red-500">
                - ₹{data.estimatedCost.toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                {t('dashboard.netProfit', 'Net Profit')}
              </span>
              <div className="text-right">
                <p className="text-xl font-black text-primary-600">
                  ₹{data.profitMax.toLocaleString()}
                </p>
                <p className="text-[10px] font-bold text-primary-500/70">{margin}% {t('dashboard.margin', 'Margin')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-blue-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">{t('dashboard.weatherRisk', 'Weather Risk')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${rainRiskRaw === 'Low' ? 'bg-green-500' : 'bg-yellow-500'}`}
              />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{rainRisk}</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{data.rainfall}mm {t('dashboard.forecast', 'Forecast')}</p>
          </div>

          <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/20">
            <div className="flex items-center gap-2 mb-2">
              <PieChart size={14} className="text-teal-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">{t('dashboard.marketRisk', 'Market Risk')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${marketRiskRaw === 'Low' ? 'bg-green-500' : 'bg-yellow-500'}`}
              />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                {marketRisk}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{data.demandScore}% {t('dashboard.demand', 'Demand')}</p>
          </div>
        </div>

        {/* Dynamic Advisory */}
        <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30">
          <div className="flex gap-3">
            <AlertCircle size={18} className="text-primary-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-primary-800 dark:text-primary-300">
                {t('dashboard.financialAdvisory', 'Financial Advisory')}
              </p>
              <p className="text-[11px] text-primary-700 dark:text-primary-400/80 mt-1 leading-relaxed">
                {data.profitMax > 50000
                  ? t('dashboard.highProfitAdvice', 'High profitability detected for {{crop}}. Consider forward contracting to lock in prices above ₹{{price}}/kg.', {
                      crop: data.crop,
                      price: data.priceMin,
                    })
                  : t('dashboard.tightMarginAdvice', 'Margins are tight. Focus on reducing urea input by 15% and utilizing government KCC loans for operational liquidity.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitRiskIntelligence;
