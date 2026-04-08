export default function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "lg" }) {
  const colors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    running: { bg: "rgba(27,88,66,0.34)", text: "#8dffc2", border: "rgba(89,242,163,0.4)", glow: "rgba(89,242,163,0.18)" },
    active: { bg: "rgba(27,88,66,0.34)", text: "#8dffc2", border: "rgba(89,242,163,0.4)", glow: "rgba(89,242,163,0.18)" },
    connected: { bg: "rgba(27,88,66,0.34)", text: "#8dffc2", border: "rgba(89,242,163,0.4)", glow: "rgba(89,242,163,0.18)" },
    inactive: { bg: "rgba(33,78,97,0.34)", text: "#7eeeff", border: "rgba(57,230,255,0.38)", glow: "rgba(57,230,255,0.18)" },
    paused: { bg: "rgba(120,88,25,0.35)", text: "#ffd57a", border: "rgba(255,177,74,0.42)", glow: "rgba(255,177,74,0.18)" },
    stopped: { bg: "rgba(112,40,44,0.38)", text: "#ff9898", border: "rgba(255,132,121,0.42)", glow: "rgba(255,132,121,0.18)" },
    error: { bg: "rgba(112,40,44,0.38)", text: "#ff9898", border: "rgba(255,132,121,0.42)", glow: "rgba(255,132,121,0.18)" },
    disconnected: { bg: "rgba(112,40,44,0.38)", text: "#ff9898", border: "rgba(255,132,121,0.42)", glow: "rgba(255,132,121,0.18)" },
    completed: { bg: "rgba(33,78,97,0.34)", text: "#7eeeff", border: "rgba(57,230,255,0.38)", glow: "rgba(57,230,255,0.18)" },
  };

  const c = colors[status.toLowerCase()] || { bg: "rgba(66,38,92,0.45)", text: "#f8ccef", border: "rgba(255,255,255,0.16)", glow: "transparent" };
  const padding = size === "lg" ? "px-3 py-1" : "px-2.5 py-0.5";
  const textSize = size === "lg" ? "text-sm" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} rounded-full ${textSize} font-medium`}
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        boxShadow: `0 0 12px ${c.glow}`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full status-pulse" style={{ backgroundColor: c.text }} />
      {status}
    </span>
  );
}
