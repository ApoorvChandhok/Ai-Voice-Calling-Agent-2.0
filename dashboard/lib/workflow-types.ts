// ============================================================================
// Workflow Automation Types
// ============================================================================

// ── Trigger Types ────────────────────────────────────────────────────────────

export type TriggerType =
  | "new_lead"
  | "call_completed"
  | "scheduled"
  | "webhook_received"
  | "lead_status_changed"
  | "form_submitted"
  | "lead_tag_added"
  | "sentiment_detected"
  | "manual_trigger";

export interface TriggerConfig {
  // new_lead: no extra config needed
  // call_completed: optional filters
  callDirection?: "inbound" | "outbound" | "any";
  // scheduled
  cronExpression?: string;
  scheduleDescription?: string;
  // webhook_received
  webhookPath?: string;
  // lead_status_changed
  fromStatus?: string;
  toStatus?: string;
  // form_submitted
  formId?: string;
  // lead_tag_added
  tagName?: string;
  // sentiment_detected
  sentimentType?: "positive" | "negative" | "neutral";
}

// ── Action Types ─────────────────────────────────────────────────────────────

export type ActionType =
  | "send_gmail"
  | "send_whatsapp"
  | "update_lead_status"
  | "add_tag"
  | "remove_tag"
  | "trigger_outbound_call"
  | "http_webhook"
  | "add_note"
  | "send_notification"
  | "send_to_sheets"
  | "create_calendar_event"
  | "wait_delay";

export interface GmailConfig {
  to: string;       // e.g. "{{lead.email}}" or static email
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface WhatsAppConfig {
  phoneNumber: string; // e.g. "{{lead.phone}}" or static number
  message: string;
  mediaUrl?: string;
}

export interface UpdateLeadStatusConfig {
  newStatus: string;  // "New" | "Contacted" | "Qualified" | "Interested" | "Converted" | "Lost"
}

export interface TagConfig {
  tagName: string;
}

export interface OutboundCallConfig {
  phoneNumber: string; // "{{lead.phone}}" or static
  agentConfig?: string; // reference to an agent config
  message?: string;
}

export interface HttpWebhookConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: string; // JSON template string
}

export interface NoteConfig {
  noteText: string;
}

export interface NotificationConfig {
  channel: "in_app" | "email" | "both";
  message: string;
  recipient?: string; // email or user id
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  rowData: Record<string, string>; // column -> template value
}

export interface CalendarEventConfig {
  title: string;
  description?: string;
  durationMinutes: number;
  delayFromTrigger?: number; // hours from trigger time
  attendees?: string[];
}

export interface WaitDelayConfig {
  duration: number;
  unit: "minutes" | "hours" | "days";
}

// ── Condition Types ──────────────────────────────────────────────────────────

export type ConditionType =
  | "if_else"
  | "filter_by_tag"
  | "check_lead_field"
  | "check_call_count"
  | "check_sentiment";

export interface IfElseConfig {
  field: string;      // e.g. "lead.city", "lead.status", "call.sentiment"
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty";
  value: string;
}

export interface FilterByTagConfig {
  tagName: string;
  hasTag: boolean;  // true = must have tag, false = must NOT have tag
}

export interface CheckLeadFieldConfig {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "is_empty" | "is_not_empty";
  value: string;
}

export interface CheckCallCountConfig {
  operator: "greater_than" | "less_than" | "equals";
  value: number;
}

export interface CheckSentimentConfig {
  sentiment: "positive" | "negative" | "neutral";
}

// ── Union Config Type ────────────────────────────────────────────────────────

export type NodeConfig =
  | TriggerConfig
  | GmailConfig
  | WhatsAppConfig
  | UpdateLeadStatusConfig
  | TagConfig
  | OutboundCallConfig
  | HttpWebhookConfig
  | NoteConfig
  | NotificationConfig
  | GoogleSheetsConfig
  | CalendarEventConfig
  | WaitDelayConfig
  | IfElseConfig
  | FilterByTagConfig
  | CheckLeadFieldConfig
  | CheckCallCountConfig
  | CheckSentimentConfig;

