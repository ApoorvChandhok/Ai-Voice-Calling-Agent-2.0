"use client";

import React from "react";
import {
  UserPlus, PhoneOff, Clock, Webhook, RefreshCw, FileText, Tag, Heart,
  GitBranch, Filter, Search, Hash, Smile,
  Mail, MessageCircle, UserCheck, XCircle, PhoneOutgoing, Globe, StickyNote,
  Bell, Calendar, Timer, Sheet, X, GripVertical,
} from "lucide-react";
import type { WorkflowNode } from "@/lib/workflow-types";
import { getNodeMetadata } from "@/lib/workflow-types";

const ICON_MAP: Record<string, React.ElementType> = {
  UserPlus, PhoneOff, Clock, Webhook, RefreshCw, FileText, Tag, Heart,
  GitBranch, Filter, Search, Hash, Smile,
  Mail, MessageCircle, UserCheck, TagIcon: Tag, XCircle, PhoneOutgoing, Globe,
  StickyNote, Bell, Sheet, Calendar, Timer,
};



interface Props {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  isCondition?: boolean;
  executionState?: "idle" | "running" | "success" | "error";
}

function getConfigSummary(node: WorkflowNode): string {
  const c = node.config;
  switch (node.type) {
    case "send_gmail":
      return c.to ? `To: ${c.to}` : "Configure email...";
    case "send_whatsapp":
      return c.phoneNumber ? `To: ${c.phoneNumber}` : "Configure message...";
    case "update_lead_status":
      return c.newStatus ? `→ ${c.newStatus}` : "Select status...";
    case "add_tag":
    case "remove_tag":
      return c.tagName ? `Tag: ${c.tagName}` : "Set tag name...";
    case "trigger_outbound_call":
      return c.phoneNumber ? `Call: ${c.phoneNumber}` : "Set phone...";
    case "http_webhook":
      return c.url ? `${c.method || "POST"} ${c.url}` : "Set webhook URL...";
    case "wait_delay":
      return c.duration ? `Wait ${c.duration} ${c.unit || "hours"}` : "Set delay...";
    case "if_else":
      return c.field ? `${c.field} ${c.operator} ${c.value || "?"}` : "Set condition...";
    case "check_lead_field":
      return c.field ? `${c.field} ${c.operator}` : "Set field...";
    case "check_sentiment":
      return c.sentiment ? `Sentiment: ${c.sentiment}` : "Select sentiment...";
    case "filter_by_tag":
      return c.tagName ? `${c.hasTag ? "Has" : "Missing"}: ${c.tagName}` : "Set tag...";
    case "check_call_count":
      return c.value !== undefined ? `Calls ${c.operator} ${c.value}` : "Set condition...";
    case "call_completed":
      return c.callDirection ? `Direction: ${c.callDirection}` : "Any direction";
    case "scheduled":
      return c.scheduleDescription || c.cronExpression || "Set schedule...";
    case "lead_status_changed":
      return `${c.fromStatus || "any"} → ${c.toStatus || "any"}`;
    case "sentiment_detected":
      return c.sentimentType || "Set sentiment...";
    case "send_to_sheets":
      return c.sheetName || "Configure sheet...";
    case "create_calendar_event":
      return c.title || "Set event title...";
    case "add_note":
      return c.noteText ? c.noteText.substring(0, 30) + "..." : "Set note...";
    case "send_notification":
      return c.channel || "Set notification...";
    default:
      return "Configure...";
  }
}

