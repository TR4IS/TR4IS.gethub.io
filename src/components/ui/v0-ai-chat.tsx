"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MonitorIcon,
  Globe,
  Terminal,
  Cpu,
  Music2,
  ArrowUpIcon,
  Paperclip,
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
      if (reset) { textarea.style.height = `${minHeight}px`; return; }
      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY));
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

const PRESETS = [
  { icon: <MonitorIcon className="w-4 h-4" />, label: "Windows App", text: "I need a Windows desktop app that " },
  { icon: <Globe className="w-4 h-4" />, label: "Web Tool", text: "I need a web-based tool that " },
  { icon: <Terminal className="w-4 h-4" />, label: "CLI / Script", text: "I need a command-line tool or script that " },
  { icon: <Cpu className="w-4 h-4" />, label: "Automation", text: "I need an automation tool that " },
  { icon: <Music2 className="w-4 h-4" />, label: "Media / Audio", text: "I need a media or audio tool that " },
];

export function VercelV0Chat() {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 72, maxHeight: 220 });

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const subject = encodeURIComponent("Tool Commission — n3trunner.dev");
    const body = encodeURIComponent(trimmed);
    window.location.href = `mailto:contact@n3trunner.dev?subject=${subject}&body=${body}`;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setValue("");
      adjustHeight(true);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const border = "rgba(139,92,246,.22)";
  const borderHover = "rgba(139,92,246,.5)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "32px" }}>

      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".80rem", color: "#8b5cf6", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "10px" }}>
          // what do you need built?
        </p>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.5rem,6vw,4.5rem)", letterSpacing: "4px", lineHeight: .92, color: "#efefef", textShadow: "0 0 60px rgba(139,92,246,.35)", marginBottom: "12px" }}>
          DESCRIBE IT.<br />I'LL BUILD IT.
        </h2>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".88rem", color: "rgba(239,239,239,.38)", lineHeight: 1.85, maxWidth: "440px", margin: "0 auto" }}>
          Tell me what you need. I'll reply within 24 hours with a quote and timeline.
        </p>
      </div>

      <div style={{ width: "100%" }}>
        <div style={{ position: "relative", background: "rgba(6,6,6,.8)", border: `1px solid ${border}` }}>
          <div>
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => { setValue(e.target.value); adjustHeight(); }}
              onKeyDown={handleKeyDown}
              placeholder="Describe the tool — platform, purpose, key features, anything else..."
              className={cn(
                "w-full px-4 py-4 resize-none bg-transparent border-none",
                "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                "min-h-[72px] rounded-none"
              )}
              style={{ overflow: "hidden", color: "#efefef", fontFamily: "'JetBrains Mono',monospace", fontSize: ".88rem", lineHeight: 1.8 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: "1px solid rgba(139,92,246,.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 8px", background: "none", border: "none", color: "rgba(239,239,239,.28)", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: ".72rem", letterSpacing: "1px" }}
              >
                <Paperclip className="w-4 h-4" />
                <span>Attach</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleSend}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 18px",
                border: "1.5px solid",
                borderColor: value.trim() ? "#8b5cf6" : "rgba(139,92,246,.3)",
                background: value.trim() ? "#8b5cf6" : "transparent",
                color: value.trim() ? "#060606" : "rgba(239,239,239,.3)",
                fontFamily: "'JetBrains Mono',monospace", fontSize: ".76rem",
                fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase",
                cursor: value.trim() ? "pointer" : "default",
                transition: "all .2s",
              }}
            >
              {sent ? "✓ Opening mail" : (<><ArrowUpIcon className="w-4 h-4" /> Send</>)}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px", justifyContent: "center" }}>
          {PRESETS.map((p) => (
            <ActionButton
              key={p.label}
              icon={p.icon}
              label={p.label}
              onClick={() => { setValue(p.text); adjustHeight(); textareaRef.current?.focus(); }}
            />
          ))}
        </div>

        <p style={{ textAlign: "center", marginTop: "16px", fontFamily: "'JetBrains Mono',monospace", fontSize: ".72rem", color: "rgba(239,239,239,.2)", letterSpacing: "1px" }}>
          or email directly →{" "}
          <a href="mailto:contact@n3trunner.dev" style={{ color: "#8b5cf6", borderBottom: "1px solid rgba(139,92,246,.35)" }}>
            contact@n3trunner.dev
          </a>
        </p>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "8px 16px",
        border: `1px solid ${hov ? "rgba(139,92,246,.5)" : "rgba(139,92,246,.2)"}`,
        background: hov ? "rgba(139,92,246,.08)" : "rgba(6,6,6,.6)",
        color: hov ? "#efefef" : "rgba(239,239,239,.4)",
        fontFamily: "'JetBrains Mono',monospace", fontSize: ".76rem",
        letterSpacing: ".5px", cursor: "pointer", transition: "all .2s",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
