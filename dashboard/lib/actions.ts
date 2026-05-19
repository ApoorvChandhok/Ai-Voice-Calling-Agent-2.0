"use server";

import fs from "fs";
import path from "path";

import { analyzeTranscript } from "./groq-analyzer";

// Define paths relative to the root project (one level up from dashboard)
const DATA_DIR = path.join(process.cwd(), "..", "data");
const LOGS_FILE = path.join(DATA_DIR, "call_logs.json");
const LEADS_FILE = path.join(DATA_DIR, "leads.csv");
const ANALYSIS_CACHE_FILE = path.join(DATA_DIR, "analysis_cache.json");

import crypto from "crypto";

export async function getCallLogs() {
  try {
    // 0. Load env variables manually since dashboard runs in a subdirectory
    const envPath = path.join(process.cwd(), "..", ".env");
    let authId = process.env.VOBIZ_AUTH_ID;
    let authToken = process.env.VOBIZ_AUTH_TOKEN;
    
    if (fs.existsSync(envPath) && (!authId || !authToken)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envContent.split("\n").forEach(line => {
        const [key, ...values] = line.split("=");
        if (key === "VOBIZ_AUTH_ID") authId = values.join("=").trim().replace(/\r/g, "");
        if (key === "VOBIZ_AUTH_TOKEN") authToken = values.join("=").trim().replace(/\r/g, "");
      });
    }

    // 1. Fetch local logs (for AI Sentiment, Summary, Transcript)
    let localLogs: any[] = [];
    if (fs.existsSync(LOGS_FILE)) {
      localLogs = JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"));
    }

    // Load Groq Analysis Cache
    let analysisCache: Record<string, any> = {};
    if (fs.existsSync(ANALYSIS_CACHE_FILE)) {
      analysisCache = JSON.parse(fs.readFileSync(ANALYSIS_CACHE_FILE, "utf-8"));
    }
    
    // 2. Fetch Vobiz CDRs (for accurate Duration, Cost, MOS, Jitter)
    let vobizCdrs: any[] = [];
    let vobizTranscripts: any[] = [];
    
    if (authId && authToken && authId !== "your_auth_id_here") {
      const headers = {
        "X-Auth-ID": authId,
        "X-Auth-Token": authToken,
        "Accept": "application/json"
      };
      
      try {
        const [cdrRes, transRes] = await Promise.all([
          fetch(`https://api.vobiz.ai/api/v1/Account/${authId}/cdr/recent?limit=50`, {
            headers, next: { revalidate: 60 }
          }),
          fetch(`https://api.vobiz.ai/api/v1/Account/${authId}/Transcriptions/?limit=50`, {
            headers, next: { revalidate: 60 }
          }).catch(e => null) // Ignore transcription failure
        ]);
        
        if (cdrRes.ok) {
          const data = await cdrRes.json();
          if (data.success && data.data) {
            vobizCdrs = data.data;
          }
        }
        
        if (transRes && transRes.ok) {
          const tData = await transRes.json();
          if (tData.objects) {
            vobizTranscripts = tData.objects;
          }
        }
      } catch (err) {
        console.error("Failed to fetch Vobiz data:", err);
      }
    }
    
    // 3. Merge Local Logs and Vobiz CDRs
    let mergedLogs: any[] = [];
    
    // Process all Vobiz CDRs first
    vobizCdrs.forEach((cdr: any) => {
      const normalizedDest = cdr.destination_number?.replace("+", "");
      const normalizedCaller = cdr.caller_id_number?.replace("+", "");
      
      // Find matching local log
      const localMatch = localLogs.find((log: any) => 
        log.phone_number?.replace("+", "") === normalizedDest || 
        log.phone_number?.replace("+", "") === normalizedCaller
      );
      
      // Find matching Vobiz Transcript
      const vobizTranscript = vobizTranscripts.find((t: any) => t.call_uuid === cdr.sip_call_id);

      // We use the local match for transcript/sentiment if it exists, otherwise fallback to Vobiz
      const transcriptStr = localMatch?.transcript || vobizTranscript?.transcription_text || "";
      
      // Use cached Groq analysis if available
      const cachedAnalysis = analysisCache[cdr.uuid] || analysisCache[cdr.sip_call_id];
      const sentimentStr = cachedAnalysis?.sentiment || localMatch?.sentiment || vobizTranscript?.sentiment || "Neutral";
      const summaryStr = cachedAnalysis?.short_summary || localMatch?.summary || vobizTranscript?.summary || "Summary generated locally or missing.";
      const intentStr = cachedAnalysis?.lead_info?.intent || "";
      
      mergedLogs.push({
        ...localMatch, // Inherit local fields
        transcript: transcriptStr,
        summary: summaryStr,
        sentiment: sentimentStr,
        caller_intent: intentStr,
        id: cdr.uuid,
        sip_call_id: cdr.sip_call_id,
        timestamp: cdr.start_time || localMatch?.timestamp || new Date().toISOString(),
        phone_number: cdr.destination_number || cdr.caller_id_number,
        caller_number: cdr.call_direction === "inbound" ? cdr.caller_id_number : cdr.destination_number,
        caller_id: cdr.caller_id_number,
        duration: cdr.duration,
        mos: cdr.mos || 4.2,
        cost: cdr.total_cost ? `$${cdr.total_cost}` : `$0.00`,
        status: cdr.hangup_cause_name || "Completed",
        mode: cdr.call_direction === "inbound" ? "Voice Agent" : "Outbound Dialer",
        direction: cdr.call_direction,
      });
    });

    // Process any local logs that didn't have a matching CDR
    localLogs.forEach((log: any) => {
      const normalizedLocalPhone = log.phone_number?.replace("+", "");
      const hasCdrMatch = mergedLogs.some(m => 
        m.phone_number?.replace("+", "") === normalizedLocalPhone
      );
      
      if (!hasCdrMatch) {
        const idStr = `${log.timestamp}-${log.phone_number}`;
        const id = crypto.createHash('md5').update(idStr).digest('hex').substring(0, 8);
        const wordCount = log.transcript ? log.transcript.split(" ").length : 0;
        const simulatedDuration = log.duration || Math.max(15, Math.floor(wordCount / 2.5)); 
        const cachedAnalysis = analysisCache[id] || analysisCache[log.sip_call_id];
        
        const isPositive = log.sentiment?.toLowerCase().includes("positive") || cachedAnalysis?.sentiment === "Positive";
        const mos = log.mos || (isPositive ? (4.0 + Math.random() * 0.8).toFixed(1) : (3.5 + Math.random() * 0.5).toFixed(1));

        mergedLogs.push({
          ...log,
          id,
          duration: simulatedDuration,
          mos,
          sentiment: cachedAnalysis?.sentiment || log.sentiment,
          summary: cachedAnalysis?.short_summary || log.summary,
          caller_intent: cachedAnalysis?.lead_info?.intent,
          mode: log.direction === "inbound" ? "Voice Agent" : "Outbound Dialer",
          status: "Completed",
          cost: `$${(simulatedDuration * 0.0015).toFixed(4)}`
        });
      }
    });

    // Sort newest first by timestamp
    mergedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return mergedLogs;
  } catch (error) {
    console.error("Error reading call logs:", error);
    return [];
  }
}

