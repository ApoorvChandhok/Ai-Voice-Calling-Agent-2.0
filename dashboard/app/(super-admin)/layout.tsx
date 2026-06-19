import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Minimal super-admin layout — no sidebar, no copilot.
// Has its own navigation strip with "Exit to Dashboard" button.
export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Server-side role enforcement (middleware also enforces this, defense-in-depth)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/?error=unauthorized')

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top Nav Bar */}
      <header className="border-b border-white/[0.06] bg-[#0f0f1a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Platform badge */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="7" cy="7" r="2" fill="white"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-white/90">Control Plane</span>
            </div>
            <div className="w-px h-4 bg-white/10"/>
            <span className="text-xs text-white/40 font-mono">{profile?.email}</span>
          </div>

          <a
            href="/"
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors group"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="group-hover:-translate-x-0.5 transition-transform">
              <path d="M8 1L3 6L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
            Exit to Dashboard
          </a>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
