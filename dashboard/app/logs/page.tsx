import { getCallLogs } from "@/lib/actions";
import { Activity, Play, Volume2 } from "lucide-react";
import Link from "next/link";
import path from "path";

const AGENT_DID = "918065480288";
const USD_TO_INR = 95;

function getCallerNumber(log: any): string {
  // For inbound: caller_id is the person calling in, phone_number is the agent DID
  // For outbound: phone_number is the destination
  // Always show the OTHER party's number, never the agent DID
  if (log.caller_number) return log.caller_number;
  if (log.caller_id && log.caller_id.replace("+", "") !== AGENT_DID) return log.caller_id;
  if (log.phone_number && log.phone_number.replace("+", "") !== AGENT_DID) return log.phone_number;
  return log.phone_number || "Unknown";
}

function costToINR(cost: string | undefined): string {
  if (!cost) return "₹0.00";
  const usd = parseFloat(cost.replace("$", "")) || 0;
  return `₹${(usd * USD_TO_INR).toFixed(2)}`;
}

export default async function LogsPage() {
  const logs = await getCallLogs();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#e6edf3]">Call Logs</h2>
        <p className="text-[#8b949e]">Transcripts, summaries, and sentiment analysis of all completed calls.</p>
      </div>

      <div className="rounded-xl border border-[#30363d] bg-[#161b22] shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#8b949e] uppercase bg-[#0d1117] border-b border-[#30363d]">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Timestamp</th>
                <th className="px-6 py-4 font-medium tracking-wider">Status & Mode</th>
                <th className="px-6 py-4 font-medium tracking-wider">Phone Number</th>
                <th className="px-6 py-4 font-medium tracking-wider">Metrics</th>
                <th className="px-6 py-4 font-medium tracking-wider">Sentiment</th>
                <th className="px-6 py-4 font-medium tracking-wider">Recording</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[#8b949e]">
                    <div className="flex flex-col items-center justify-center">
                      <Activity className="w-8 h-8 mb-3 text-[#30363d]" />
                      No calls logged yet. Complete a call to generate analytics.
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log: any, idx: number) => {
                  const isPositive = log.sentiment?.toLowerCase().includes("positive");
                  const isNegative = log.sentiment?.toLowerCase().includes("negative");
                  const callerNumber = getCallerNumber(log);
                  const costINR = costToINR(log.cost);
                  const hasRecording = !!(log.recording_path || log.sip_call_id);
                  const recordingUrl = log.recording_path 
                    ? `/api/recordings/${path.basename(log.recording_path)}` 
                    : `/api/recordings/${log.sip_call_id || log.id}.wav`;

                  return (
                    <tr key={idx} className="hover:bg-[#21262d] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-[#e6edf3]">
                        {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-[#2ea043]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#2ea043]"></div>
                            {log.status || "Completed"}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold border inline-flex w-fit ${
                            log.direction === "inbound" ? "bg-[#2f81f7]/10 text-[#2f81f7] border-[#2f81f7]/20" : "bg-[#a371f7]/10 text-[#a371f7] border-[#a371f7]/20"
                          }`}>
                            {log.mode || "Voice Agent"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-[#e6edf3]">
                        {callerNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="text-[#8b949e]">Dur: <span className="text-[#e6edf3] font-medium">{log.duration}s</span></span>
                          <span className="text-[#8b949e]">MOS: <span className="text-[#e6edf3] font-medium">{log.mos}</span></span>
                          <span className="text-[#8b949e]">Cost: <span className="text-[#e6edf3] font-medium">{costINR}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm ${
                          isPositive ? "bg-[#2ea043]/10 text-[#2ea043] border-[#2ea043]/30" :
                          isNegative ? "bg-[#da3633]/10 text-[#da3633] border-[#da3633]/30" :
                          "bg-[#8b949e]/10 text-[#8b949e] border-[#8b949e]/30"
                        }`}>
                          {log.sentiment || "Neutral"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasRecording ? (
                          <Link
                            href={`/logs/${log.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#2f81f7] bg-[#2f81f7]/10 border border-[#2f81f7]/20 rounded-md hover:bg-[#2f81f7]/20 transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            {log.duration ? `${log.duration}s` : "Play"}
                          </Link>
                        ) : (
                          <span className="text-[#30363d] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                         <Link href={`/logs/${log.id}`} className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#21262d] border border-[#30363d] rounded-md hover:bg-[#30363d] transition-colors">
                           <Play className="w-4 h-4" />
                           View
                         </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
