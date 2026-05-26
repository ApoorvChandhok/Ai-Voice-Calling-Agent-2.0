"use client";

import React, { useState } from "react";
import { X, User, Phone, Mail, MapPin, Tag } from "lucide-react";
import { addNewLead } from "@/lib/actions";
import type { LeadStatus, LeadPriority, LeadSource } from "@/lib/actions";

const ALL_STATUSES: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const ALL_PRIORITIES: LeadPriority[] = ["Low", "Medium", "High", "Urgent"];
const ALL_SOURCES: LeadSource[] = ["AI Agent (Inbound)", "AI Agent (Outbound)", "Website", "Referral", "Google Ads", "Social Media", "Walk-in", "Manual", "Other"];

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddLeadModal({ onClose, onAdded }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    status: "New" as LeadStatus,
    priority: "Medium" as LeadPriority,
    source: "Manual" as LeadSource,
    note: "",
  });
  const [tagsStr, setTagsStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError("Name and Phone are required.");
      return;
    }
    
    // Basic phone validation (just checking if it has digits)
    if (!/\d/.test(formData.phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSaving(true);
    setError("");

    const tags = tagsStr.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    
    const success = await addNewLead({
      ...formData,
      tags,
    });

    setSaving(false);

    if (success) {
      onAdded();
      onClose();
    } else {
      setError("Failed to add lead. A lead with this phone number might already exist.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-[#30363d] flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-[#e6edf3]">
            Add New Lead
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-[#21262d] rounded-md text-gray-500 dark:text-[#8b949e]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <form id="add-lead-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-500/20">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7]"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> City/Location
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York, NY"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9]">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7]"
                >
                  {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9]">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as LeadPriority })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7]"
                >
                  {ALL_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9]">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7]"
                >
                  {ALL_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="VIP, Follow-up, Enterprise"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7]"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9]">Initial Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Add any initial context or notes..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#2f81f7]/40 focus:border-[#2f81f7] resize-none"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117] flex justify-end gap-3 flex-shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-[#8b949e] hover:bg-gray-200 dark:hover:bg-[#21262d] rounded-lg transition-colors border border-transparent"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="add-lead-form"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-[#2f81f7] hover:bg-[#2672d9] text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? "Saving..." : "Add Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
