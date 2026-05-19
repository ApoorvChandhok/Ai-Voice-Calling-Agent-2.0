"use client";

import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useAppContext } from "./app-provider";

export default function CostGraph({ logs }: { logs: any[] }) {
  const { formatCurrency } = useAppContext();
  const [zoomLevel, setZoomLevel] = useState<"daily" | "hourly">("daily");

  const data = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    logs.forEach(log => {
      const date = new Date(log.timestamp);
      // Group by Day or Hour based on zoomLevel
      const key = zoomLevel === "daily" 
        ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

      const costValue = parseFloat(log.cost?.replace('$', '') || "0");
      grouped[key] = (grouped[key] || 0) + costValue;
    });

    // Convert to array and sort chronologically (assuming keys are somewhat sortable or we just keep chronological order)
    // To keep it simple, we sort logs first and then group, so keys are naturally chronological if we iterate backwards.
    return Object.entries(grouped).map(([time, cost]) => ({
      time,
      cost
    })).reverse(); // Reverse if logs are newest-first
  }, [logs, zoomLevel]);

  return (
    <div className="w-full h-full bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl p-5 shadow-sm transition-colors duration-200 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3]">Cost Estimation</h3>
          <p className="text-xs text-gray-500 dark:text-[#8b949e]">Credit usage over time</p>
        </div>
        <div className="flex items-center bg-gray-100 dark:bg-[#0d1117] p-1 rounded-lg border border-gray-200 dark:border-[#30363d]">
          <button 
            onClick={() => setZoomLevel("daily")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${zoomLevel === "daily" ? "bg-white dark:bg-[#21262d] text-gray-900 dark:text-[#e6edf3] shadow-sm" : "text-gray-500 dark:text-[#8b949e] hover:text-gray-700 dark:hover:text-[#e6edf3]"}`}
          >
            Daily
          </button>
          <button 
            onClick={() => setZoomLevel("hourly")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${zoomLevel === "hourly" ? "bg-white dark:bg-[#21262d] text-gray-900 dark:text-[#e6edf3] shadow-sm" : "text-gray-500 dark:text-[#8b949e] hover:text-gray-700 dark:hover:text-[#e6edf3]"}`}
          >
            Hourly
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[250px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2f81f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2f81f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#8b949e' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#8b949e' }} 
                tickFormatter={(val) => formatCurrency(val)}
              />
              <CartesianGrid vertical={false} stroke="#30363d" strokeDasharray="4 4" opacity={0.4} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '8px', color: '#e6edf3' }}
                itemStyle={{ color: '#2f81f7', fontWeight: 600 }}
                formatter={(value: number) => [formatCurrency(value), "Cost"]}
              />
              <Area type="monotone" dataKey="cost" stroke="#2f81f7" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-[#8b949e]">
            No cost data available for the selected period.
          </div>
        )}
      </div>
    </div>
  );
}