// ── Node Types ───────────────────────────────────────────────────────────────

export type NodeCategory = "trigger" | "action" | "condition";

export interface WorkflowNode {
  id: string;
  type: TriggerType | ActionType | ConditionType;
  category: NodeCategory;
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePort?: "default" | "yes" | "no"; // for condition nodes
  label?: string;
}

// ── Workflow ─────────────────────────────────────────────────────────────────

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  industry?: string; // optional label for filtering
}

// ── Node Metadata (for palette rendering) ────────────────────────────────────

export interface NodeMetadata {
  type: TriggerType | ActionType | ConditionType;
  category: NodeCategory;
  label: string;
  description: string;
  icon: string; // lucide icon name
  color: string; // accent color
  defaultConfig: Record<string, any>;
}

// ── All available node definitions ───────────────────────────────────────────

export const TRIGGER_NODES: NodeMetadata[] = [
  {
    type: "manual_trigger",
    category: "trigger",
    label: "On Manual Run",
    description: "Fires when you manually click 'Run Workflow'",
    icon: "Play",
    color: "#3fb950",
    defaultConfig: {},
  },
  {
    type: "new_lead",
    category: "trigger",
    label: "New Lead Captured",
    description: "Fires when a new lead is captured by the AI agent",
    icon: "UserPlus",
    color: "#3fb950",
    defaultConfig: {},
  },
  {
    type: "call_completed",
    category: "trigger",
    label: "Call Completed",
    description: "Fires when an inbound or outbound call ends",
    icon: "PhoneOff",
    color: "#3fb950",
    defaultConfig: { callDirection: "any" },
  },
  {
    type: "scheduled",
    category: "trigger",
    label: "Scheduled / Cron",
    description: "Fires on a recurring schedule or specific time",
    icon: "Clock",
    color: "#3fb950",
    defaultConfig: { cronExpression: "0 9 * * *", scheduleDescription: "Every day at 9:00 AM" },
  },
  {
    type: "webhook_received",
    category: "trigger",
    label: "Webhook Received",
    description: "Fires when an external webhook hits your endpoint",
    icon: "Webhook",
    color: "#3fb950",
    defaultConfig: { webhookPath: "/api/webhook/custom" },
  },
  {
    type: "lead_status_changed",
    category: "trigger",
    label: "Lead Status Changed",
    description: "Fires when a lead's status is updated",
    icon: "RefreshCw",
    color: "#3fb950",
    defaultConfig: { fromStatus: "any", toStatus: "any" },
  },
  {
    type: "form_submitted",
    category: "trigger",
    label: "Form Submitted",
    description: "Fires when a web form or landing page form is submitted",
    icon: "FileText",
    color: "#3fb950",
    defaultConfig: {},
  },
  {
    type: "lead_tag_added",
    category: "trigger",
    label: "Lead Tag Added",
    description: "Fires when a specific tag is added to a lead",
    icon: "Tag",
    color: "#3fb950",
    defaultConfig: { tagName: "" },
  },
  {
    type: "sentiment_detected",
    category: "trigger",
    label: "Sentiment Detected",
    description: "Fires when a specific sentiment is detected in a call",
    icon: "Heart",
    color: "#3fb950",
    defaultConfig: { sentimentType: "positive" },
  },
];

export const CONDITION_NODES: NodeMetadata[] = [
  {
    type: "if_else",
    category: "condition",
    label: "If / Else",
    description: "Branch workflow based on a condition",
    icon: "GitBranch",
    color: "#d29922",
    defaultConfig: { field: "lead.city", operator: "equals", value: "" },
  },
  {
    type: "filter_by_tag",
    category: "condition",
    label: "Filter by Tag",
    description: "Continue only if lead has (or doesn't have) a specific tag",
    icon: "Filter",
    color: "#d29922",
    defaultConfig: { tagName: "", hasTag: true },
  },
  {
    type: "check_lead_field",
    category: "condition",
    label: "Check Lead Field",
    description: "Check a lead's field value before continuing",
    icon: "Search",
    color: "#d29922",
    defaultConfig: { field: "lead.name", operator: "is_not_empty", value: "" },
  },
  {
    type: "check_call_count",
    category: "condition",
    label: "Check Call Count",
    description: "Branch based on number of calls with this lead",
    icon: "Hash",
    color: "#d29922",
    defaultConfig: { operator: "greater_than", value: 1 },
  },
  {
    type: "check_sentiment",
    category: "condition",
    label: "Check Sentiment",
    description: "Branch based on the call sentiment analysis",
    icon: "Smile",
    color: "#d29922",
    defaultConfig: { sentiment: "positive" },
  },
];

