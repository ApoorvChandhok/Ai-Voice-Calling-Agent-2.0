"use client";

import React from "react";
import { X, Info } from "lucide-react";
import type { WorkflowNode } from "@/lib/workflow-types";
import { getNodeMetadata } from "@/lib/workflow-types";

interface Props {
  node: WorkflowNode | null;
  onClose: () => void;
  onUpdate: (id: string, config: Record<string, any>, label?: string) => void;
  executionData?: any;
}

// Template variable help
const TEMPLATE_VARS = [
  { var: "{{lead.name}}", desc: "Lead's full name" },
  { var: "{{lead.phone}}", desc: "Lead's phone number" },
  { var: "{{lead.email}}", desc: "Lead's email" },
  { var: "{{lead.city}}", desc: "Lead's city" },
  { var: "{{lead.status}}", desc: "Current lead status" },
  { var: "{{lead.timestamp}}", desc: "Lead capture date" },
  { var: "{{call.sentiment}}", desc: "Call sentiment" },
  { var: "{{call.summary}}", desc: "AI call summary" },
  { var: "{{call.duration}}", desc: "Call duration" },
];

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  helperText,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  helperText?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9]">
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7] transition-all"
      />
      {helperText && (
        <p className="text-[10px] text-gray-400 dark:text-[#6e7681]">{helperText}</p>
      )}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9]">
        {label}
      </label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7] transition-all resize-none"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9]">
        {label}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7] transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9]">
        {label}
      </label>
      <input
        type="number"
        value={value || 0}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={min}
        max={max}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7] transition-all"
      />
    </div>
  );
}

