import { getOverviewStats, getCallLogs } from "@/lib/actions";
import { Phone, Users, TrendingUp, Clock, Activity, DollarSign, ChevronRight } from "lucide-react";
import Link from "next/link";
import CostGraph from "@/components/CostGraph";
import GlobeWrapper from "@/components/GlobeWrapper";
import FormattedCurrency from "@/components/FormattedCurrency";

export default async function Overview() {
  const stats = await getOverviewStats();
  const allLogs = await getCallLogs();
  const recentLogs = allLogs.slice(0, 5);

  return (
    <div className="space-y-6 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-[#e6edf3]">Overview</h2>
          <p className="text-gray-500 dark:text-[#8b949e]">Analytics and recent activity for your voice agents.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-[#2ea043]/10 border border-green-200 dark:border-[#2ea043]/20">
          <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-[#2ea043] animate-pulse"></div>
          <span className="text-xs font-medium text-green-600 dark:text-[#2ea043]">All Systems Operational</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-gradient-to-br dark:from-[#161b22] dark:to-[#0d1117] p-6 relative overflow-hidden group shadow-sm transition-colors duration-200">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Phone className="w-24 h-24 text-blue-500 dark:text-[#2f81f7]" /></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-blue-50 dark:bg-[#2f81f7]/10 text-blue-600 dark:text-[#2f81f7] rounded-xl border border-blue-100 dark:border-[#2f81f7]/20 shadow-sm dark:shadow-[0_0_15px_rgba(47,129,247,0.1)]"><Phone className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-[#8b949e]">Total Calls</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-[#e6edf3] tracking-tight">{stats.totalCalls}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-gradient-to-br dark:from-[#161b22] dark:to-[#0d1117] p-6 relative overflow-hidden group shadow-sm transition-colors duration-200">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Users className="w-24 h-24 text-purple-500 dark:text-[#a371f7]" /></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-purple-50 dark:bg-[#a371f7]/10 text-purple-600 dark:text-[#a371f7] rounded-xl border border-purple-100 dark:border-[#a371f7]/20 shadow-sm dark:shadow-[0_0_15px_rgba(163,113,247,0.1)]"><Users className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-[#8b949e]">Captured Leads</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-[#e6edf3] tracking-tight">{stats.totalLeads}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-gradient-to-br dark:from-[#161b22] dark:to-[#0d1117] p-6 relative overflow-hidden group shadow-sm transition-colors duration-200">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="w-24 h-24 text-green-500 dark:text-[#2ea043]" /></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-green-50 dark:bg-[#2ea043]/10 text-green-600 dark:text-[#2ea043] rounded-xl border border-green-100 dark:border-[#2ea043]/20 shadow-sm dark:shadow-[0_0_15px_rgba(46,160,67,0.1)]"><TrendingUp className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-[#8b949e]">Positive Interactions</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-[#e6edf3] tracking-tight">{stats.positiveCalls}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-gradient-to-br dark:from-[#161b22] dark:to-[#0d1117] p-6 relative overflow-hidden group shadow-sm transition-colors duration-200">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Clock className="w-24 h-24 text-orange-500 dark:text-[#e34c26]" /></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-orange-50 dark:bg-[#e34c26]/10 text-orange-600 dark:text-[#e34c26] rounded-xl border border-orange-100 dark:border-[#e34c26]/20 shadow-sm dark:shadow-[0_0_15px_rgba(227,76,38,0.1)]"><Clock className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-[#8b949e]">Average Duration</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-[#e6edf3] tracking-tight">{stats.avgDuration}s</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-gradient-to-br dark:from-[#161b22] dark:to-[#0d1117] p-6 relative overflow-hidden group shadow-sm transition-colors duration-200 hidden md:block">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign className="w-24 h-24 text-yellow-500 dark:text-[#fb8f24]" /></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-yellow-50 dark:bg-[#fb8f24]/10 text-yellow-600 dark:text-[#fb8f24] rounded-xl border border-yellow-100 dark:border-[#fb8f24]/20 shadow-sm dark:shadow-[0_0_15px_rgba(251,143,36,0.1)]"><DollarSign className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-[#8b949e]">Total Cost</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-[#e6edf3] tracking-tight">
                <FormattedCurrency value={stats.totalCost} />
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CostGraph logs={allLogs} />
        </div>
        <div className="lg:col-span-1">
          <GlobeWrapper />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[#e6edf3]">Recent Activity</h3>
        <div className="rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden shadow-sm transition-colors duration-200">
          {recentLogs.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-[#30363d]">
              {recentLogs.map((log: any, i: number) => {
                const isPositive = log.sentiment?.toLowerCase().includes("positive");
                const isNegative = log.sentiment?.toLowerCase().includes("negative");
                
                return (
                  <Link href={`/logs/${log.id}`} key={i} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#21262d] transition-all group border-l-4 border-transparent hover:border-blue-500 dark:hover:border-[#2f81f7]">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        log.direction === "inbound" ? "bg-blue-50 text-blue-600 dark:bg-[#2f81f7]/10 dark:text-[#2f81f7]" : "bg-purple-50 text-purple-600 dark:bg-[#a371f7]/10 dark:text-[#a371f7]"
                      }`}>
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-[#e6edf3]">{log.phone_number}</p>
                          <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-[#8b949e] font-medium bg-gray-100 dark:bg-[#30363d] px-2 py-0.5 rounded-sm">{log.mode}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-[#8b949e] max-w-xl truncate mt-1">{log.summary}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-[#e6edf3]">{log.duration}s</p>
                        <p className="text-xs text-gray-500 dark:text-[#8b949e]">{log.cost}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${
                        isPositive ? "bg-green-50 text-green-600 border-green-200 dark:bg-[#2ea043]/10 dark:text-[#2ea043] dark:border-[#2ea043]/30" :
                        isNegative ? "bg-red-50 text-red-600 border-red-200 dark:bg-[#da3633]/10 dark:text-[#da3633] dark:border-[#da3633]/30" :
                        "bg-gray-100 text-gray-600 border-gray-200 dark:bg-[#8b949e]/10 dark:text-[#8b949e] dark:border-[#8b949e]/30"
                      }`}>
                        {log.sentiment || "Neutral"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-[#8b949e] w-24 text-right font-mono">
                        {new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#8b949e] group-hover:text-gray-900 dark:group-hover:text-[#e6edf3] group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-[#8b949e] flex flex-col items-center">
              <Activity className="w-12 h-12 text-gray-300 dark:text-[#30363d] mb-4" />
              <p>No recent activity found. Make a call to see data here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