export const ACTION_NODES: NodeMetadata[] = [
  {
    type: "send_gmail",
    category: "action",
    label: "Send Gmail",
    description: "Send an email via Gmail",
    icon: "Mail",
    color: "#2f81f7",
    defaultConfig: { to: "{{lead.email}}", subject: "", body: "" },
  },
  {
    type: "send_whatsapp",
    category: "action",
    label: "Send WhatsApp",
    description: "Send a WhatsApp message",
    icon: "MessageCircle",
    color: "#25d366",
    defaultConfig: { phoneNumber: "{{lead.phone}}", message: "" },
  },
  {
    type: "update_lead_status",
    category: "action",
    label: "Update Lead Status",
    description: "Change the lead's status in CRM",
    icon: "UserCheck",
    color: "#2f81f7",
    defaultConfig: { newStatus: "Contacted" },
  },
  {
    type: "add_tag",
    category: "action",
    label: "Add Tag",
    description: "Add a tag/label to the lead",
    icon: "TagIcon",
    color: "#2f81f7",
    defaultConfig: { tagName: "" },
  },
  {
    type: "remove_tag",
    category: "action",
    label: "Remove Tag",
    description: "Remove a tag/label from the lead",
    icon: "XCircle",
    color: "#2f81f7",
    defaultConfig: { tagName: "" },
  },
  {
    type: "trigger_outbound_call",
    category: "action",
    label: "Trigger Outbound Call",
    description: "Initiate an AI-powered outbound call",
    icon: "PhoneOutgoing",
    color: "#2f81f7",
    defaultConfig: { phoneNumber: "{{lead.phone}}", message: "" },
  },
  {
    type: "http_webhook",
    category: "action",
    label: "HTTP Webhook",
    description: "Send data to an external URL",
    icon: "Globe",
    color: "#8b5cf6",
    defaultConfig: { url: "", method: "POST", body: "" },
  },
  {
    type: "add_note",
    category: "action",
    label: "Add Note to Lead",
    description: "Attach a note or comment to the lead",
    icon: "StickyNote",
    color: "#2f81f7",
    defaultConfig: { noteText: "" },
  },
  {
    type: "send_notification",
    category: "action",
    label: "Send Notification",
    description: "Send an in-app or email notification to your team",
    icon: "Bell",
    color: "#2f81f7",
    defaultConfig: { channel: "in_app", message: "" },
  },
  {
    type: "send_to_sheets",
    category: "action",
    label: "Send to Google Sheets",
    description: "Append lead data to a Google Sheet",
    icon: "Sheet",
    color: "#34a853",
    defaultConfig: { spreadsheetId: "", sheetName: "Sheet1", rowData: {} },
  },
  {
    type: "create_calendar_event",
    category: "action",
    label: "Create Calendar Event",
    description: "Create a Google Calendar event for follow-up",
    icon: "Calendar",
    color: "#2f81f7",
    defaultConfig: { title: "", durationMinutes: 30, delayFromTrigger: 24 },
  },
  {
    type: "wait_delay",
    category: "action",
    label: "Wait / Delay",
    description: "Pause the workflow for a specified duration",
    icon: "Timer",
    color: "#8b949e",
    defaultConfig: { duration: 1, unit: "hours" },
  },
];

export const ALL_NODE_METADATA: NodeMetadata[] = [
  ...TRIGGER_NODES,
  ...CONDITION_NODES,
  ...ACTION_NODES,
];

export function getNodeMetadata(type: string): NodeMetadata | undefined {
  return ALL_NODE_METADATA.find((n) => n.type === type);
}
