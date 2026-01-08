"use client";

import { api } from "../convex/_generated/api";
import { useEffect, useState } from "react";
import { PilotModeStatusComponent } from "./components/PilotModeStatus";

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
  
  // Safely check if pilotMode module exists in API
  const pilotModeQuery = (api as any).pilotMode?.getPilotMode;

  useEffect(() => {
    setMounted(true);
  }, []);

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
        ) : !pilotModeQuery ? (
          <div style={{ padding: "1rem", background: "#fff3cd", borderRadius: "8px", border: "1px solid #ffc107" }}>
            <p style={{ margin: 0, color: "#856404" }}>
              ⚠️ Convex API not fully generated. Please run <code style={{ background: "#f5f5f5", padding: "2px 6px", borderRadius: "4px" }}>npx convex deploy</code> to regenerate the API.
            </p>
          </div>
        ) : (
          <PilotModeStatusComponent query={pilotModeQuery} />
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
            <strong>Status:</strong> {mounted && pilotModeQuery ? "Connected" : "Not Connected"}
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
