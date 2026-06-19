'use client'

import { useEffect, useRef } from 'react'
import type { WorkspaceRow } from '@/lib/types/super-admin'

interface Props {
  workspace: WorkspaceRow
  onClose: () => void
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/[0.05]">
      <span className="text-xs text-white/35 uppercase tracking-wider font-medium shrink-0 pt-0.5">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}

function Mono({ value, fallback = '—' }: { value?: string | null; fallback?: string }) {
  if (!value) return <span className="text-white/20 text-xs">{fallback}</span>
  return (
    <span className="font-mono text-[11px] text-violet-300/80 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/15 break-all">
      {value}
    </span>
  )
}

function CopyButton({ value }: { value: string }) {
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {})
  }
  return (
    <button
      onClick={copy}
      title="Copy"
      className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded hover:bg-white/[0.08] text-white/30 hover:text-white/60 transition-all align-middle"
    >
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3.5" y="3.5" width="6" height="6" rx="1"/>
        <path d="M1.5 7.5V2a.5.5 0 0 1 .5-.5h5.5"/>
      </svg>
    </button>
  )
}

function StatPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      <span className={`text-base font-bold ${color ?? 'text-white'}`}>{value}</span>
      <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────

export default function WorkspaceDrawer({ workspace: ws, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const spendColor = ws.total_spend_usd > 10 ? 'text-red-400' : ws.total_spend_usd > 3 ? 'text-amber-400' : 'text-emerald-400'

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 z-[90] h-full w-full max-w-md bg-[#0e0e1c] border-l border-white/[0.08] shadow-2xl flex flex-col"
        style={{ animation: 'slideIn 0.22s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">{ws.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {ws.slug && (
                <span className="text-[11px] font-mono text-white/30">/{ws.slug}</span>
              )}
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                ws.is_active
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                <span className={`w-1 h-1 rounded-full ${ws.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}/>
                {ws.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all shrink-0 mt-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* 7-day stat pills */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/25 mb-2 font-medium">7-Day Activity</p>
            <div className="grid grid-cols-4 gap-2">
              <StatPill label="Spend" value={`$${ws.total_spend_usd.toFixed(3)}`} color={spendColor} />
              <StatPill label="Calls"  value={ws.total_calls}                       color="text-sky-300"     />
              <StatPill label="Out"    value={ws.outbound_calls}                    color="text-violet-300"  />
              <StatPill label="Min"    value={ws.total_minutes.toFixed(1)}          color="text-white/70"    />
            </div>
          </div>

          {/* Lifetime stats */}
          {ws.lifetime_calls > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/25 mb-2 font-medium">Lifetime</p>
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="Total Calls"  value={ws.lifetime_calls}                      color="text-white/70" />
                <StatPill label="Completed"    value={ws.lifetime_completed}                  color="text-emerald-400" />
                <StatPill label="Total Min"    value={ws.lifetime_mins.toFixed(1)}             color="text-white/50" />
              </div>
            </div>
          )}

          {/* SIP / Trunk config */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1 font-medium">SIP Configuration</p>
            <Row label="Outbound Trunk">
              <div className="flex items-center justify-end">
                <Mono value={ws.livekit_trunk_id} />
                {ws.livekit_trunk_id && <CopyButton value={ws.livekit_trunk_id} />}
              </div>
            </Row>
            <Row label="Inbound Trunk">
              <div className="flex items-center justify-end">
                <Mono value={ws.inbound_trunk_id} />
                {ws.inbound_trunk_id && <CopyButton value={ws.inbound_trunk_id} />}
              </div>
            </Row>
            <Row label="DID Number">
              <div className="flex items-center justify-end">
                <span className="text-xs font-mono text-white/70">{ws.vobiz_did_number ?? '—'}</span>
                {ws.vobiz_did_number && <CopyButton value={ws.vobiz_did_number} />}
              </div>
            </Row>
            <Row label="Dispatch Rule">
              <div className="flex items-center justify-end">
                <Mono value={ws.dispatch_rule_id} fallback="Not provisioned" />
                {ws.dispatch_rule_id && <CopyButton value={ws.dispatch_rule_id} />}
              </div>
            </Row>
          </div>

          {/* Agent workers */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1 font-medium">Agent Workers</p>
            <Row label="Outbound">
              <span className="text-xs font-mono text-white/60">{ws.agent_name_outbound ?? 'outbound-caller'}</span>
            </Row>
            <Row label="Inbound">
              <span className="text-xs font-mono text-white/60">{ws.agent_name_inbound ?? 'inbound-caller'}</span>
            </Row>
          </div>

          {/* Billing rates */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1 font-medium">Billing Rates (charged to client)</p>
            <Row label="Outbound">
              <span className="text-xs text-white/70 font-mono">
                ${ws.rate_outbound_per_min.toFixed(4)} / min
              </span>
            </Row>
            <Row label="Inbound">
              <span className="text-xs text-white/70 font-mono">
                ${ws.rate_inbound_per_min.toFixed(4)} / min
              </span>
            </Row>
            <Row label="STT (Deepgram)">
              <span className="text-xs text-white/40 font-mono">${ws.stt_rate_per_min.toFixed(4)} / min</span>
            </Row>
            <Row label="TTS (Sarvam)">
              <span className="text-xs text-white/40 font-mono">${ws.tts_rate_per_min.toFixed(4)} / min</span>
            </Row>
          </div>

          {/* Admin info */}
          {ws.owner_email && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1 font-medium">Primary Admin</p>
              {ws.owner_name && (
                <Row label="Name">
                  <span className="text-xs text-white/60">{ws.owner_name}</span>
                </Row>
              )}
              <Row label="Email">
                <span className="text-xs text-white/60">{ws.owner_email}</span>
              </Row>
            </div>
          )}

          {/* Cost formula note */}
          <p className="text-[10px] text-white/15 leading-relaxed">
            Spend = (out × $0.020 + in × $0.010) + (STT $0.0043 + TTS $0.0040 + LK $0.0010)/min + LLM tokens × $0.0000006
          </p>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-white/[0.06] px-5 py-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/[0.1] text-white/50 text-sm hover:bg-white/[0.04] hover:text-white/70 transition-all"
          >
            Close
          </button>
          <button
            className="flex-1 py-2 rounded-lg bg-violet-600/80 hover:bg-violet-500 text-white text-sm font-medium transition-all opacity-50 cursor-not-allowed"
            title="Edit config coming in Phase 3"
            disabled
          >
            Edit Config
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
