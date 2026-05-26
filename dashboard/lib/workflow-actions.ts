"use server";

import fs from "fs";
import path from "path";
import type { Workflow } from "./workflow-types";

const DATA_DIR = path.join(process.cwd(), "..", "data");
const WORKFLOWS_FILE = path.join(DATA_DIR, "workflows.json");

// ── Helpers ──────────────────────────────────────────────────────────────────

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readWorkflows(): Workflow[] {
  try {
    if (!fs.existsSync(WORKFLOWS_FILE)) return [];
    const raw = fs.readFileSync(WORKFLOWS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeWorkflows(workflows: Workflow[]) {
  ensureDataDir();
  fs.writeFileSync(WORKFLOWS_FILE, JSON.stringify(workflows, null, 2), "utf-8");
}

function generateId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ── CRUD Actions ─────────────────────────────────────────────────────────────

export async function getWorkflows(): Promise<Workflow[]> {
  return readWorkflows();
}

export async function getWorkflow(id: string): Promise<Workflow | null> {
  const workflows = readWorkflows();
  return workflows.find((w) => w.id === id) || null;
}

export async function createWorkflow(
  data: Omit<Workflow, "id" | "createdAt" | "updatedAt">
): Promise<Workflow> {
  const workflows = readWorkflows();
  const now = new Date().toISOString();
  const workflow: Workflow = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  workflows.push(workflow);
  writeWorkflows(workflows);
  return workflow;
}

export async function updateWorkflow(
  id: string,
  data: Partial<Omit<Workflow, "id" | "createdAt">>
): Promise<Workflow | null> {
  const workflows = readWorkflows();
  const index = workflows.findIndex((w) => w.id === id);
  if (index === -1) return null;

  workflows[index] = {
    ...workflows[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeWorkflows(workflows);
  return workflows[index];
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  const workflows = readWorkflows();
  const filtered = workflows.filter((w) => w.id !== id);
  if (filtered.length === workflows.length) return false;
  writeWorkflows(filtered);
  return true;
}

export async function toggleWorkflow(id: string): Promise<Workflow | null> {
  const workflows = readWorkflows();
  const index = workflows.findIndex((w) => w.id === id);
  if (index === -1) return null;

  workflows[index].isActive = !workflows[index].isActive;
  workflows[index].updatedAt = new Date().toISOString();
  writeWorkflows(workflows);
  return workflows[index];
}

export async function duplicateWorkflow(id: string): Promise<Workflow | null> {
  const workflows = readWorkflows();
  const source = workflows.find((w) => w.id === id);
  if (!source) return null;

  const now = new Date().toISOString();
  const duplicate: Workflow = {
    ...JSON.parse(JSON.stringify(source)),
    id: generateId(),
    name: `${source.name} (Copy)`,
    isActive: false,
    createdAt: now,
    updatedAt: now,
  };
  workflows.push(duplicate);
  writeWorkflows(workflows);
  return duplicate;
}
