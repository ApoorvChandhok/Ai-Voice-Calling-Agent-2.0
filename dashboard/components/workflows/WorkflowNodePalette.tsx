"use client";

import React from "react";
import {
  UserPlus, PhoneOff, Clock, Webhook, RefreshCw, FileText, Tag, Heart,
  GitBranch, Filter, Search, Hash, Smile,
  Mail, MessageCircle, UserCheck, XCircle, PhoneOutgoing, Globe, StickyNote,
  Bell, Calendar, Timer, Sheet, Play,
} from "lucide-react";
import { TRIGGER_NODES, CONDITION_NODES, ACTION_NODES, type NodeMetadata } from "@/lib/workflow-types";

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  UserPlus, PhoneOff, Clock, Webhook, RefreshCw, FileText, Tag, Heart,
  GitBranch, Filter, Search, Hash, Smile,
  Mail, MessageCircle, UserCheck, TagIcon: Tag, XCircle, PhoneOutgoing, Globe,
  StickyNote, Bell, Sheet, Calendar, Timer, Play,
};

interface Props {
  onAddNode: (metadata: NodeMetadata) => void;
  isCollapsed?: boolean;
}

export default function WorkflowNodePalette({ onAddNode, isCollapsed }: Props) {
  const sections = [
    { title: "Triggers", nodes: TRIGGER_NODES, accent: "#3fb950" },
    { title: "Conditions", nodes: CONDITION_NODES, accent: "#d29922" },
    { title: "Actions", nodes: ACTION_NODES, accent: "#2f81f7" },
  ];

  if (isCollapsed) return null;

  return (
    <div className="w-72 bg-white dark:bg-[#161b22] border-r border-gray-200 dark:border-[#30363d] overflow-y-auto flex flex-col transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-[#30363d] sticky top-0 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur z-10">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3] tracking-tight">
          Node Palette
        </h3>
        <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1">
          Click a node to add it to your workflow
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: section.accent }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#8b949e]">
                {section.title}
              </span>
            </div>
            <div className="space-y-1">
              {section.nodes.map((node) => {
                const Icon = ICON_MAP[node.icon] || FileText;
                return (
                  <button
                    key={node.type}
                    onClick={() => onAddNode(node)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 
                      text-gray-700 dark:text-[#c9d1d9] 
                      hover:bg-gray-100 dark:hover:bg-[#21262d] 
                      border border-transparent hover:border-gray-200 dark:hover:border-[#30363d]
                      group cursor-pointer"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 group-hover:scale-110"
                      style={{
                        backgroundColor: `${node.color}15`,
                        border: `1px solid ${node.color}30`,
                      }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{ color: node.color }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">
                        {node.label}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-[#6e7681] truncate">
                        {node.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