export default function WorkflowNodeCard({
  node,
  isSelected,
  onSelect,
  onDelete,
  onDragStart,
  executionState = "idle",
}: Props) {
  const meta = getNodeMetadata(node.type);
  const color = meta?.color || "#8b949e";
  const iconName = meta?.icon || "FileText";
  const Icon = ICON_MAP[iconName] || FileText;
  const isCondition = node.category === "condition";
  const isTrigger = node.category === "trigger";

  const configSummary = getConfigSummary(node);

  let borderClass = "border-gray-200 dark:border-[#30363d] hover:border-gray-300 dark:hover:border-[#484f58]";
  let shadowClass = "shadow-lg dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)]";
  let pulseClass = "";

  if (isSelected) {
    borderClass = "border-[#2f81f7]";
    shadowClass = "shadow-[0_0_20px_rgba(47,129,247,0.35)]";
  }

  if (executionState === "running") {
    borderClass = "border-yellow-500 dark:border-yellow-500/80";
    shadowClass = "shadow-[0_0_15px_rgba(234,179,8,0.5)]";
    pulseClass = "animate-pulse";
  } else if (executionState === "success") {
    borderClass = "border-green-500 dark:border-green-500/80";
    shadowClass = "shadow-[0_0_15px_rgba(34,197,94,0.4)]";
  } else if (executionState === "error") {
    borderClass = "border-red-500 dark:border-red-500/80";
    shadowClass = "shadow-[0_0_15px_rgba(239,68,68,0.45)]";
  }

  return (
    <div
      className={`absolute cursor-pointer select-none transition-shadow duration-200 ${
        isSelected ? "z-20" : "z-10"
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: 260,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {/* Input port (top) — not for triggers */}
      {!isTrigger && (
        <div className="flex justify-center -mb-1 relative z-30">
          <div
            className="w-3 h-3 rounded-full border-2 border-[#30363d] bg-[#0d1117]"
            data-port-id={`${node.id}-input`}
            data-port-type="input"
          />
        </div>
      )}

      {/* Card body */}
      <div
        className={`rounded-xl border transition-all duration-200 overflow-hidden bg-white dark:bg-[#161b22] ${borderClass} ${shadowClass} ${pulseClass}`}
      >
        {/* Color accent bar */}
        <div className="h-1" style={{ backgroundColor: color }} />

        {/* Header */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 dark:border-[#21262d]">
          <div
            className="cursor-grab active:cursor-grabbing p-0.5 rounded text-gray-400 dark:text-[#6e7681] hover:text-gray-600 dark:hover:text-[#8b949e]"
            onMouseDown={(e) => {
              e.stopPropagation();
              onDragStart(node.id, e);
            }}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${color}15`,
              border: `1px solid ${color}30`,
            }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900 dark:text-[#e6edf3] truncate">
              {node.label}
            </div>
            <div className="text-[10px] text-gray-400 dark:text-[#6e7681] capitalize">
              {node.category}
            </div>
          </div>
          
          {/* Execution badge */}
          {executionState !== "idle" && (
            <div className="flex items-center justify-center mr-1">
              {executionState === "running" && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
              )}
              {executionState === "success" && (
                <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-green-500 dark:bg-green-500/25 text-white dark:text-green-400 text-[10px] font-bold shadow-sm shadow-green-500/20 border border-green-500/30">
                  ✓
                </span>
              )}
              {executionState === "error" && (
                <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-red-500 dark:bg-red-500/25 text-white dark:text-red-400 text-[10px] font-bold shadow-sm shadow-red-500/20 border border-red-500/30">
                  !
                </span>
              )}
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="p-1 rounded-md text-gray-400 dark:text-[#6e7681] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Config summary */}
        <div className="px-3 py-2">
          <p className="text-[11px] text-gray-500 dark:text-[#8b949e] truncate font-mono">
            {configSummary}
          </p>
        </div>
      </div>

      {/* Output ports (bottom) */}
      <div className={`flex ${isCondition ? "justify-between px-8" : "justify-center"} -mt-1 relative z-30`}>
        {isCondition ? (
          <>
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full border-2 bg-[#0d1117]"
                style={{ borderColor: "#3fb950" }}
                data-port-id={`${node.id}-yes`}
                data-port-type="output-yes"
              />
              <span className="text-[9px] text-green-500 font-medium mt-0.5">Yes</span>
            </div>
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full border-2 bg-[#0d1117]"
                style={{ borderColor: "#f85149" }}
                data-port-id={`${node.id}-no`}
                data-port-type="output-no"
              />
              <span className="text-[9px] text-red-500 font-medium mt-0.5">No</span>
            </div>
          </>
        ) : (
          <div
            className="w-3 h-3 rounded-full border-2 border-[#30363d] bg-[#0d1117]"
            data-port-id={`${node.id}-output`}
            data-port-type="output"
          />
        )}
      </div>
    </div>
  );
}
