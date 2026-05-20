import { getOverviewStats } from "@/lib/actions";
import { Phone, CheckCircle, Hash, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import GlobeWrapper from "@/components/GlobeWrapper";
import DashboardCharts from "@/components/DashboardCharts";

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default async function Overview() {
  const stats = await getOverviewStats();

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-[#0d1117] min-h-screen pb-10 transition-colors">
      {/* ROW 1: 6 Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        
        {/* Calls Made */}
        <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-[#30363d] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-400">Calls Made</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalCalls}</h3>
            </div>
            <div className="p-1.5 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded-md"><Phone className="w-4 h-4" /></div>
          </div>
          <p className="text-[10px] text-green-600 font-medium flex items-center mt-3">
            <TrendingUp className="w-3 h-3 mr-1" /> +100.0% <span className="text-gray-400 dark:text-gray-500 ml-1 font-normal">vs previous period</span>
          </p>
        </div>

        {/* Total Spend */}
        <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-[#30363d] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-400">Total Spend</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.totalCost)}</h3>
            </div>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-md">
              <span className="text-sm font-bold leading-none px-1">₹</span>
            </div>
          </div>
          <p className="text-[10px] text-green-600 font-medium flex items-center mt-3">
            <TrendingUp className="w-3 h-3 mr-1" /> +100.0% <span className="text-gray-400 dark:text-gray-500 ml-1 font-normal">vs previous period</span>
          </p>
        </div>

        {/* Call Pickup Rate */}
        <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-[#30363d] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-400">Call Pickup Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pickupRate}%</h3>
            </div>
            <div className="p-1.5 border border-green-200 dark:border-green-900 text-green-600 dark:text-green-500 rounded-full"><CheckCircle className="w-4 h-4" /></div>
          </div>
          <p className="text-[10px] text-green-600 font-medium flex items-center mt-3">
            <TrendingUp className="w-3 h-3 mr-1" /> +100.0% <span className="text-gray-400 dark:text-gray-500 ml-1 font-normal">vs previous period</span>
          </p>
        </div>

        {/* SIP Trunk Calls */}
        <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-[#30363d] p-4 shadow-sm flex flex-col justify-between relative group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-400">SIP Trunk Calls</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.sipTrunkCalls}</h3>
            </div>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-md"><Phone className="w-4 h-4" /></div>
          </div>
          <div className="flex justify-between items-end mt-3">
            <p className="text-[10px] text-green-600 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +100.0% <span className="text-gray-400 dark:text-gray-500 ml-1 font-normal">vs previous period</span>
            </p>
          </div>
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href="/logs" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center">View call logs <ChevronRight className="w-3 h-3" /></Link>
          </div>
        </div>

        {/* Voice API Calls */}
        <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-[#30363d] p-4 shadow-sm flex flex-col justify-between relative group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-400">Voice API Calls</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.voiceApiCalls}</h3>
            </div>
            <div className="p-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-md"><Phone className="w-4 h-4" /></div>
          </div>
          <div className="flex justify-between items-end mt-3">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium flex items-center">
               -- No change <span className="text-gray-400 dark:text-gray-500 ml-1 font-normal">vs previous period</span>
            </p>
          </div>
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href="/logs" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center">View call logs <ChevronRight className="w-3 h-3" /></Link>
          </div>
        </div>

        {/* Active Numbers */}
        <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-[#30363d] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-400">Active Numbers</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.activeNumbers}</h3>
            </div>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md"><Hash className="w-4 h-4" /></div>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium flex items-center mt-3">
             -- No change <span className="text-gray-400 dark:text-gray-500 ml-1 font-normal">vs previous period</span>
          </p>
        </div>

      </div>

      {/* ROW 2 & 3: Charts (Extracted to Client Component for Daily/Hourly Toggle) */}
      <DashboardCharts stats={stats} />

      <h2 className="text-xs font-bold text-gray-800 dark:text-gray-400 uppercase tracking-wide mt-8 mb-2">Account & Infrastructure</h2>
      
      {/* ROW 4: Account & Infrastructure */}
      <div className="grid gap-4 md:grid-cols-1">
        <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-[#30363d] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Global Call Distribution</h3>
          <div className="w-full h-[400px] flex items-center justify-center">
            <GlobeWrapper />
          </div>
        </div>
      </div>

    </div>
  );
}
