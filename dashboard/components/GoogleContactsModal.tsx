"use client";

import { useState } from "react";
import { Users, X } from "lucide-react";

export default function GoogleContactsModal({ onClose, onImport }: { onClose: () => void, onImport: () => void }) {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = () => {
    setIsImporting(true);
    // Simulate API request
    setTimeout(() => {
      setIsImporting(false);
      onImport();
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-[#30363d]">
          <h3 className="font-semibold text-gray-900 dark:text-[#e6edf3] flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#4285F4]" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Import from Google Contacts
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-[#21262d] rounded-md text-gray-500 dark:text-[#8b949e]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-[#2f81f7]/10 text-blue-800 dark:text-[#2f81f7] rounded-lg text-sm border border-blue-200 dark:border-[#2f81f7]/20 flex gap-3 items-start">
             <Users className="w-5 h-5 shrink-0 mt-0.5" />
             <p>This will connect your Google Account and import contacts into the Lead CRM. (Note: This is a simulated flow until Client ID is provided).</p>
          </div>
        </div>
        <div className="p-5 border-t border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-[#8b949e] hover:bg-gray-200 dark:hover:bg-[#21262d] rounded-lg transition-colors border border-transparent"
          >
            Cancel
          </button>
          <button 
            onClick={handleImport}
            disabled={isImporting}
            className="px-4 py-2 text-sm font-medium bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Importing...
              </>
            ) : "Connect & Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