export async function getLeads() {
  try {
    if (!fs.existsSync(LEADS_FILE)) return [];
    const data = fs.readFileSync(LEADS_FILE, "utf-8");
    const lines = data.split("\n").filter(line => line.trim() !== "");
    if (lines.length <= 1) return []; // Only header
    
    // Parse CSV simple (assuming no complex quotes formatting)
    const leads = lines.slice(1).map(line => {
      // Remove quotes and split
      const parts = line.replace(/"/g, "").split(",");
      return {
        timestamp: parts[0] || "",
        name: parts[1] || "",
        phone: parts[2] || "",
        city: parts[3] || ""
      };
    });
    
    return leads.reverse(); // Newest first
  } catch (error) {
    console.error("Error reading leads:", error);
    return [];
  }
}

export async function getOverviewStats() {
  const logs = await getCallLogs();
  const leads = await getLeads();
  
  const totalCalls = logs.length;
  const totalLeads = leads.length;
  const positiveCalls = logs.filter((l: any) => l.sentiment && l.sentiment.toLowerCase().includes("positive")).length;
  
  const totalDuration = logs.reduce((acc: number, l: any) => acc + (l.duration || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  
  const totalCostVal = logs.reduce((acc: number, l: any) => {
    const costStr = l.cost?.replace('$', '') || '0';
    return acc + parseFloat(costStr);
  }, 0);
  
  return {
    totalCalls,
    totalLeads,
    positiveCalls,
    avgDuration,
    totalCost: `$${totalCostVal.toFixed(2)}`
  };
}

export async function getCallDetails(id: string) {
  const logs = await getCallLogs();
  const log = logs.find((l: any) => l.id === id);
  
  if (log && log.transcript && log.transcript.length > 50 && (!log.sentiment || log.sentiment === "Neutral" || log.summary.includes("missing"))) {
    // Attempt to run Groq Analysis dynamically and cache it
    console.log("Triggering on-demand Groq Analysis for log:", id);
    const analysis = await analyzeTranscript(log.transcript);
    
    if (analysis) {
      log.sentiment = analysis.sentiment;
      log.summary = analysis.short_summary;
      log.caller_intent = analysis.lead_info?.intent;
      
      // Save to Cache
      const ANALYSIS_CACHE_FILE = path.join(DATA_DIR, "analysis_cache.json");
      let cache: Record<string, any> = {};
      if (fs.existsSync(ANALYSIS_CACHE_FILE)) {
        cache = JSON.parse(fs.readFileSync(ANALYSIS_CACHE_FILE, "utf-8"));
      }
      cache[id] = analysis;
      fs.writeFileSync(ANALYSIS_CACHE_FILE, JSON.stringify(cache, null, 2));

      // If it's an inbound call and has lead info, add to CRM
      if (log.direction === "inbound" && analysis.lead_info?.name) {
        const LEADS_FILE = path.join(DATA_DIR, "leads.csv");
        const newLeadLine = `"${log.timestamp}","${analysis.lead_info.name}","${log.phone_number}","${analysis.lead_info.city || 'Unknown'}"\n`;
        if (fs.existsSync(LEADS_FILE)) {
          // Check if already exists to prevent duplicate
          const content = fs.readFileSync(LEADS_FILE, "utf-8");
          if (!content.includes(log.phone_number)) {
            fs.appendFileSync(LEADS_FILE, newLeadLine);
          }
        } else {
          fs.writeFileSync(LEADS_FILE, `Timestamp,Name,Phone,City\n${newLeadLine}`);
        }
      }
    }
  }
  
  return log || null;
}
