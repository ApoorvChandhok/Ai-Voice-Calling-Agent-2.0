import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SipClient } from 'livekit-server-sdk'

export const dynamic = 'force-dynamic'

function getSipClient() {
  return new SipClient(
    process.env.LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
  )
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  // ── Auth + role guard ────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse body ───────────────────────────────────────────────────────────────
  const { workspace_id } = await request.json()
  if (!workspace_id) {
    return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
  }

  // ── Guard: never allow deleting the archive / super-admin placeholder tenant ─
  if (workspace_id === '00000000-0000-0000-0000-000000000000') {
    return NextResponse.json({ error: 'Cannot delete the system workspace.' }, { status: 403 })
  }

  // ── Fetch workspace_config to get LiveKit trunk IDs ──────────────────────────
  const { data: config } = await supabase
    .from('workspace_config')
    .select('livekit_trunk_id, inbound_trunk_id, dispatch_rule_id')
    .eq('business_id', workspace_id)
    .maybeSingle()

  // ── 1. Clean up LiveKit resources (best-effort, non-fatal) ───────────────────
  const livekitWarnings: string[] = []
  if (config) {
    const sip = getSipClient()

    if (config.dispatch_rule_id) {
      try {
        await sip.deleteSipDispatchRule(config.dispatch_rule_id)
      } catch (e) {
        livekitWarnings.push(`dispatch rule: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    if (config.inbound_trunk_id) {
      try {
        await sip.deleteSipTrunk(config.inbound_trunk_id)
      } catch (e) {
        livekitWarnings.push(`inbound trunk: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    if (config.livekit_trunk_id) {
      try {
        await sip.deleteSipTrunk(config.livekit_trunk_id)
      } catch (e) {
        livekitWarnings.push(`outbound trunk: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }

  // ── 2. Audit log — record before deletion so there's a trail ─────────────────
  await supabase.from('admin_audit_log').insert({
    actor_id: user.id,
    action:   'delete_workspace',
    target:   workspace_id,
    metadata: {
      livekit_trunk_id:  config?.livekit_trunk_id ?? null,
      inbound_trunk_id:  config?.inbound_trunk_id ?? null,
      dispatch_rule_id:  config?.dispatch_rule_id ?? null,
      livekit_warnings:  livekitWarnings,
    },
  })

  // ── 3. Delete DB rows (cascade order matters for FK constraints) ──────────────
  // workspace_config → workspace_billing_rates → profiles → businesses
  // call_logs, leads, workflows, agent_configs are scoped by business_id FK
  await supabase.from('workspace_config').delete().eq('business_id', workspace_id)
  await supabase.from('workspace_billing_rates').delete().eq('business_id', workspace_id)

  // Profiles: delete profile rows belonging to this workspace
  await supabase.from('profiles').delete().eq('business_id', workspace_id)

  // Delete the business record itself (cascades to any remaining FK-linked rows)
  const { error: bizDeleteError } = await supabase
    .from('businesses')
    .delete()
    .eq('id', workspace_id)

  if (bizDeleteError) {
    return NextResponse.json(
      { error: `Failed to delete workspace: ${bizDeleteError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    livekit_warnings: livekitWarnings.length ? livekitWarnings : undefined,
  })
}
