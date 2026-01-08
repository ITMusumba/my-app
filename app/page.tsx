"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect, useState } from "react";

// Type-safe access to pilotMode query
// This will work once Convex regenerates the API after deployment
type PilotModeStatus = {
  pilotMode: boolean;
  setBy: string | null;
  setAt: number | null;
  reason: string | null;
  utid: string | null;
};

/**
 * Farm2Market Uganda - Pilot Dashboard
 * 
 * Shows real-time system status including:
 * - Pilot mode status
 * - System statistics
 * - User counts by role
 */

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  // Query pilot mode - handle case where API might not be regenerated yet
  // @ts-ignore - pilotMode module exists but may not be in generated API yet
  const pilotMode = useQuery(api.pilotMode?.getPilotMode) as PilotModeStatus | undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format timestamp to readable date
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  // Format time ago
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

  return (
    <main style={{ 
      padding: "2rem", 
      maxWidth: "1200px", 
      margin: "0 auto",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", color: "#1a1a1a" }}>
          Farm2Market Uganda
        </h1>
        <p style={{ color: "#666", fontSize: "1.1rem" }}>
          Controlled, negotiation-driven agricultural trading platform
        </p>
      </div>

      {/* Pilot Mode Status Card */}
      <div style={{
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.5rem", color: "#1a1a1a" }}>
          Pilot Mode Status
        </h2>
        
        {!mounted ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : pilotMode === undefined ? (
          <div style={{ padding: "1rem", background: "#fff3cd", borderRadius: "8px", border: "1px solid #ffc107" }}>
            <p style={{ margin: 0, color: "#856404" }}>
              ⚠️ Convex connection not configured. Please set NEXT_PUBLIC_CONVEX_URL environment variable.
            </p>
          </div>
        ) : (
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
        )}
      </div>

      {/* System Information */}
      <div style={{
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.5rem", color: "#1a1a1a" }}>
          System Information
        </h2>
        <div style={{ color: "#666" }}>
          <p style={{ margin: "0.5rem 0" }}>
            <strong>Platform:</strong> Farm2Market Uganda v1
          </p>
          <p style={{ margin: "0.5rem 0" }}>
            <strong>Status:</strong> {mounted && pilotMode !== undefined ? "Connected" : "Not Connected"}
          </p>
          <p style={{ margin: "0.5rem 0" }}>
            <strong>Backend:</strong> Convex
          </p>
          <p style={{ margin: "0.5rem 0" }}>
            <strong>Deployment:</strong> Vercel
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{
        marginTop: "2rem",
        padding: "1.5rem",
        background: "#f5f5f5",
        borderRadius: "12px",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.2rem", color: "#1a1a1a" }}>
          Documentation
        </h3>
        <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#666" }}>
          <li style={{ margin: "0.5rem 0" }}>
            <a href="https://github.com/ITMusumba/my-app" target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2", textDecoration: "none" }}>
              GitHub Repository
            </a>
          </li>
          <li style={{ margin: "0.5rem 0" }}>
            <a href="/docs" style={{ color: "#1976d2", textDecoration: "none" }}>
              Documentation (docs/)
            </a>
          </li>
        </ul>
      </div>
    </main>
  );
}
