"use client";

import { clearImpersonationCookie } from "@/app/(super-admin)/super-admin/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ImpersonationBanner({ workspaceName }: { workspaceName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleExit = async () => {
    setLoading(true);
    await clearImpersonationCookie();
    router.push("/super-admin");
    router.refresh();
  };

  return (
    <div className="bg-violet-600/90 text-white px-4 py-2 flex items-center justify-between text-sm z-50 relative shrink-0">
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
        </svg>
        <span className="font-medium">Super Admin Mode</span>
        <span className="opacity-80">— Viewing as:</span>
        <strong className="font-semibold">{workspaceName}</strong>
      </div>
      <button 
        onClick={handleExit}
        disabled={loading}
        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors font-medium active:scale-95 flex items-center gap-2"
      >
        {loading ? (
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
             <path d="M21 12a9 9 0 1 1-6.219-8.56" />
           </svg>
        ) : "Exit to Admin Panel"}
      </button>
    </div>
  );
}
