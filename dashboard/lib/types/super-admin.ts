// Types for the Super Admin control plane

export interface WorkspaceRow {
  id:               string
  name:             string
  slug:             string | null
  phone_number:     string | null
  is_active:        boolean
  created_at:       string
  owner_email:      string | null
  owner_name:       string | null

  // SIP / LiveKit config
  livekit_trunk_id:    string | null
  inbound_trunk_id:    string | null
  vobiz_did_number:    string | null
  dispatch_rule_id:    string | null
  agent_name_outbound: string | null
  agent_name_inbound:  string | null

  // Billing rates (charged to client)
  rate_outbound_per_min: number
  rate_inbound_per_min:  number
  stt_rate_per_min:      number
  tts_rate_per_min:      number

  // 7-day call stats (from weekly_workspace_spend view)
  total_calls:     number
  total_minutes:   number
  total_spend_usd: number
  inbound_calls:   number
  outbound_calls:  number

  // Lifetime stats
  lifetime_calls:     number
  lifetime_mins:      number
  lifetime_completed: number
}

export interface WorkspaceConfig {
  id:                  string
  business_id:         string
  livekit_trunk_id:    string | null
  inbound_trunk_id:    string | null
  dispatch_rule_id:    string | null
  vobiz_did_number:    string | null
  sip_domain:          string | null
  agent_name_outbound: string | null
  agent_name_inbound:  string | null
  created_at:          string
  updated_at:          string
}

export interface BillingRates {
  business_id:          string
  rate_outbound_per_min: number
  rate_inbound_per_min:  number
  stt_rate_per_min:      number
  tts_rate_per_min:      number
  llm_rate_per_token:    number
  livekit_rate_per_min:  number
  updated_at:            string
}
