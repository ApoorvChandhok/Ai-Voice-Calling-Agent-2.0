"use client";

import { useRef, useEffect, useState } from "react";
import { Activity, BrainCircuit, Phone, ChevronDown } from "lucide-react";

interface TranscriptViewerProps {
  transcriptLines: string[];
}

export default function TranscriptViewer({ transcriptLines }: TranscriptViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);

  // Gradually reveal lines to simulate auto-scrolling playback
  useEffect(() => {
    if (transcriptLines.length === 0) return;

    // Show all lines immediately, then auto-scroll to bottom
    setVisibleCount(transcriptLines.length);
  }, [transcriptLines]);

  // Auto-scroll to bottom whenever visibleCount changes
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [visibleCount, autoScroll]);

  // Detect manual scroll to pause auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
      setAutoScroll(true);
    }
  };

  return (
    <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl overflow-hidden shadow-sm flex flex-col transition-colors duration-200 relative" style={{ height: "600px" }}>
      <div className="p-5 border-b border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117] flex justify-between items-center transition-colors duration-200">
        <h3 className="font-semibold text-gray-900 dark:text-[#e6edf3] flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500 dark:text-[#2f81f7]" /> AI Transcript
        </h3>
        <span className="text-xs text-gray-500 dark:text-[#8b949e]">
          {autoScroll ? (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Auto-scrolling
            </span>
          ) : (
            "Scroll paused"
          )}
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar"
      >
        {transcriptLines.length > 0 ? (
          transcriptLines.slice(0, visibleCount).map((line: string, i: number) => {
            const lowerLine = line.toLowerCase();
            const isAgent = lowerLine.startsWith("assistant:") || lowerLine.startsWith("agent:") || lowerLine.startsWith("[agent]");

            let content = line;
            if (line.includes(":")) {
              content = line.split(":").slice(1).join(":").trim();
            } else if (line.startsWith("[")) {
              content = line.replace(/\[.*?\]\s*/, "").trim();
            }

            return (
              <div key={i} className={`flex w-full ${isAgent ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  isAgent
                    ? "bg-gray-100 text-gray-800 dark:bg-[#21262d] dark:text-[#e6edf3] border border-gray-200 dark:border-[#30363d] rounded-tl-sm"
                    : "bg-blue-50 text-blue-900 border border-blue-100 dark:bg-[#2f81f7]/20 dark:text-[#c9d1d9] dark:border-[#2f81f7]/30 rounded-tr-sm"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {isAgent ? <BrainCircuit className="w-3 h-3 text-gray-500 dark:text-[#8b949e]" /> : <Phone className="w-3 h-3 text-blue-500 dark:text-[#2f81f7]" />}
                    <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">
                      {isAgent ? "Voice Agent" : "Caller"}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed">{content}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-[#8b949e]">
            No transcript generated for this call.
          </div>
        )}
      </div>

      {/* Scroll-to-bottom button when not at bottom */}
      {!autoScroll && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 p-2 bg-blue-600 dark:bg-[#2f81f7] text-white rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-[#1f6feb] transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
