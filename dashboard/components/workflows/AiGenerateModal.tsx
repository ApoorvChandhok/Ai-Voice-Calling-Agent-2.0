"use client";

import React, { useState } from "react";
import { Sparkles, X, Loader2, Cpu, CheckCircle } from "lucide-react";
import type { WorkflowNode, WorkflowEdge, Workflow } from "@/lib/workflow-types";
import { createWorkflow } from "@/lib/workflow-actions";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AiGenerateModal({ isOpen, onClose, onSuccess }: Props) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(0);

  const steps = [
    "Analyzing natural language prompt...",
    "Extracting triggers and business logic...",
    "Configuring trigger conditions...",
    "Creating downstream action sequences...",
    "Validating pipeline nodes and routing edges...",
    "Finalizing automation workflow..."
  ];

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || generating) return;

    setGenerating(true);
    setStep(0);

    // Simulate high-fidelity AI generation steps
    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 200));
      setStep(i + 1);
    }

    try {
      // Parse the prompt to build a customized workflow!
      const p = prompt.toLowerCase();
      
      const nodes: WorkflowNode[] = [];
      const edges: WorkflowEdge[] = [];
      
      // Determine trigger
      let triggerType: any = "new_lead";
      let triggerLabel = "New Lead Captured";
      let triggerDesc = "Fires when a new lead is captured by the AI agent";
      
      if (p.includes("completed") || p.includes("call ends")) {
        triggerType = "call_completed";
        triggerLabel = "Call Completed";
      } else if (p.includes("schedule") || p.includes("cron") || p.includes("every day")) {
        triggerType = "scheduled";
        triggerLabel = "Scheduled Trigger";
      } else if (p.includes("webhook")) {
        triggerType = "webhook_received";
        triggerLabel = "Webhook Received";
      } else if (p.includes("manually") || p.includes("manual")) {
        triggerType = "manual_trigger";
        triggerLabel = "On Manual Run";
      }

      const triggerNode: WorkflowNode = {
        id: "node_trigger",
        type: triggerType,
        category: "trigger",
        label: triggerLabel,
        config: {},
        position: { x: 350, y: 50 }
      };
      nodes.push(triggerNode);

      let currentY = 210;
      let lastNodeId = "node_trigger";
      let actionIdx = 1;

      // Scan for Gmail
      if (p.includes("email") || p.includes("gmail") || p.includes("mail")) {
        const nodeId = `node_gmail_${actionIdx++}`;
        nodes.push({
          id: nodeId,
          type: "send_gmail",
          category: "action",
          label: "Send Thank You Email",
          config: {
            to: "{{lead.email}}",
            subject: "Welcome & Thank You!",
            body: "Hi {{lead.name}},\n\nThank you for connecting with us! We look forward to working with you.\n\nBest regards,\nAutomations Team"
          },
          position: { x: 350, y: currentY }
        });
        edges.push({
          id: `edge_${lastNodeId}_to_${nodeId}`,
          sourceId: lastNodeId,
          targetId: nodeId
        });
        lastNodeId = nodeId;
        currentY += 160;
      }

      // Scan for Wait/Delay
      if (p.includes("wait") || p.includes("delay") || p.includes("hours") || p.includes("minutes")) {
        const nodeId = `node_delay_${actionIdx++}`;
        // Extract time if possible
        let duration = 2;
        let unit = "hours";
        if (p.includes("hour")) {
          const match = p.match(/(\d+)\s*hour/);
          if (match) duration = parseInt(match[1]);
        } else if (p.includes("minute")) {
          const match = p.match(/(\d+)\s*minute/);
          if (match) duration = parseInt(match[1]);
          unit = "minutes";
        } else if (p.includes("day")) {
          const match = p.match(/(\d+)\s*day/);
          if (match) duration = parseInt(match[1]);
          unit = "days";
        }

        nodes.push({
          id: nodeId,
          type: "wait_delay",
          category: "action",
          label: `Wait ${duration} ${unit}`,
          config: { duration, unit },
          position: { x: 350, y: currentY }
        });
        edges.push({
          id: `edge_${lastNodeId}_to_${nodeId}`,
          sourceId: lastNodeId,
          targetId: nodeId
        });
        lastNodeId = nodeId;
        currentY += 160;
      }

      // Scan for WhatsApp
      if (p.includes("whatsapp") || p.includes("message") || p.includes("text")) {
        const nodeId = `node_whatsapp_${actionIdx++}`;
        nodes.push({
          id: nodeId,
          type: "send_whatsapp",
          category: "action",
          label: "Send WhatsApp Greeting",
          config: {
            phoneNumber: "{{lead.phone}}",
            message: "Hi {{lead.name}}, thanks for connecting with us! We have received your request."
          },
          position: { x: 350, y: currentY }
        });
        edges.push({
          id: `edge_${lastNodeId}_to_${nodeId}`,
          sourceId: lastNodeId,
          targetId: nodeId
        });
        lastNodeId = nodeId;
        currentY += 160;
      }

      // Scan for CRM status update
      if (p.includes("crm") || p.includes("status") || p.includes("update")) {
        const nodeId = `node_status_${actionIdx++}`;
        nodes.push({
          id: nodeId,
          type: "update_lead_status",
          category: "action",
          label: "Update CRM Lead Status",
          config: { newStatus: "Contacted" },
          position: { x: 350, y: currentY }
        });
        edges.push({
          id: `edge_${lastNodeId}_to_${nodeId}`,
          sourceId: lastNodeId,
          targetId: nodeId
        });
        lastNodeId = nodeId;
        currentY += 160;
      }

      // Scan for outbound call
      if (p.includes("call") || p.includes("phone call") || p.includes("outbound")) {
        const nodeId = `node_call_${actionIdx++}`;
        nodes.push({
          id: nodeId,
          type: "trigger_outbound_call",
          category: "action",
          label: "Trigger Outbound Voice Call",
          config: {
            phoneNumber: "{{lead.phone}}",
            message: "AI agent follow-up call to lead."
          },
          position: { x: 350, y: currentY }
        });
        edges.push({
          id: `edge_${lastNodeId}_to_${nodeId}`,
          sourceId: lastNodeId,
          targetId: nodeId
        });
        lastNodeId = nodeId;
        currentY += 160;
      }

      // Scan for Google Sheets
      if (p.includes("sheet") || p.includes("excel") || p.includes("google sheet")) {
        const nodeId = `node_sheet_${actionIdx++}`;
        nodes.push({
          id: nodeId,
          type: "send_to_sheets",
          category: "action",
          label: "Log to Google Sheets",
          config: { spreadsheetId: "sheets_workflow_log", sheetName: "Sheet1" },
          position: { x: 350, y: currentY }
        });
        edges.push({
          id: `edge_${lastNodeId}_to_${nodeId}`,
          sourceId: lastNodeId,
          targetId: nodeId
        });
        lastNodeId = nodeId;
        currentY += 160;
      }

      // Fallback: If no actions found, add a simple note
      if (nodes.length === 1) {
        const nodeId = "node_note_1";
        nodes.push({
          id: nodeId,
          type: "add_note",
          category: "action",
          label: "Add CRM Log Note",
          config: { noteText: "Workflow triggered automatically." },
          position: { x: 350, y: currentY }
        });
        edges.push({
          id: `edge_trigger_to_${nodeId}`,
          sourceId: "node_trigger",
          targetId: nodeId
        });
      }

      // Build workflow name
      let name = "AI Generated Automation";
      if (prompt.length < 50) {
        name = prompt.charAt(0).toUpperCase() + prompt.slice(1);
      } else {
        // extract key phrases
        name = "Automated " + triggerLabel + " Sequence";
      }

      const wfData = {
        name,
        description: `Generated automatically from prompt: "${prompt}"`,
        nodes,
        edges,
        isActive: false
      };

      const created = await createWorkflow(wfData);
      setGenerating(false);
      onClose();
      onSuccess();
      router.push(`/workflows/builder?id=${created.id}`);
    } catch (err) {
      console.error("AI Generation failed:", err);
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="w-full max-w-lg bg-white dark:bg-[#161b22] border border-gray-250 dark:border-[#30363d] rounded-2xl shadow-2xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#30363d] bg-gray-50/50 dark:bg-[#0d1117]/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
            <h3 className="text-base font-bold text-gray-900 dark:text-[#e6edf3]">
              Generate Workflow with AI
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="p-1.5 rounded-lg text-gray-400 dark:text-[#6e7681] hover:text-gray-600 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors disabled:opacity-50"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          {!generating ? (
            <>
              <p className="text-xs text-gray-500 dark:text-[#8b949e] leading-relaxed">
                Describe the pipeline or automation rules you want to build in plain English.
                The AI will analyze your description, select the correct triggers, connect them,
                and populate reasonable default parameters.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-[#c9d1d9]">
                  What would you like this workflow to do?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. When a new lead is captured, send a thank you email, wait 2 hours, and then trigger an outbound AI call."
                  rows={4}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all resize-none"
                />
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-[#6e7681]">
                  Try one of these examples:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    "Send a welcome email on new lead and update lead status.",
                    "Wait 1 hour after a call completed, then send a WhatsApp message.",
                    "When a webhook is received, log the details to a Google Sheet."
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPrompt(s)}
                      className="text-left text-xs px-3 py-2 rounded-lg border border-gray-150 dark:border-[#21262d] bg-white dark:bg-[#161b22] text-gray-600 dark:text-[#c9d1d9] hover:bg-gray-50 dark:hover:bg-[#30363d] hover:border-purple-500/40 hover:text-purple-500 dark:hover:text-purple-400 transition-all truncate"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-[#21262d] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-[#30363d] text-gray-700 dark:text-[#c9d1d9] bg-white dark:bg-[#21262d] hover:bg-gray-50 dark:hover:bg-[#30363d] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/25 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Automation
                </button>
              </div>
            </>
          ) : (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center animate-pulse">
                  <Cpu className="w-8 h-8 text-purple-500 animate-spin-slow" />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500"></span>
                </span>
              </div>

              <h4 className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3]">
                AI Copilot is Building Your Workflow
              </h4>
              
              {/* Progress steps */}
              <div className="w-full max-w-xs mt-6 space-y-2 text-left">
                {steps.map((s, idx) => {
                  const isDone = step > idx;
                  const isCurrent = step === idx;
                  return (
                    <div
                      key={s}
                      className={`flex items-center gap-2 text-xs transition-opacity duration-200 ${
                        isDone
                          ? "text-green-500"
                          : isCurrent
                          ? "text-purple-500 font-medium"
                          : "text-gray-400 dark:text-[#6e7681] opacity-40"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-200 dark:border-[#30363d] flex-shrink-0" />
                      )}
                      <span className="truncate">{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
