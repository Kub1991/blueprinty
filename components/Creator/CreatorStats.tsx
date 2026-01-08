import React from 'react';
import { Wallet, Map, TrendingUp } from 'lucide-react';

/**
 * Creator Statistics Dashboard Section
 * Displays earnings, published plans count, and weekly trends
 */

/**
 * Creator Statistics Dashboard Section
 * Displays earnings, published plans count, and weekly trends
 */
const CreatorStats: React.FC = () => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Earnings Card */}
        <div className="lg:col-span-2 bg-black text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
            <Wallet size={160} />
          </div>
          <div className="relative z-10">
            <p className="text-xs text-gray-400 uppercase font-black tracking-[0.2em]">
              Dostępne środki
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-5xl font-black tracking-tighter">3 450</h2>
              <span className="text-xl font-bold text-gray-500">PLN</span>
            </div>
            <div className="flex gap-3 mt-8">
              <button className="bg-white text-black px-8 py-3 rounded-2xl font-bold text-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all active:scale-95 leading-none">
                Wypłać
              </button>
              <button className="bg-white/10 backdrop-blur border border-white/20 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all leading-none">
                Historia
              </button>
            </div>
          </div>
        </div>

        {/* Side Stats */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 hover:shadow-md transition group">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
              <Map size={28} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">
                Opublikowane
              </p>
              <h3 className="text-3xl font-black">14</h3>
            </div>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 hover:shadow-md transition group">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 transition-transform group-hover:scale-110">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">
                Zarobki (30D)
              </p>
              <h3 className="text-3xl font-black">48.2k</h3>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatorStats;
