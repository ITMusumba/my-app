"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type PilotModeStatus = {
  pilotMode: boolean;
  setBy: string | null;
  setAt: number | null;
  reason: string | null;
  utid: string | null;
};

interface PilotModeStatusProps {
  query: any; // The query function reference
}

export function PilotModeStatusComponent({ query }: PilotModeStatusProps) {
  const pilotMode = useQuery(query) as PilotModeStatus | undefined;

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  };

  if (pilotMode === undefined) {
    return (
      <div style={{ padding: "1rem", background: "#fff3cd", borderRadius: "8px", border: "1px solid #ffc107" }}>
        <p style={{ margin: 0, color: "#856404" }}>
          ⚠️ Connecting to Convex... Please wait.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "1rem"
      }}>
        <div style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: pilotMode.pilotMode ? "#ff4444" : "#4caf50",
          boxShadow: pilotMode.pilotMode ? "0 0 8px rgba(255,68,68,0.5)" : "0 0 8px rgba(76,175,80,0.5)"
        }} />
        <span style={{
          fontSize: "1.2rem",
          fontWeight: "600",
          color: pilotMode.pilotMode ? "#d32f2f" : "#2e7d32"
        }}>
          {pilotMode.pilotMode ? "PILOT MODE ACTIVE" : "PILOT MODE INACTIVE"}
        </span>
      </div>

      {pilotMode.pilotMode && (
        <div style={{
          marginTop: "1rem",
          padding: "1rem",
          background: "#ffebee",
          borderRadius: "8px",
          border: "1px solid #ef5350"
        }}>
          <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600", color: "#c62828" }}>
            ⚠️ All money and inventory mutations are blocked
          </p>
          <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
            Reason: {pilotMode.reason || "No reason provided"}
          </p>
          <p style={{ margin: "0.5rem 0 0 0", color: "#666", fontSize: "0.85rem" }}>
            Set at: {formatDate(pilotMode.setAt)} ({formatTimeAgo(pilotMode.setAt)})
          </p>
          {pilotMode.utid && (
            <p style={{ margin: "0.5rem 0 0 0", color: "#999", fontSize: "0.8rem", fontFamily: "monospace" }}>
              UTID: {pilotMode.utid}
            </p>
          )}
        </div>
      )}

      {!pilotMode.pilotMode && (
        <div style={{
          marginTop: "1rem",
          padding: "1rem",
          background: "#e8f5e9",
          borderRadius: "8px",
          border: "1px solid #4caf50"
        }}>
          <p style={{ margin: 0, color: "#2e7d32" }}>
            ✅ System is operational. All mutations are allowed.
          </p>
        </div>
      )}
    </div>
  );
}
