"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard } from "./components/AdminDashboard";
import { TraderDashboard } from "./components/TraderDashboard";
import { FarmerDashboard } from "./components/FarmerDashboard";
import { BuyerDashboard } from "./components/BuyerDashboard";
import { Id } from "../convex/_generated/dataModel";

/**
 * Farm2Market Uganda - Pilot Dashboard
 * 
 * Shows real-time system status including:
 * - Pilot mode status
 * - System statistics
 */

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Check if user is logged in (pilot mode)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pilot_user");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Redirect to login if not logged in
        router.push("/login");
      }
    }
  }, [router]);

  // Diagnostic: Check if Convex URL is available at runtime
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  const pilotMode = useQuery(api.pilotMode.getPilotMode);
  
  // Show loading if checking auth
  if (!user) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading...</p>
      </main>
    );
  }

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
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", color: "#1a1a1a" }}>
            Farm2Market Uganda
          </h1>
          <p style={{ color: "#666", fontSize: "1.1rem" }}>
            Controlled, negotiation-driven agricultural trading platform
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            Logged in as: <strong>{user.alias}</strong>
          </p>
          <p style={{ color: "#999", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
            Role: {user.role}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("pilot_user");
              router.push("/login");
            }}
            style={{
              padding: "0.5rem 1rem",
              background: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Diagnostic: Convex URL Check */}
      <div style={{
        marginBottom: "2rem",
        padding: "1rem",
        background: convexUrl ? "#e8f5e9" : "#ffebee",
        borderRadius: "8px",
        border: `1px solid ${convexUrl ? "#4caf50" : "#ef5350"}`
      }}>
        {convexUrl ? (
          <div>
            <p style={{ margin: 0, color: "#2e7d32", fontWeight: "600" }}>
              ✅ Convex URL present: {convexUrl}
            </p>
          </div>
        ) : (
          <div>
            <p style={{ margin: 0, color: "#c62828", fontWeight: "600" }}>
              ❌ NEXT_PUBLIC_CONVEX_URL is missing
            </p>
            <p style={{ margin: "0.5rem 0 0 0", color: "#666", fontSize: "0.9rem" }}>
              Please set this environment variable in Vercel project settings.
            </p>
          </div>
        )}
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
        
        {pilotMode === undefined ? (
          <div>
            <p style={{ color: "#999" }}>Connecting to Convex…</p>
            <p style={{ color: "#666", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              Check browser console for connection details.
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
            <strong>Status:</strong> {pilotMode !== undefined ? "Connected" : "Connecting..."}
          </p>
          <p style={{ margin: "0.5rem 0" }}>
            <strong>Backend:</strong> Convex
          </p>
          <p style={{ margin: "0.5rem 0" }}>
            <strong>Deployment:</strong> Vercel
          </p>
        </div>
      </div>

      {/* Role-Based Dashboard */}
      <div style={{
        marginTop: "2rem",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        {user.role === "admin" && <AdminDashboard userId={user.userId as Id<"users">} />}
        {user.role === "trader" && <TraderDashboard userId={user.userId as Id<"users">} />}
        {user.role === "farmer" && <FarmerDashboard userId={user.userId as Id<"users">} />}
        {user.role === "buyer" && <BuyerDashboard userId={user.userId as Id<"users">} />}
      </div>
    </main>
  );
}
