"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import GoogleContactsModal from "./GoogleContactsModal";

export default function LeadsClientWrapper({ initialLeads }: { initialLeads: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasImported, setHasImported] = useState(false);

  const handleImport = () => {
    setHasImported(true);
  };

  // Mock mapped names from "Google Contacts"
  const getMappedContact = (phone: string, originalName: string) => {
    if (!hasImported) return { name: originalName, isMapped: false };
    
    // Simulate contact mapping for a few random numbers based on a hash
    const sum = phone.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    if (sum % 3 === 0) {
      return { name: `G-Contact: ${originalName || 'Friend'}`, isMapped: true };
    }
    return { name: originalName, isMapped: false };
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-[#e6edf3]">Leads CRM</h2>
          <p className="text-gray-500 dark:text-[#8b949e]">Contact information captured by the inbound AI agent.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded-lg text-sm font-medium text-gray-700 dark:text-[#e6edf3] hover:bg-gray-50 dark:hover:bg-[#30363d] transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
             <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
             <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
             <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
             <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {hasImported ? "Synced with Google Contacts" : "Import Google Contacts"}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-sm flex-1 overflow-hidden flex flex-col transition-colors duration-200 mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-[#8b949e] uppercase bg-gray-50 dark:bg-[#0d1117] border-b border-gray-200 dark:border-[#30363d] transition-colors duration-200">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Captured Date</th>
                <th className="px-6 py-4 font-medium tracking-wider">Contact Info</th>
                <th className="px-6 py-4 font-medium tracking-wider">City</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#30363d]">
              {initialLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-gray-500 dark:text-[#8b949e]">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-8 h-8 mb-3 text-gray-300 dark:text-[#30363d]" />
                      No leads captured yet. The agent will save them here automatically.
                    </div>
                  </td>
                </tr>
              ) : (
                initialLeads.map((lead: any, idx: number) => {
                  const mapped = getMappedContact(lead.phone, lead.name);
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-[#8b949e]">
                        {new Date(lead.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`font-medium ${mapped.isMapped ? "text-blue-600 dark:text-[#2f81f7]" : "text-gray-900 dark:text-[#e6edf3]"}`}>
                            {mapped.name || "Unknown Caller"}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-[#8b949e] mt-0.5">{lead.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-[#8b949e]">
                        {lead.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium border bg-blue-50 text-blue-600 border-blue-200 dark:bg-[#2f81f7]/10 dark:text-[#2f81f7] dark:border-[#2f81f7]/20">
                          New Lead
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <GoogleContactsModal 
          onClose={() => setIsModalOpen(false)} 
          onImport={handleImport} 
        />
      )}
    </>
  );
}