export default function WorkflowNodeConfigPanel({ node, onClose, onUpdate, executionData }: Props) {
  const [activeTab, setActiveTab] = React.useState<"config" | "execution">("config");

  React.useEffect(() => {
    if (!executionData) {
      setActiveTab("config");
    }
  }, [executionData, node?.id]);

  if (!node) return null;

  const meta = getNodeMetadata(node.type);
  const color = meta?.color || "#8b949e";

  const update = (key: string, value: any) => {
    onUpdate(node.id, { ...node.config, [key]: value });
  };

  const updateLabel = (label: string) => {
    onUpdate(node.id, node.config, label);
  };

  const renderConfigFields = () => {
    switch (node.type) {
      // ── Triggers ─────────────────────────────────────────────
      case "new_lead":
        return (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
              <p className="text-xs text-green-700 dark:text-green-400">
                This trigger fires automatically when the AI agent captures a new lead during a call. No configuration needed.
              </p>
            </div>
          </div>
        );
      case "call_completed":
        return (
          <SelectField
            label="Call Direction"
            value={node.config.callDirection || "any"}
            onChange={(v) => update("callDirection", v)}
            options={[
              { value: "any", label: "Any Direction" },
              { value: "inbound", label: "Inbound Only" },
              { value: "outbound", label: "Outbound Only" },
            ]}
          />
        );
      case "scheduled":
        return (
          <div className="space-y-3">
            <InputField
              label="Cron Expression"
              value={node.config.cronExpression || ""}
              onChange={(v) => update("cronExpression", v)}
              placeholder="0 9 * * *"
              helperText="Standard cron format: minute hour day month weekday"
            />
            <InputField
              label="Description"
              value={node.config.scheduleDescription || ""}
              onChange={(v) => update("scheduleDescription", v)}
              placeholder="Every day at 9:00 AM"
            />
          </div>
        );
      case "webhook_received":
        return (
          <InputField
            label="Webhook Path"
            value={node.config.webhookPath || ""}
            onChange={(v) => update("webhookPath", v)}
            placeholder="/api/webhook/custom"
            helperText="The URL path that will trigger this workflow"
          />
        );
      case "lead_status_changed":
        return (
          <div className="space-y-3">
            <SelectField
              label="From Status"
              value={node.config.fromStatus || "any"}
              onChange={(v) => update("fromStatus", v)}
              options={[
                { value: "any", label: "Any Status" },
                { value: "New", label: "New" },
                { value: "Contacted", label: "Contacted" },
                { value: "Qualified", label: "Qualified" },
                { value: "Interested", label: "Interested" },
                { value: "Converted", label: "Converted" },
                { value: "Lost", label: "Lost" },
              ]}
            />
            <SelectField
              label="To Status"
              value={node.config.toStatus || "any"}
              onChange={(v) => update("toStatus", v)}
              options={[
                { value: "any", label: "Any Status" },
                { value: "New", label: "New" },
                { value: "Contacted", label: "Contacted" },
                { value: "Qualified", label: "Qualified" },
                { value: "Interested", label: "Interested" },
                { value: "Converted", label: "Converted" },
                { value: "Lost", label: "Lost" },
              ]}
            />
          </div>
        );
      case "form_submitted":
        return (
          <InputField
            label="Form ID (optional)"
            value={node.config.formId || ""}
            onChange={(v) => update("formId", v)}
            placeholder="contact-form-1"
            helperText="Leave empty to trigger on any form submission"
          />
        );
      case "lead_tag_added":
        return (
          <InputField
            label="Tag Name"
            value={node.config.tagName || ""}
            onChange={(v) => update("tagName", v)}
            placeholder="vip-customer"
          />
        );
      case "sentiment_detected":
        return (
          <SelectField
            label="Sentiment Type"
            value={node.config.sentimentType || "positive"}
            onChange={(v) => update("sentimentType", v)}
            options={[
              { value: "positive", label: "Positive 😊" },
              { value: "negative", label: "Negative 😟" },
              { value: "neutral", label: "Neutral 😐" },
            ]}
          />
        );

      // ── Actions ──────────────────────────────────────────────
      case "send_gmail":
        return (
          <div className="space-y-3">
            <InputField
              label="To"
              value={node.config.to || ""}
              onChange={(v) => update("to", v)}
              placeholder="{{lead.email}} or user@example.com"
            />
            <InputField
              label="CC (optional)"
              value={node.config.cc || ""}
              onChange={(v) => update("cc", v)}
              placeholder="manager@example.com"
            />
            <InputField
              label="Subject"
              value={node.config.subject || ""}
              onChange={(v) => update("subject", v)}
              placeholder="Welcome, {{lead.name}}!"
            />
            <TextAreaField
              label="Body"
              value={node.config.body || ""}
              onChange={(v) => update("body", v)}
              placeholder="Hi {{lead.name}},\n\nThank you for reaching out..."
              rows={6}
            />
          </div>
        );
      case "send_whatsapp":
        return (
          <div className="space-y-3">
            <InputField
              label="Phone Number"
              value={node.config.phoneNumber || ""}
              onChange={(v) => update("phoneNumber", v)}
              placeholder="{{lead.phone}} or +91XXXXXXXXXX"
            />
            <TextAreaField
              label="Message"
              value={node.config.message || ""}
              onChange={(v) => update("message", v)}
              placeholder="Hi {{lead.name}}, thanks for connecting with us!"
              rows={5}
            />
            <InputField
              label="Media URL (optional)"
              value={node.config.mediaUrl || ""}
              onChange={(v) => update("mediaUrl", v)}
              placeholder="https://example.com/brochure.pdf"
            />
          </div>
        );
      case "update_lead_status":
        return (
          <SelectField
            label="New Status"
            value={node.config.newStatus || "Contacted"}
            onChange={(v) => update("newStatus", v)}
            options={[
              { value: "New", label: "New" },
              { value: "Contacted", label: "Contacted" },
              { value: "Qualified", label: "Qualified" },
              { value: "Interested", label: "Interested" },
              { value: "Converted", label: "Converted" },
              { value: "Lost", label: "Lost" },
            ]}
          />
        );
      case "add_tag":
      case "remove_tag":
        return (
          <InputField
            label="Tag Name"
            value={node.config.tagName || ""}
            onChange={(v) => update("tagName", v)}
            placeholder="vip-customer"
          />
        );
      case "trigger_outbound_call":
        return (
          <div className="space-y-3">
            <InputField
              label="Phone Number"
              value={node.config.phoneNumber || ""}
              onChange={(v) => update("phoneNumber", v)}
              placeholder="{{lead.phone}} or +91XXXXXXXXXX"
            />
            <TextAreaField
              label="Call Purpose / Message"
              value={node.config.message || ""}
              onChange={(v) => update("message", v)}
              placeholder="Follow-up call to confirm appointment with {{lead.name}}"
              rows={3}
            />
          </div>
        );
      case "http_webhook":
        return (
          <div className="space-y-3">
            <InputField
              label="URL"
              value={node.config.url || ""}
              onChange={(v) => update("url", v)}
              placeholder="https://api.example.com/webhook"
            />
            <SelectField
              label="Method"
              value={node.config.method || "POST"}
              onChange={(v) => update("method", v)}
              options={[
                { value: "GET", label: "GET" },
                { value: "POST", label: "POST" },
                { value: "PUT", label: "PUT" },
                { value: "PATCH", label: "PATCH" },
                { value: "DELETE", label: "DELETE" },
              ]}
            />
            <TextAreaField
              label="Body (JSON)"
              value={node.config.body || ""}
              onChange={(v) => update("body", v)}
              placeholder={'{"name": "{{lead.name}}", "phone": "{{lead.phone}}"}'}
              rows={5}
            />
          </div>
        );
      case "add_note":
        return (
          <TextAreaField
            label="Note Text"
            value={node.config.noteText || ""}
            onChange={(v) => update("noteText", v)}
            placeholder="Lead captured via AI agent call on {{lead.timestamp}}"
            rows={4}
          />
        );
      case "send_notification":
        return (
          <div className="space-y-3">
            <SelectField
              label="Channel"
              value={node.config.channel || "in_app"}
              onChange={(v) => update("channel", v)}
              options={[
                { value: "in_app", label: "In-App Notification" },
                { value: "email", label: "Email" },
                { value: "both", label: "Both" },
              ]}
            />
            <InputField
              label="Recipient (for email)"
              value={node.config.recipient || ""}
              onChange={(v) => update("recipient", v)}
              placeholder="team@example.com"
            />
            <TextAreaField
              label="Message"
              value={node.config.message || ""}
              onChange={(v) => update("message", v)}
              placeholder="New lead {{lead.name}} captured from {{lead.city}}"
              rows={3}
            />
          </div>
        );
      case "send_to_sheets":
        return (
          <div className="space-y-3">
            <InputField
              label="Spreadsheet ID"
              value={node.config.spreadsheetId || ""}
              onChange={(v) => update("spreadsheetId", v)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            />
            <InputField
              label="Sheet Name"
              value={node.config.sheetName || ""}
              onChange={(v) => update("sheetName", v)}
              placeholder="Sheet1"
            />
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Lead data (name, phone, city, timestamp) will be automatically appended as a new row.
              </p>
            </div>
          </div>
        );
      case "create_calendar_event":
        return (
          <div className="space-y-3">
            <InputField
              label="Event Title"
              value={node.config.title || ""}
              onChange={(v) => update("title", v)}
              placeholder="Follow-up: {{lead.name}}"
            />
            <InputField
              label="Description"
              value={node.config.description || ""}
              onChange={(v) => update("description", v)}
              placeholder="Follow-up call with lead from {{lead.city}}"
            />
            <NumberField
              label="Duration (minutes)"
              value={node.config.durationMinutes || 30}
              onChange={(v) => update("durationMinutes", v)}
              min={5}
              max={480}
            />
            <NumberField
              label="Schedule after (hours from trigger)"
              value={node.config.delayFromTrigger || 24}
              onChange={(v) => update("delayFromTrigger", v)}
              min={0}
            />
          </div>
        );
      case "wait_delay":
        return (
          <div className="space-y-3">
            <NumberField
              label="Duration"
              value={node.config.duration || 1}
              onChange={(v) => update("duration", v)}
              min={1}
            />
            <SelectField
              label="Unit"
              value={node.config.unit || "hours"}
              onChange={(v) => update("unit", v)}
              options={[
                { value: "minutes", label: "Minutes" },
                { value: "hours", label: "Hours" },
                { value: "days", label: "Days" },
              ]}
            />
          </div>
        );

      // ── Conditions ───────────────────────────────────────────
      case "if_else":
        return (
          <div className="space-y-3">
            <SelectField
              label="Field"
              value={node.config.field || "lead.city"}
              onChange={(v) => update("field", v)}
              options={[
                { value: "lead.name", label: "Lead Name" },
                { value: "lead.phone", label: "Lead Phone" },
                { value: "lead.email", label: "Lead Email" },
                { value: "lead.city", label: "Lead City" },
                { value: "lead.status", label: "Lead Status" },
                { value: "call.sentiment", label: "Call Sentiment" },
                { value: "call.duration", label: "Call Duration" },
                { value: "call.direction", label: "Call Direction" },
              ]}
            />
            <SelectField
              label="Operator"
              value={node.config.operator || "equals"}
              onChange={(v) => update("operator", v)}
              options={[
                { value: "equals", label: "Equals" },
                { value: "not_equals", label: "Not Equals" },
                { value: "contains", label: "Contains" },
                { value: "not_contains", label: "Does Not Contain" },
                { value: "greater_than", label: "Greater Than" },
                { value: "less_than", label: "Less Than" },
                { value: "is_empty", label: "Is Empty" },
                { value: "is_not_empty", label: "Is Not Empty" },
              ]}
            />
            <InputField
              label="Value"
              value={node.config.value || ""}
              onChange={(v) => update("value", v)}
              placeholder="Delhi"
            />
          </div>
        );
      case "filter_by_tag":
        return (
          <div className="space-y-3">
            <InputField
              label="Tag Name"
              value={node.config.tagName || ""}
              onChange={(v) => update("tagName", v)}
              placeholder="vip-customer"
            />
            <SelectField
              label="Condition"
              value={node.config.hasTag ? "has" : "missing"}
              onChange={(v) => update("hasTag", v === "has")}
              options={[
                { value: "has", label: "Lead HAS this tag" },
                { value: "missing", label: "Lead MISSING this tag" },
              ]}
            />
          </div>
        );
      case "check_lead_field":
        return (
          <div className="space-y-3">
            <SelectField
              label="Field"
              value={node.config.field || "lead.name"}
              onChange={(v) => update("field", v)}
              options={[
                { value: "lead.name", label: "Lead Name" },
                { value: "lead.phone", label: "Lead Phone" },
                { value: "lead.email", label: "Lead Email" },
                { value: "lead.city", label: "Lead City" },
                { value: "lead.status", label: "Lead Status" },
              ]}
            />
            <SelectField
              label="Operator"
              value={node.config.operator || "is_not_empty"}
              onChange={(v) => update("operator", v)}
              options={[
                { value: "equals", label: "Equals" },
                { value: "not_equals", label: "Not Equals" },
                { value: "contains", label: "Contains" },
                { value: "not_contains", label: "Does Not Contain" },
                { value: "is_empty", label: "Is Empty" },
                { value: "is_not_empty", label: "Is Not Empty" },
              ]}
            />
            <InputField
              label="Value"
              value={node.config.value || ""}
              onChange={(v) => update("value", v)}
              placeholder="Enter value..."
            />
          </div>
        );
      case "check_call_count":
        return (
          <div className="space-y-3">
            <SelectField
              label="Operator"
              value={node.config.operator || "greater_than"}
              onChange={(v) => update("operator", v)}
              options={[
                { value: "greater_than", label: "Greater Than" },
                { value: "less_than", label: "Less Than" },
                { value: "equals", label: "Equals" },
              ]}
            />
            <NumberField
              label="Value"
              value={node.config.value || 1}
              onChange={(v) => update("value", v)}
              min={0}
            />
          </div>
        );
      case "check_sentiment":
        return (
          <SelectField
            label="Expected Sentiment"
            value={node.config.sentiment || "positive"}
            onChange={(v) => update("sentiment", v)}
            options={[
              { value: "positive", label: "Positive 😊" },
              { value: "negative", label: "Negative 😟" },
              { value: "neutral", label: "Neutral 😐" },
            ]}
          />
        );
      default:
        return (
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d]">
            <p className="text-xs text-gray-500 dark:text-[#8b949e]">
              No configuration options available for this node type.
            </p>
          </div>
        );
    }
  };

  const renderExecutionTab = () => {
    if (!executionData) return null;
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Node status summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d]">
          <div>
            <div className="text-xs font-semibold text-gray-900 dark:text-[#e6edf3]">
              Execution Status
            </div>
            <div className="text-[10px] text-gray-400 dark:text-[#6e7681] mt-0.5">
              Ran at {new Date(executionData.finishedAt).toLocaleTimeString()}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
            executionData.status === "success"
              ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20"
              : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20"
          }`}>
            {executionData.status === "success" ? "SUCCESS" : "ERROR"}
          </span>
        </div>

        {/* Input Data */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-[#8b949e]">
            Input Payload (JSON)
          </label>
          <pre className="p-3 bg-gray-50 dark:bg-[#0d1117] rounded-lg text-xs font-mono overflow-auto border border-gray-200 dark:border-[#30363d] max-h-60 text-gray-850 dark:text-[#c9d1d9]">
            <code>{JSON.stringify(executionData.input, null, 2)}</code>
          </pre>
        </div>

        {/* Output Data */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-[#8b949e]">
            Output Payload (JSON)
          </label>
          <pre className="p-3 bg-gray-50 dark:bg-[#0d1117] rounded-lg text-xs font-mono overflow-auto border border-gray-200 dark:border-[#30363d] max-h-60 text-gray-855 dark:text-[#c9d1d9]">
            <code>{JSON.stringify(executionData.output, null, 2)}</code>
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="w-96 bg-white dark:bg-[#161b22] border-l border-gray-200 dark:border-[#30363d] h-full flex flex-col overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-[#30363d] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3]">
            {activeTab === "execution" ? "Execution Data" : "Configure Node"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-400 dark:text-[#6e7681] hover:text-gray-600 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Row */}
      {executionData && (
        <div className="flex border-b border-gray-200 dark:border-[#30363d] px-4 bg-gray-50/50 dark:bg-[#161b22]/50 flex-shrink-0">
          <button
            onClick={() => setActiveTab("config")}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
              activeTab === "config"
                ? "border-[#2f81f7] text-[#2f81f7]"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-[#8b949e] dark:hover:text-[#e6edf3]"
            }`}
          >
            Parameters
          </button>
          <button
            onClick={() => setActiveTab("execution")}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "execution"
                ? "border-[#2f81f7] text-[#2f81f7]"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-[#8b949e] dark:hover:text-[#e6edf3]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Execution Data
          </button>
        </div>
      )}

      {/* Content Area */}
      {activeTab === "execution" ? (
        renderExecutionTab()
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Node Label */}
          <InputField
            label="Node Label"
            value={node.label}
            onChange={(v) => updateLabel(v)}
            placeholder="Enter a custom label..."
          />

          <div className="h-px bg-gray-200 dark:bg-[#30363d]" />

          {/* Node-specific config */}
          {renderConfigFields()}

          {/* Template variables help */}
          {(node.category === "action" && node.type !== "wait_delay") && (
            <>
              <div className="h-px bg-gray-200 dark:bg-[#30363d]" />
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-gray-400 dark:text-[#6e7681]" />
                  <span className="text-xs font-medium text-gray-500 dark:text-[#8b949e]">
                    Template Variables
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {TEMPLATE_VARS.map((tv) => (
                    <div
                      key={tv.var}
                      className="flex items-center justify-between px-2 py-1.5 rounded-md bg-gray-50 dark:bg-[#0d1117] border border-gray-100 dark:border-[#21262d]"
                    >
                      <code className="text-[10px] font-mono text-[#2f81f7]">
                        {tv.var}
                      </code>
                      <span className="text-[10px] text-gray-400 dark:text-[#6e7681]">
                        {tv.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
