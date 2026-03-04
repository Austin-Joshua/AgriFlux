import React, { useState } from 'react';
import { ExternalLink, Search, Filter, CheckCircle, IndianRupee, Users, FileText, Globe, ChevronRight } from 'lucide-react';

interface Scheme {
    id: string;
    name: string;
    ministry: string;
    category: string;
    benefit: string;
    eligibility: string;
    maxBenefit: string;
    state: string;
    url: string;
    tags: string[];
    icon: string;
}

const schemes: Scheme[] = [
    {
        id: 'pmkisan', name: 'PM-KISAN', ministry: 'Ministry of Agriculture',
        category: 'Income Support', benefit: '₹6,000/year direct income support in 3 equal instalments to small & marginal farmers.',
        eligibility: 'All landholding farmer families with cultivable land.', maxBenefit: '₹6,000 / year',
        state: 'All India', url: 'https://pmkisan.gov.in', tags: ['Income', 'Direct Benefit'],
        icon: '🌾'
    },
    {
        id: 'pmfby', name: 'PMFBY — Crop Insurance', ministry: 'Ministry of Agriculture',
        category: 'Insurance', benefit: 'Financial support to farmers suffering crop loss due to unforeseen calamities, pests & diseases.',
        eligibility: 'All farmers including sharecroppers & tenant farmers growing notified crops.', maxBenefit: 'Up to full sum insured',
        state: 'All India', url: 'https://pmfby.gov.in', tags: ['Insurance', 'Risk Mitigation'],
        icon: '🛡️'
    },
    {
        id: 'shc', name: 'Soil Health Card (SHC)', ministry: 'Ministry of Agriculture',
        category: 'Soil Health', benefit: 'Free soil testing and a card containing crop-wise nutrient recommendations for every farmer.',
        eligibility: 'All farmers.', maxBenefit: 'Free soil analysis',
        state: 'All India', url: 'https://soilhealth.dac.gov.in', tags: ['Soil', 'Free Service'],
        icon: '🧪'
    },
    {
        id: 'kcc', name: 'Kisan Credit Card (KCC)', ministry: 'Ministry of Finance / Agriculture',
        category: 'Credit', benefit: 'Short-term credit at 4% interest for crop cultivation, post-harvest expenses, and allied activities.',
        eligibility: 'Farmers, tenant farmers, oral lessees and SHG/JLG members.', maxBenefit: 'Up to ₹3 Lakh @ 4% interest',
        state: 'All India', url: 'https://www.nabard.org/content.aspx?id=595', tags: ['Credit', 'Loan'],
        icon: '💳'
    },
    {
        id: 'enam', name: 'eNAM — National Agriculture Market', ministry: 'Ministry of Agriculture',
        category: 'Market Access', benefit: 'Online trading platform connecting farmers, APMCs, traders, and buyers for better price discovery.',
        eligibility: 'All farmers with produce to sell.', maxBenefit: 'Better market prices',
        state: 'All India', url: 'https://enam.gov.in', tags: ['Market', 'Digital'],
        icon: '📊'
    },
    {
        id: 'rkvy', name: 'RKVY — Krishi Vikash Yojana', ministry: 'Ministry of Agriculture',
        category: 'Development', benefit: 'State-level agriculture development projects funding — infrastructure, post-harvest management, and more.',
        eligibility: 'Project-based; implemented via State governments.', maxBenefit: 'Project-specific',
        state: 'State-wise', url: 'https://rkvy.nic.in', tags: ['Infrastructure', 'Development'],
        icon: '🏗️'
    },
    {
        id: 'midh', name: 'MIDH — Horticulture Development', ministry: 'Ministry of Agriculture',
        category: 'Horticulture', benefit: 'Subsidy for fruits, vegetables, mushrooms, spices, flowers, plantation crops and post-harvest infrastructure.',
        eligibility: 'Individual farmers, FPOs, and companies in horticulture.', maxBenefit: 'Up to 50% of project cost',
        state: 'All India', url: 'https://www.midh.gov.in', tags: ['Horticulture', 'Subsidy'],
        icon: '🍅'
    },
    {
        id: 'atma', name: 'ATMA — Agricultural Technology', ministry: 'Ministry of Agriculture',
        category: 'Training', benefit: 'Training and demonstration for farmers including farmer field schools, exposure visits, and skill development.',
        eligibility: 'All farmers.', maxBenefit: 'Free training & TA',
        state: 'All India', url: 'https://atma-dac.gov.in', tags: ['Training', 'Skills'],
        icon: '📚'
    },
    {
        id: 'pmksy', name: 'PM Krishi Sinchai Yojana', ministry: 'Ministry of Jal Shakti',
        category: 'Irrigation', benefit: 'Subsidy for micro-irrigation (drip & sprinkler), water conservation, and watershed development.',
        eligibility: 'Individual farmers; priority to small/marginal.', maxBenefit: '55% subsidy (small/marginal)',
        state: 'All India', url: 'https://pmksy.gov.in', tags: ['Irrigation', 'Water'],
        icon: '💧'
    },
];

const categories = ['All', 'Income Support', 'Insurance', 'Soil Health', 'Credit', 'Market Access', 'Development', 'Horticulture', 'Training', 'Irrigation'];

const GovernmentSubsidies: React.FC = () => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');

    const filtered = schemes.filter(s =>
        (category === 'All' || s.category === category) &&
        (search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.benefit.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="page-header flex items-center gap-2">🏛️ Government Subsidies & Schemes</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Official Indian government agricultural support programmes — apply directly for benefits</p>
                </div>
                <div className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800">
                    <IndianRupee size={15} />
                    <span className="font-semibold">{schemes.length} Active Schemes</span>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search schemes..."
                        className="input-field pl-10 w-full"
                    />
                </div>
                <div className="relative">
                    <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select value={category} onChange={e => setCategory(e.target.value)}
                        className="input-field pl-9 pr-8 appearance-none cursor-pointer min-w-[180px]">
                        {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Results */}
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{filtered.length} scheme{filtered.length !== 1 ? 's' : ''} found</p>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(scheme => (
                    <div key={scheme.id} className="card group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{scheme.icon}</span>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{scheme.name}</h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{scheme.ministry}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-700/50 whitespace-nowrap">
                                {scheme.category}
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 flex-1 leading-relaxed">{scheme.benefit}</p>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-start gap-2 text-xs">
                                <CheckCircle size={12} className="text-primary-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-500 dark:text-gray-400">{scheme.eligibility}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <IndianRupee size={12} className="text-amber-500 flex-shrink-0" />
                                <span className="font-semibold text-amber-600 dark:text-amber-400">{scheme.maxBenefit}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-4">
                            {scheme.tags.map(tag => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{tag}</span>
                            ))}
                        </div>

                        <a href={scheme.url} target="_blank" rel="noreferrer"
                            className="btn-primary text-xs py-2.5 flex items-center justify-center gap-2 group-hover:gap-3 transition-all duration-200">
                            Apply / Learn More <ExternalLink size={12} />
                        </a>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                    <Globe size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No schemes found for your search</p>
                    <p className="text-sm mt-1">Try a different keyword or category</p>
                </div>
            )}

            {/* Disclaimer */}
            <div className="card bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50">
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                    <FileText size={14} className="flex-shrink-0 mt-0.5" />
                    <span><strong>Disclaimer:</strong> Scheme details are indicative. Always verify the latest eligibility, benefits, and application procedures on the official government portal before applying.</span>
                </p>
            </div>
        </div>
    );
};

export default GovernmentSubsidies;
