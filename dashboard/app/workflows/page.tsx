"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getWorkflows } from "@/lib/workflow-actions";
import WorkflowList from "@/components/workflows/WorkflowList";
import type { Workflow } from "@/lib/workflow-types";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkflows();
      setWorkflows(data);
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2f81f7] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-[#8b949e]">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col transition-colors duration-200">
      <WorkflowList workflows={workflows} onRefresh={fetchWorkflows} />
    </div>
  );
}
