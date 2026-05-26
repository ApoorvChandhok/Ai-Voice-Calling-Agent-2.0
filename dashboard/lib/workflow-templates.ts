import type { Workflow } from "./workflow-types";

// ── Pre-built Workflow Templates ─────────────────────────────────────────────

export interface WorkflowTemplate {
  name: string;
  description: string;
  industry: string;
  icon: string;
  gradient: string;
  workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt">;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    name: "Welcome Email to New Lead",
    description: "Automatically send a personalized thank-you email when a new lead is captured by the AI agent.",
    industry: "Universal",
    icon: "Mail",
    gradient: "from-blue-500 to-cyan-500",
    workflow: {
      name: "Welcome Email to New Lead",
      description: "Send a personalized thank-you email when a new lead is captured",
      isActive: false,
      nodes: [
        {
          id: "trigger_1",
          type: "new_lead",
          category: "trigger",
          label: "New Lead Captured",
          config: {},
          position: { x: 300, y: 80 },
        },
        {
          id: "action_1",
          type: "send_gmail",
          category: "action",
          label: "Send Welcome Email",
          config: {
            to: "{{lead.email}}",
            subject: "Welcome, {{lead.name}}! Thank you for your interest",
            body: "Hi {{lead.name}},\n\nThank you for reaching out to us! We're thrilled to connect with you.\n\nOur team will be in touch shortly to assist you further.\n\nBest regards,\nThe Team",
          },
          position: { x: 300, y: 260 },
        },
      ],
      edges: [
        { id: "edge_1", sourceId: "trigger_1", targetId: "action_1" },
      ],
    },
  },
  {
    name: "Lead Qualification Pipeline",
    description: "Qualify leads based on their city, update status, and send a WhatsApp message to qualified leads.",
    industry: "Automotive",
    icon: "GitBranch",
    gradient: "from-amber-500 to-orange-500",
    workflow: {
      name: "Lead Qualification Pipeline",
      description: "Qualify leads based on city and send WhatsApp to qualified ones",
      isActive: false,
      nodes: [
        {
          id: "trigger_1",
          type: "new_lead",
          category: "trigger",
          label: "New Lead Captured",
          config: {},
          position: { x: 300, y: 60 },
        },
        {
          id: "condition_1",
          type: "check_lead_field",
          category: "condition",
          label: "Check City",
          config: { field: "lead.city", operator: "is_not_empty", value: "" },
          position: { x: 300, y: 220 },
        },
        {
          id: "action_1",
          type: "update_lead_status",
          category: "action",
          label: "Mark as Qualified",
          config: { newStatus: "Qualified" },
          position: { x: 150, y: 400 },
        },
        {
          id: "action_2",
          type: "send_whatsapp",
          category: "action",
          label: "Send WhatsApp",
          config: {
            phoneNumber: "{{lead.phone}}",
            message: "Hi {{lead.name}}! Thanks for your interest. We have a dealership near {{lead.city}}. Would you like to schedule a test drive?",
          },
          position: { x: 150, y: 560 },
        },
        {
          id: "action_3",
          type: "add_tag",
          category: "action",
          label: "Tag as Unqualified",
          config: { tagName: "needs-follow-up" },
          position: { x: 480, y: 400 },
        },
      ],
      edges: [
        { id: "edge_1", sourceId: "trigger_1", targetId: "condition_1" },
        { id: "edge_2", sourceId: "condition_1", targetId: "action_1", sourcePort: "yes", label: "Yes" },
        { id: "edge_3", sourceId: "condition_1", targetId: "action_3", sourcePort: "no", label: "No" },
        { id: "edge_4", sourceId: "action_1", targetId: "action_2" },
      ],
    },
  },
  {
    name: "Post-Call Follow-Up",
    description: "After a positive call, send a follow-up email and a WhatsApp reminder the next day.",
    industry: "Corporate",
    icon: "PhoneOff",
    gradient: "from-green-500 to-emerald-500",
    workflow: {
      name: "Post-Call Follow-Up",
      description: "Follow up with positive callers via email + WhatsApp reminder",
      isActive: false,
      nodes: [
        {
          id: "trigger_1",
          type: "call_completed",
          category: "trigger",
          label: "Call Completed",
          config: { callDirection: "inbound" },
          position: { x: 300, y: 60 },
        },
        {
          id: "condition_1",
          type: "check_sentiment",
          category: "condition",
          label: "Is Positive?",
          config: { sentiment: "positive" },
          position: { x: 300, y: 220 },
        },
        {
          id: "action_1",
          type: "send_gmail",
          category: "action",
          label: "Send Recap Email",
          config: {
            to: "{{lead.email}}",
            subject: "Great speaking with you, {{lead.name}}!",
            body: "Hi {{lead.name}},\n\nIt was wonderful speaking with you today. As discussed, here's a quick recap of our conversation.\n\nWe'll follow up with more details soon.\n\nBest regards",
          },
          position: { x: 180, y: 400 },
        },
        {
          id: "action_2",
          type: "wait_delay",
          category: "action",
          label: "Wait 1 Day",
          config: { duration: 1, unit: "days" },
          position: { x: 180, y: 560 },
        },
        {
          id: "action_3",
          type: "send_whatsapp",
          category: "action",
          label: "WhatsApp Reminder",
          config: {
            phoneNumber: "{{lead.phone}}",
            message: "Hi {{lead.name}}, just following up on our conversation yesterday. Let us know if you have any questions!",
          },
          position: { x: 180, y: 720 },
        },
      ],
      edges: [
        { id: "edge_1", sourceId: "trigger_1", targetId: "condition_1" },
        { id: "edge_2", sourceId: "condition_1", targetId: "action_1", sourcePort: "yes", label: "Positive" },
        { id: "edge_3", sourceId: "action_1", targetId: "action_2" },
        { id: "edge_4", sourceId: "action_2", targetId: "action_3" },
      ],
    },
  },
  {
    name: "Appointment Booking Flow",
    description: "Send appointment details via WhatsApp, wait, then trigger an automated confirmation call.",
    industry: "Medical",
    icon: "Calendar",
    gradient: "from-purple-500 to-pink-500",
    workflow: {
      name: "Appointment Booking Flow",
      description: "Send appointment confirmation + automated follow-up call",
      isActive: false,
      nodes: [
        {
          id: "trigger_1",
          type: "new_lead",
          category: "trigger",
          label: "New Lead Captured",
          config: {},
          position: { x: 300, y: 60 },
        },
        {
          id: "action_1",
          type: "send_whatsapp",
          category: "action",
          label: "Send Appointment Info",
          config: {
            phoneNumber: "{{lead.phone}}",
            message: "Hi {{lead.name}}, thank you for booking with us! Your appointment details will be confirmed shortly. Reply YES to confirm.",
          },
          position: { x: 300, y: 230 },
        },
        {
          id: "action_2",
          type: "create_calendar_event",
          category: "action",
          label: "Create Calendar Event",
          config: {
            title: "Appointment: {{lead.name}}",
            durationMinutes: 30,
            delayFromTrigger: 24,
          },
          position: { x: 300, y: 400 },
        },
        {
          id: "action_3",
          type: "wait_delay",
          category: "action",
          label: "Wait 1 Hour",
          config: { duration: 1, unit: "hours" },
          position: { x: 300, y: 560 },
        },
        {
          id: "action_4",
          type: "trigger_outbound_call",
          category: "action",
          label: "Confirmation Call",
          config: {
            phoneNumber: "{{lead.phone}}",
            message: "Call to confirm appointment with {{lead.name}}",
          },
          position: { x: 300, y: 720 },
        },
      ],
      edges: [
        { id: "edge_1", sourceId: "trigger_1", targetId: "action_1" },
        { id: "edge_2", sourceId: "action_1", targetId: "action_2" },
        { id: "edge_3", sourceId: "action_2", targetId: "action_3" },
        { id: "edge_4", sourceId: "action_3", targetId: "action_4" },
      ],
    },
  },
  {
    name: "CRM Sync & Webhook",
    description: "Sync every new lead to Google Sheets and send data to an external CRM via webhook.",
    industry: "Real Estate",
    icon: "Globe",
    gradient: "from-cyan-500 to-teal-500",
    workflow: {
      name: "CRM Sync & Webhook",
      description: "Sync new leads to Google Sheets and external CRM",
      isActive: false,
      nodes: [
        {
          id: "trigger_1",
          type: "new_lead",
          category: "trigger",
          label: "New Lead Captured",
          config: {},
          position: { x: 300, y: 60 },
        },
        {
          id: "action_1",
          type: "send_to_sheets",
          category: "action",
          label: "Add to Google Sheets",
          config: {
            spreadsheetId: "",
            sheetName: "Leads",
            rowData: { Name: "{{lead.name}}", Phone: "{{lead.phone}}", City: "{{lead.city}}", Date: "{{lead.timestamp}}" },
          },
          position: { x: 160, y: 260 },
        },
        {
          id: "action_2",
          type: "http_webhook",
          category: "action",
          label: "Sync to External CRM",
          config: {
            url: "https://your-crm.com/api/leads",
            method: "POST",
            body: '{"name": "{{lead.name}}", "phone": "{{lead.phone}}", "city": "{{lead.city}}"}',
          },
          position: { x: 460, y: 260 },
        },
      ],
      edges: [
        { id: "edge_1", sourceId: "trigger_1", targetId: "action_1" },
        { id: "edge_2", sourceId: "trigger_1", targetId: "action_2" },
      ],
    },
  },
  {
    name: "Win-Back Campaign",
    description: "When a lead is marked as 'Lost', wait 7 days then send a re-engagement email offer.",
    industry: "Insurance",
    icon: "RefreshCw",
    gradient: "from-red-500 to-rose-500",
    workflow: {
      name: "Win-Back Campaign",
      description: "Re-engage lost leads with a timed email campaign",
      isActive: false,
      nodes: [
        {
          id: "trigger_1",
          type: "lead_status_changed",
          category: "trigger",
          label: "Status → Lost",
          config: { fromStatus: "any", toStatus: "Lost" },
          position: { x: 300, y: 60 },
        },
        {
          id: "action_1",
          type: "wait_delay",
          category: "action",
          label: "Wait 7 Days",
          config: { duration: 7, unit: "days" },
          position: { x: 300, y: 230 },
        },
        {
          id: "action_2",
          type: "send_gmail",
          category: "action",
          label: "Re-engagement Email",
          config: {
            to: "{{lead.email}}",
            subject: "We miss you, {{lead.name}}! Here's a special offer",
            body: "Hi {{lead.name}},\n\nWe noticed you were interested in our services. We'd love to offer you an exclusive deal.\n\nReply to this email or call us to learn more!\n\nBest regards",
          },
          position: { x: 300, y: 400 },
        },
        {
          id: "action_3",
          type: "send_whatsapp",
          category: "action",
          label: "WhatsApp Follow-Up",
          config: {
            phoneNumber: "{{lead.phone}}",
            message: "Hi {{lead.name}}! We have a special offer for you. Check your email for details, or reply here to learn more! 🎉",
          },
          position: { x: 300, y: 570 },
        },
      ],
      edges: [
        { id: "edge_1", sourceId: "trigger_1", targetId: "action_1" },
        { id: "edge_2", sourceId: "action_1", targetId: "action_2" },
        { id: "edge_3", sourceId: "action_2", targetId: "action_3" },
      ],
    },
  },
];
