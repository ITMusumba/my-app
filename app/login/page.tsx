"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

/**
 * Pilot Login Page
 * 
 * All test users share the same password: Farm2Market2024
 * ⚠️ PILOT ONLY - Simple authentication for testing
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const login = useMutation(api.auth.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login({
        email,
        password,
      });

      // Store user info in localStorage (pilot only)
      localStorage.setItem("pilot_user", JSON.stringify(result));
      
      // Redirect to dashboard
      router.push("/");
    } catch (err: any) {
      const errorMessage = err.message || "Login failed";
      // Provide helpful error message
      if (errorMessage.includes("User not found") || errorMessage.includes("Invalid email")) {
        setError(`${errorMessage}. Make sure test users are created first using the pilotSetup.createPilotUsers mutation.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      padding: "2rem",
      background: "transparent"
    }}>
      <div style={{
        background: "#fff",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        maxWidth: "400px",
        width: "100%"
      }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1a1a1a" }}>
          Farm2Market Uganda
        </h1>
        <p style={{ color: "#666", marginBottom: "2rem", fontSize: "0.9rem" }}>
          Pilot Login - All test users share the same password
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#333", fontWeight: "500" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "1rem"
              }}
              placeholder="user@example.com"
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#333", fontWeight: "500" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "1rem"
              }}
              placeholder="Shared pilot password"
            />
            <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#666" }}>
              Shared password: <strong>Farm2Market2024</strong>
            </p>
          </div>

          {error && (
            <div style={{
              padding: "0.75rem",
              background: "#ffebee",
              border: "1px solid #ef5350",
              borderRadius: "6px",
              marginBottom: "1rem",
              color: "#c62828"
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: loading ? "#ccc" : "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{
          marginTop: "2rem",
          padding: "1rem",
          background: "#fff3cd",
          borderRadius: "6px",
          border: "1px solid #ffc107"
        }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#856404" }}>
            ⚠️ <strong>Pilot Mode:</strong> This is a test environment. All users share the same password.
          </p>
        </div>
      </div>
    </main>
  );
}
