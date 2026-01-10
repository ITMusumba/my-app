"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard } from "./components/AdminDashboard";
import { TraderDashboard } from "./components/TraderDashboard";
import { FarmerDashboard } from "./components/FarmerDashboard";
import { BuyerDashboard } from "./components/BuyerDashboard";
import { Id } from "../convex/_generated/dataModel";

/**
 * Farm2Market Uganda - Live Dashboard
 * 
 * Shows real-time system status including:
 * - System operational status
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

  
  // Show loading if checking auth
  if (!user) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading...</p>
      </main>
    );
  }


  return (
    <main style={{ 
      padding: "2rem", 
      maxWidth: "1200px", 
      margin: "0 auto"
    }}>
      <div style={{ 
        marginBottom: "2rem", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        padding: "1.5rem",
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div>
          <h1 style={{ 
            fontSize: "2.5rem", 
            marginBottom: "0.5rem", 
            color: "#2c2c2c",
            fontWeight: "800",
            fontFamily: '"Montserrat", sans-serif',
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            textShadow: "0 1px 2px rgba(255,255,255,0.8)"
          }}>
            Farm2Market Uganda
          </h1>
          <p style={{ 
            color: "#2e7d32", 
            fontSize: "1.2rem",
            fontWeight: "600",
            fontFamily: '"Montserrat", sans-serif',
            letterSpacing: "0.1em",
            textTransform: "uppercase"
          }}>
            Farm. Trade. Grow.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ 
            color: "#333", 
            fontSize: "0.9rem", 
            marginBottom: "0.25rem",
            fontWeight: "500"
          }}>
            Logged in as: <strong style={{ color: "#1a1a1a" }}>{user.alias}</strong>
          </p>
          <p style={{ 
            color: "#555", 
            fontSize: "0.85rem", 
            marginBottom: "0.25rem",
            textTransform: "capitalize"
          }}>
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
              fontSize: "0.85rem",
              fontWeight: "500",
              color: "#333"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Role-Based Dashboard */}
      <div style={{
        marginTop: "1rem"
      }}>
        {user.role === "admin" && <AdminDashboard userId={user.userId as Id<"users">} />}
        {user.role === "trader" && <TraderDashboard userId={user.userId as Id<"users">} />}
        {user.role === "farmer" && <FarmerDashboard userId={user.userId as Id<"users">} />}
        {user.role === "buyer" && <BuyerDashboard userId={user.userId as Id<"users">} />}
      </div>
    </main>
  );
}
