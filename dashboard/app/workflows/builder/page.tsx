"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Play, Pause, PanelLeftClose, PanelLeft, History, Trash2, Loader2, Sparkles, X } from "lucide-react";
import type { WorkflowNode, WorkflowEdge, NodeMetadata } from "@/lib/workflow-types";
import { getWorkflow, createWorkflow, updateWorkflow } from "@/lib/workflow-actions";
import WorkflowCanvas from "@/components/workflows/WorkflowCanvas";
import WorkflowNodePalette from "@/components/workflows/WorkflowNodePalette";
import WorkflowNodeConfigPanel from "@/components/workflows/WorkflowNodeConfigPanel";

function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

function generateEdgeId(): string {
  return `edge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(!!editId);

  const [nodeExecutionStatuses, setNodeExecutionStatuses] = useState<Record<string, "idle" | "running" | "success" | "error">>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executions, setExecutions] = useState<any[]>([]);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [showExecutionsPanel, setShowExecutionsPanel] = useState(false);

  // Load existing workflow if editing
  useEffect(() => {
    if (editId) {
      (async () => {
        try {
          const wf = await getWorkflow(editId);
          if (wf) {
            setWorkflowName(wf.name);
            setWorkflowDescription(wf.description);
            setNodes(wf.nodes);
            setEdges(wf.edges);
            setIsActive(wf.isActive);
          }
        } catch (err) {
          console.error("Failed to load workflow:", err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [editId]);

  // Load mock executions once workflow is loaded to populate logs immediately
  useEffect(() => {
    if (!loading && nodes.length > 0) {
      const exec1: any = {
        id: `exec_mock_1`,
        workflowId: editId || "new",
        status: "success",
        startedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        finishedAt: new Date(Date.now() - 1000 * 60 * 12 + 1500).toISOString(),
        nodeExecutions: {},
      };
      
      nodes.forEach((n, idx) => {
        exec1.nodeExecutions[n.id] = {
          nodeId: n.id,
          nodeLabel: n.label,
          type: n.type,
          status: "success",
          input: {
            lead: {
              name: "Abhinav Sharma",
              email: "abhinav.sharma@gmail.com",
              phone: "+91 98765 43210",
              city: "Delhi",
              status: "New",
              industry: "Corporate"
            }
          },
          output: {
            success: true,
            timestamp: new Date(Date.now() - 1000 * 60 * 12 + 1500).toISOString()
          },
          startedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          finishedAt: new Date(Date.now() - 1000 * 60 * 12 + 200).toISOString()
        };
      });

      setExecutions([exec1]);
    }
  }, [loading, nodes.length, editId]);

  const selectedExecution = executions.find(e => e.id === selectedExecutionId) || null;

  // Sync node highlights with chosen execution
  useEffect(() => {
    if (selectedExecution) {
      const statuses: Record<string, "idle" | "running" | "success" | "error"> = {};
      nodes.forEach(n => {
        const nodeRun = selectedExecution.nodeExecutions[n.id];
        statuses[n.id] = nodeRun ? nodeRun.status : "idle";
      });
      setNodeExecutionStatuses(statuses);
    } else {
      setNodeExecutionStatuses({});
    }
  }, [selectedExecutionId, selectedExecution, nodes]);

  // ── Node Operations ────────────────────────────────────────
  const handleAddNode = useCallback(
    (metadata: NodeMetadata) => {
      // Calculate position — stack below existing nodes
      const maxY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.position.y)) : -60;
      const newNode: WorkflowNode = {
        id: generateNodeId(),
        type: metadata.type,
        category: metadata.category,
        label: metadata.label,
        config: { ...metadata.defaultConfig },
        position: { x: 300, y: maxY + 170 },
      };
      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
    },
    [nodes]
  );

  const handleDeleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.sourceId !== id && e.targetId !== id));
    setSelectedNodeId((prev) => (prev === id ? null : prev));
  }, []);

  const handleMoveNode = useCallback(
    (id: string, position: { x: number; y: number }) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, position } : n))
      );
    },
    []
  );

  const handleSelectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const handleUpdateNodeConfig = useCallback(
    (id: string, config: Record<string, any>, label?: string) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, config, ...(label !== undefined ? { label } : {}) }
            : n
        )
      );
    },
    []
  );

  // ── Edge Operations ────────────────────────────────────────
  const handleAddEdge = useCallback(
    (sourceId: string, targetId: string, sourcePort?: string) => {
      // Prevent duplicate edges
      const exists = edges.find(
        (e) => e.sourceId === sourceId && e.targetId === targetId
      );
      if (exists) return;

      const newEdge: WorkflowEdge = {
        id: generateEdgeId(),
        sourceId,
        targetId,
        sourcePort: sourcePort as any,
        label: sourcePort === "yes" ? "Yes" : sourcePort === "no" ? "No" : undefined,
      };
      setEdges((prev) => [...prev, newEdge]);
    },
    [edges]
  );

  const handleDeleteEdge = useCallback((id: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Manual Run Simulator ────────────────────────────────────
  const runWorkflowManually = async () => {
    if (isExecuting || nodes.length === 0) return;
    
    setIsExecuting(true);
    setShowExecutionsPanel(true);
    setSelectedNodeId(null); // clear node selection to show logs panel
    
    let startNode = nodes.find(n => n.type === "manual_trigger") || nodes.find(n => n.category === "trigger");
    if (!startNode) {
      startNode = nodes[0];
    }
    
    const executionId = `exec_${Date.now()}`;
    const newExecution: any = {
      id: executionId,
      workflowId: editId || "new",
      status: "running",
      startedAt: new Date().toISOString(),
      finishedAt: "",
      nodeExecutions: {},
    };
    
    const initialStatuses: Record<string, "idle" | "running" | "success" | "error"> = {};
    nodes.forEach(n => {
      initialStatuses[n.id] = "idle";
    });
    setNodeExecutionStatuses(initialStatuses);
    
    setExecutions(prev => [newExecution, ...prev]);
    setSelectedExecutionId(executionId);
    
    const statuses = { ...initialStatuses };
    const nodeExecs: Record<string, any> = {};
    const queue: { nodeId: string; parentOutput?: any }[] = [{ nodeId: startNode.id }];
    const visited = new Set<string>();
    
    let overallStatus: "success" | "error" = "success";
    
    while (queue.length > 0) {
      const { nodeId, parentOutput } = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;
      
      statuses[node.id] = "running";
      setNodeExecutionStatuses({ ...statuses });
      
      // Delay to simulate working
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const input = parentOutput || {
        lead: {
          id: "lead_9921",
          name: "Abhinav Sharma",
          email: "abhinav.sharma@gmail.com",
          phone: "+91 98765 43210",
          city: "Delhi",
          status: "New",
          industry: "Corporate",
          timestamp: new Date().toISOString()
        }
      };
      
      let output: any = {};
      let status: "success" | "error" = "success";
      
      switch (node.type) {
        case "manual_trigger":
        case "new_lead":
          output = { ...input };
          break;
        case "call_completed":
          output = {
            call: {
              id: "call_8829",
              duration: "2m 14s",
              direction: "outbound",
              sentiment: "positive",
              summary: "Lead is highly interested in the corporate package and requested pricing details via email."
            },
            lead: { ...input.lead, status: "Contacted" }
          };
          break;
        case "if_else":
        case "check_lead_field":
        case "check_sentiment":
        case "filter_by_tag":
        case "check_call_count":
          const passes = true;
          output = {
            conditionPassed: passes,
            matchingValue: node.config.value || "Any",
            branch: passes ? "yes" : "no",
          };
          break;
        case "send_gmail":
          const resolvedTo = node.config.to ? node.config.to.replace("{{lead.email}}", input.lead?.email || "abhinav@example.com") : (input.lead?.email || "abhinav@example.com");
          const resolvedSubject = node.config.subject ? node.config.subject.replace("{{lead.name}}", input.lead?.name || "Abhinav") : `Welcome to our business, ${input.lead?.name || "Abhinav"}!`;
          const resolvedBody = node.config.body ? node.config.body.replace("{{lead.name}}", input.lead?.name || "Abhinav") : `Hi ${input.lead?.name || "Abhinav"},\n\nThanks for connecting. We received your request...`;
          output = {
            success: true,
            messageId: `gmail_msg_${Math.random().toString(36).substring(2, 10)}`,
            sentTo: resolvedTo,
            subject: resolvedSubject,
            bodyPreview: resolvedBody.substring(0, 80) + "...",
            apiStatus: "authenticated",
            timestamp: new Date().toISOString()
          };
          break;
        case "send_whatsapp":
          const resolvedPhone = node.config.phoneNumber ? node.config.phoneNumber.replace("{{lead.phone}}", input.lead?.phone || "+919876543210") : (input.lead?.phone || "+919876543210");
          const resolvedMsg = node.config.message ? node.config.message.replace("{{lead.name}}", input.lead?.name || "Abhinav") : `Hi ${input.lead?.name || "Abhinav"}, thanks for connecting with us!`;
          output = {
            success: true,
            messageId: `wa_msg_${Math.random().toString(36).substring(2, 8)}`,
            sentTo: resolvedPhone,
            messageText: resolvedMsg,
            status: "delivered",
            provider: "meta_cloud_api"
          };
          break;
        case "update_lead_status":
          output = {
            success: true,
            previousStatus: input.lead?.status || "New",
            currentStatus: node.config.newStatus || "Contacted"
          };
          break;
        case "add_tag":
        case "remove_tag":
          output = {
            success: true,
            tagName: node.config.tagName || "new-lead",
            leadTags: node.type === "add_tag" ? [...(input.lead?.tags || []), node.config.tagName || "new-lead"] : []
          };
          break;
        case "trigger_outbound_call":
          output = {
            success: true,
            callSid: `call_ai_${Math.random().toString(36).substring(2, 12)}`,
            phoneNumber: node.config.phoneNumber ? node.config.phoneNumber.replace("{{lead.phone}}", input.lead?.phone || "+919876543210") : (input.lead?.phone || "+919876543210"),
            status: "queued"
          };
          break;
        case "http_webhook":
          output = {
            statusCode: 200,
            headers: { "content-type": "application/json" },
            body: {
              id: `ext_${Math.random().toString(36).substring(2, 6)}`,
              synced: true,
              status: "success"
            }
          };
          break;
        case "add_note":
          output = {
            success: true,
            noteId: `note_${Math.random().toString(36).substring(2, 8)}`,
            text: node.config.noteText || "Added note via workflow run."
          };
          break;
        case "send_notification":
          output = {
            success: true,
            channel: node.config.channel || "in_app",
            sent: true
          };
          break;
        case "send_to_sheets":
          output = {
            success: true,
            spreadsheetId: node.config.spreadsheetId || "1BxiMVs0XRA5nFMdKv...",
            updatedRange: `${node.config.sheetName || "Sheet1"}!A${Math.floor(Math.random() * 20) + 2}:E${Math.floor(Math.random() * 20) + 2}`,
            rowsAdded: 1
          };
          break;
        case "create_calendar_event":
          output = {
            success: true,
            eventId: `evt_${Math.random().toString(36).substring(2, 10)}`,
            htmlLink: `https://calendar.google.com/event?id=evt_${Math.random().toString(36).substring(2, 10)}`,
            title: node.config.title || "Follow-up Call"
          };
          break;
        case "wait_delay":
          output = {
            sleptFor: `${node.config.duration || 1} ${node.config.unit || "hours"}`,
            resumeTime: new Date().toISOString()
          };
          break;
        default:
          output = { success: true };
      }
      
      statuses[node.id] = status;
      setNodeExecutionStatuses({ ...statuses });
      
      nodeExecs[node.id] = {
        nodeId: node.id,
        nodeLabel: node.label,
        type: node.type,
        status: status,
        input: input,
        output: output,
        startedAt: new Date(Date.now() - 800).toISOString(),
        finishedAt: new Date().toISOString()
      };
      
      const outgoingEdges = edges.filter(e => e.sourceId === node.id);
      
      if (node.category === "condition") {
        const chosenBranch = output.branch;
        const matchedEdges = outgoingEdges.filter(e => e.sourcePort === chosenBranch);
        matchedEdges.forEach(e => {
          queue.push({ nodeId: e.targetId, parentOutput: { ...input, conditionResult: output } });
        });
      } else {
        outgoingEdges.forEach(e => {
          queue.push({ nodeId: e.targetId, parentOutput: output });
        });
      }
    }
    
    setIsExecuting(false);
    
    setExecutions(prev => prev.map(exec => {
      if (exec.id === executionId) {
        return {
          ...exec,
          status: overallStatus,
          finishedAt: new Date().toISOString(),
          nodeExecutions: nodeExecs
        };
      }
      return exec;
    }));
  };

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const data = {
        name: workflowName,
        description: workflowDescription,
        nodes,
        edges,
        isActive,
      };

      if (editId) {
        await updateWorkflow(editId, data);
      } else {
        const created = await createWorkflow(data);
        // Update URL to include the new ID without full navigation
        window.history.replaceState(null, "", `/workflows/builder?id=${created.id}`);
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to save:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2f81f7] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-[#8b949e]">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col -m-8 overflow-hidden">
      {/* Top toolbar */}
      <div className="h-14 border-b border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] flex items-center justify-between px-4 flex-shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/workflows")}
            className="p-2 rounded-lg text-gray-500 dark:text-[#8b949e] hover:text-gray-700 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowPalette(!showPalette)}
            className="p-2 rounded-lg text-gray-500 dark:text-[#8b949e] hover:text-gray-700 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
            title={showPalette ? "Hide palette" : "Show palette"}
          >
            {showPalette ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>

          <div className="h-6 w-px bg-gray-200 dark:bg-[#30363d]" />

          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3] bg-transparent border-none outline-none focus:ring-0 min-w-[200px] placeholder-gray-400 dark:placeholder-[#484f58]"
            placeholder="Workflow name..."
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Run Manually button */}
          <button
            onClick={runWorkflowManually}
            disabled={isExecuting || nodes.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
              isExecuting
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 border-green-600 hover:border-green-700 text-white shadow-green-500/20"
            } disabled:opacity-50`}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Manually
              </>
            )}
          </button>

          {/* Executions log toggle button */}
          <button
            onClick={() => {
              setShowExecutionsPanel(!showExecutionsPanel);
              if (!showExecutionsPanel) setSelectedNodeId(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              showExecutionsPanel
                ? "bg-blue-50 dark:bg-[#2f81f7]/10 text-[#2f81f7] border-[#2f81f7]/30"
                : "bg-white dark:bg-[#21262d] text-gray-700 dark:text-[#c9d1d9] border-gray-200 dark:border-[#30363d] hover:bg-gray-50 dark:hover:bg-[#30363d]"
            }`}
            title="View Execution Logs"
          >
            <History className="w-3.5 h-3.5" />
            Executions
            {executions.length > 0 && (
              <span className="ml-0.5 px-1 py-0.2 text-[9px] rounded bg-gray-100 dark:bg-[#30363d] text-gray-500 dark:text-[#8b949e]">
                {executions.length}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-gray-200 dark:bg-[#30363d] mx-1" />

          {/* Status badge */}
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20"
                : "bg-gray-100 dark:bg-[#21262d] text-gray-500 dark:text-[#6e7681] border border-gray-200 dark:border-[#30363d]"
            }`}
          >
            {isActive ? (
              <><Pause className="w-3 h-3" /> Active</>
            ) : (
              <><Play className="w-3 h-3" /> Inactive</>
            )}
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              saveStatus === "saved"
                ? "bg-green-500 text-white"
                : saveStatus === "error"
                ? "bg-red-500 text-white"
                : "bg-[#2f81f7] text-white hover:bg-[#2672d9] shadow-sm shadow-[#2f81f7]/25"
            } disabled:opacity-50`}
          >
            <Save className="w-4 h-4" />
            {saving
              ? "Saving..."
              : saveStatus === "saved"
              ? "Saved ✓"
              : saveStatus === "error"
              ? "Error!"
              : "Save"}
          </button>
        </div>
      </div>

      {/* Description bar */}
      <div className="border-b border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117] px-4 py-2 flex-shrink-0 transition-colors duration-200">
        <input
          type="text"
          value={workflowDescription}
          onChange={(e) => setWorkflowDescription(e.target.value)}
          className="text-xs text-gray-500 dark:text-[#8b949e] bg-transparent border-none outline-none focus:ring-0 w-full placeholder-gray-400 dark:placeholder-[#484f58]"
          placeholder="Add a description for this workflow..."
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left palette */}
        {showPalette && (
          <WorkflowNodePalette onAddNode={handleAddNode} />
        )}

        {/* Canvas */}
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          onDeleteNode={handleDeleteNode}
          onMoveNode={handleMoveNode}
          onAddEdge={handleAddEdge}
          onDeleteEdge={handleDeleteEdge}
          nodeExecutionStatuses={nodeExecutionStatuses}
        />

        {/* Right config panel / executions panel toggle */}
        {selectedNode ? (
          <WorkflowNodeConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onUpdate={handleUpdateNodeConfig}
            executionData={selectedExecution?.nodeExecutions?.[selectedNode.id]}
          />
        ) : showExecutionsPanel ? (
          <div className="w-96 bg-white dark:bg-[#161b22] border-l border-gray-200 dark:border-[#30363d] h-full flex flex-col overflow-hidden transition-colors duration-200 flex-shrink-0">
            {/* Panel header */}
            <div className="p-4 border-b border-gray-200 dark:border-[#30363d] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#2f81f7]" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3]">
                  Workflow Executions
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setExecutions([]); setSelectedExecutionId(null); }}
                  className="p-1.5 rounded-md text-gray-400 dark:text-[#6e7681] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowExecutionsPanel(false)}
                  className="p-1.5 rounded-md text-gray-400 dark:text-[#6e7681] hover:text-gray-650 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Executions list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {executions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                  <History className="w-8 h-8 text-gray-300 dark:text-[#30363d] mb-2" />
                  <p className="text-xs font-medium text-gray-500 dark:text-[#8b949e]">
                    No executions yet
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-[#6e7681] mt-1">
                    Click "Run Manually" at the top to simulate workflow execution.
                  </p>
                </div>
              ) : (
                executions.map((exec) => {
                  const isSelected = exec.id === selectedExecutionId;
                  return (
                    <button
                      key={exec.id}
                      onClick={() => setSelectedExecutionId(isSelected ? null : exec.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#2f81f7] bg-blue-50/20 dark:bg-[#2f81f7]/5"
                          : "border-gray-200 dark:border-[#30363d] bg-gray-50/50 dark:bg-[#161b22]/50 hover:bg-gray-50 dark:hover:bg-[#21262d]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-900 dark:text-[#e6edf3]">
                          {exec.id.startsWith("exec_mock") ? "Trigger Test Run" : "Manual Execution"}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          exec.status === "success"
                            ? "bg-green-550/15 text-green-500"
                            : exec.status === "running"
                            ? "bg-yellow-550/15 text-yellow-500"
                            : "bg-red-550/15 text-red-500"
                        }`}>
                          {exec.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-gray-400 dark:text-[#6e7681] mt-1 flex items-center justify-between">
                        <span>
                          {new Date(exec.startedAt).toLocaleTimeString()}
                        </span>
                        <span>
                          {exec.finishedAt
                            ? `${((new Date(exec.finishedAt).getTime() - new Date(exec.startedAt).getTime()) / 1000).toFixed(1)}s`
                            : "running..."}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-blue-500/10 text-[10px] text-[#2f81f7] font-medium flex items-center justify-between">
                          <span>✓ Loaded on canvas</span>
                          <span>Click nodes to view data</span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function WorkflowBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#2f81f7] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}
