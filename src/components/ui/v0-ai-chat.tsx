"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  FileUp,
  PenTool,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  PlusIcon,
} from "lucide-react";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }
      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

export function VercelV0Chat() {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        setValue("");
        adjustHeight(true);
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-2">
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.8rem",
            color: "#8b5cf6",
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          // build your node
        </p>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            letterSpacing: "4px",
            lineHeight: 0.92,
            color: "#efefef",
            textShadow: "0 0 80px rgba(139,92,246,.35)",
          }}
        >
          WHAT SHOULD<br />WE BUILD?
        </h2>
      </div>

      <div className="w-full">
        <div
          className="relative border"
          style={{
            background: "rgba(6,6,6,.8)",
            borderColor: "rgba(139,92,246,.22)",
            borderRadius: 0,
          }}
        >
          <div className="overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Describe your node — layout, colors, vibe..."
              className={cn(
                "w-full px-4 py-3",
                "resize-none",
                "bg-transparent",
                "border-none",
                "text-sm",
                "focus:outline-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "min-h-[60px]",
                "rounded-none"
              )}
              style={{
                overflow: "hidden",
                color: "#efefef",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </div>

          <div className="flex items-center justify-between p-3" style={{ borderTop: "1px solid rgba(139,92,246,.14)" }}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="group flex items-center gap-1 transition-colors"
                style={{ padding: "8px", background: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,92,246,.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <Paperclip className="w-4 h-4" style={{ color: "#efefef" }} />
                <span
                  className="text-xs hidden group-hover:inline transition-opacity"
                  style={{ color: "#8b5cf6" }}
                >
                  Attach
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1 text-sm transition-colors"
                style={{
                  padding: "4px 8px",
                  border: "1px dashed rgba(139,92,246,.35)",
                  color: "rgba(239,239,239,.4)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.72rem",
                  letterSpacing: "1px",
                  background: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139,92,246,.7)";
                  e.currentTarget.style.color = "#efefef";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139,92,246,.35)";
                  e.currentTarget.style.color = "rgba(239,239,239,.4)";
                }}
              >
                <PlusIcon className="w-4 h-4" />
                Project
              </button>
              <button
                type="button"
                className="flex items-center gap-1 transition-colors"
                style={{
                  padding: "6px",
                  border: "1.5px solid",
                  borderColor: value.trim() ? "#8b5cf6" : "rgba(139,92,246,.35)",
                  background: value.trim() ? "#8b5cf6" : "transparent",
                  color: value.trim() ? "#060606" : "rgba(239,239,239,.4)",
                  transition: "all .2s",
                }}
              >
                <ArrowUpIcon className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          <ActionButton icon={<ImageIcon className="w-4 h-4" />} label="Clone a Screenshot" />
          <ActionButton icon={<PenTool className="w-4 h-4" />} label="Import from Figma" />
          <ActionButton icon={<FileUp className="w-4 h-4" />} label="Upload a Project" />
          <ActionButton icon={<MonitorIcon className="w-4 h-4" />} label="Landing Page" />
          <ActionButton icon={<CircleUserRound className="w-4 h-4" />} label="Sign Up Form" />
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
}

function ActionButton({ icon, label }: ActionButtonProps) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 transition-colors"
      style={{
        padding: "8px 16px",
        border: "1px solid rgba(139,92,246,.22)",
        background: "rgba(6,6,6,.6)",
        color: "rgba(239,239,239,.4)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.74rem",
        letterSpacing: "0.5px",
        borderRadius: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(139,92,246,.5)";
        e.currentTarget.style.color = "#efefef";
        e.currentTarget.style.background = "rgba(139,92,246,.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(139,92,246,.22)";
        e.currentTarget.style.color = "rgba(239,239,239,.4)";
        e.currentTarget.style.background = "rgba(6,6,6,.6)";
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
