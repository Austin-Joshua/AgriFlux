import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tractor, Calendar, Search, MapPin, Gauge, Fuel, Info, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Equipment {
  id: string;
  name: string;
  type: string;
  owner: string;
  pricePerDay: number;
  location: string;
  image: string;
  distance: number;
  availability: boolean;
  features: string[];
}

const mockEquipment: Equipment[] = [
  {
    id: '1',
    name: 'Mahindra 575 DI XP Plus',
    type: 'Tractor',
    owner: 'Singh Agri Equipments',
    pricePerDay: 1500,
    location: 'Ludhiana, Punjab',
    image: 'https://images.unsplash.com/photo-1592860822606-44477c77d461?auto=format&fit=crop&w=400&q=80',
    distance: 4.2,
    availability: true,
    features: ['47 HP', 'Power Steering', 'Oil Immersed Brakes']
  },
  {
    id: '2',
    name: 'John Deere 5050 D',
    type: 'Tractor',
    owner: 'Kisan Rentals',
    pricePerDay: 1800,
    location: 'Amritsar, Punjab',
    image: 'https://images.unsplash.com/photo-1629854483785-5a50e906b3a0?auto=format&fit=crop&w=400&q=80',
    distance: 8.5,
    availability: true,
    features: ['50 HP', '4WD Options', 'High Backup Torque']
  },
  {
    id: '3',
    name: 'Automatic Seed Drill',
    type: 'Implement',
    owner: 'Green Farms Coop',
    pricePerDay: 600,
    location: 'Jalandhar, Punjab',
    image: 'https://images.unsplash.com/photo-1605330383321-df62eb012a67?auto=format&fit=crop&w=400&q=80',
    distance: 12.1,
    availability: false,
    features: ['11 Tynes', 'Fertilizer Box', 'Adjustable Depth']
  },
  {
    id: '4',
    name: 'Combine Harvester',
    type: 'Harvester',
    owner: 'Punjab Agro Services',
    pricePerDay: 4500,
    location: 'Patiala, Punjab',
    image: 'https://images.unsplash.com/photo-1598282361732-cbf1dabae573?auto=format&fit=crop&w=400&q=80',
    distance: 18.4,
    availability: true,
    features: ['A/C Cabin', '14Ft Cutter Bar', 'Grain Tank']
  }
];

const EquipmentRental: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');

  const filteredEquipment = mockEquipment.filter(
    (eq) =>
      (category === 'All' || eq.type === category) &&
      (eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       eq.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary-900 to-green-900 p-8 rounded-3xl relative overflow-hidden text-white shadow-xl">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute -right-20 -top-20 opacity-10">
           <Tractor size={300} />
        </div>
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Tractor className="text-primary-300" />
            Smart Equipment Rental
          </h1>
          <p className="text-primary-100 mt-2 text-lg">
            Rent high-quality agricultural machinery from trusted owners near you.
          </p>
        </div>
        <div className="relative z-10 flex gap-3">
          <button className="px-5 py-2.5 bg-white text-primary-900 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition-all hover:scale-105">
            List Equipment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full relative z-20">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, brand, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white text-lg"
          />
        </div>
        <div className="flex gap-2">
            {['All', 'Tractor', 'Implement', 'Harvester'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-5 py-3 rounded-2xl font-medium transition-all shadow-sm border
                  ${category === cat 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-500/50'}`}
                >
                  {cat}
                </button>
            ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {filteredEquipment.map((eq, i) => (
          <motion.div
            key={eq.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card flex flex-col md:flex-row overflow-hidden rounded-3xl border border-gray-100 dark:border-gray-800 hover:shadow-2xl transition-all duration-300 group"
          >
            {/* Image Box */}
            <div className="md:w-2/5 p-3">
               <div className="relative w-full h-48 md:h-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img src={eq.image} alt={eq.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 flex gap-2">
                     <span className={`px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm backdrop-blur-md ${eq.availability ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                        {eq.availability ? 'Available Now' : 'Currently Rented'}
                     </span>
                  </div>
               </div>
            </div>

            {/* Details Box */}
            <div className="md:w-3/5 p-5 flex flex-col justify-between">
              <div>
                 <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{eq.name}</h3>
                    <div className="bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-xl border border-primary-100 dark:border-primary-800/50 text-right">
                       <span className="block text-xs text-primary-600 dark:text-primary-400 font-medium">Rent</span>
                       <span className="block text-lg font-black text-primary-700 dark:text-primary-300">₹{eq.pricePerDay}<span className="text-xs font-normal">/day</span></span>
                    </div>
                 </div>
                 
                 <div className="flex gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    <div className="flex items-center gap-1.5"><MapPin size={16} className="text-gray-400" /> {eq.distance} km away</div>
                    <div className="flex items-center gap-1.5"><Fuel size={16} className="text-gray-400" /> Diesel</div>
                 </div>

                 <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase font-bold tracking-wider">Key Features</p>
                    <div className="flex flex-wrap gap-2">
                       {eq.features.map(f => (
                          <span key={f} className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-300 flex items-center gap-1">
                             <CheckCircle2 size={12} className="text-green-500" /> {f}
                          </span>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="mt-5 flex gap-3">
                 <button className={`flex-1 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2
                     ${eq.availability ? 'bg-primary-600 hover:bg-primary-700 text-white hover:scale-[1.02]' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'}`}
                     disabled={!eq.availability}>
                    <Calendar size={18} />
                    {eq.availability ? 'Book Now' : 'Not Available'}
                 </button>
                 <button className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium transition-all" title="Owner Details">
                    <Info size={20} />
                 </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
         <div className="text-center py-16">
            <Tractor size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No equipment found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
         </div>
      )}
    </div>
  );
};

export default EquipmentRental;
