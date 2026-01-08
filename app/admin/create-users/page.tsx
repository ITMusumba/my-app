"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

/**
 * Admin Page - Create Pilot Users
 * 
 * Simple UI to create all test users for the pilot
 */
export default function CreateUsersPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const createUser = useMutation(api.auth.createUser);

  const users = [
    { email: "farmer1@pilot.farm2market", role: "farmer" as const },
    { email: "farmer2@pilot.farm2market", role: "farmer" as const },
    { email: "trader1@pilot.farm2market", role: "trader" as const },
    { email: "trader2@pilot.farm2market", role: "trader" as const },
    { email: "buyer1@pilot.farm2market", role: "buyer" as const },
    { email: "admin@pilot.farm2market", role: "admin" as const },
  ];

  const handleCreateAll = async () => {
    setLoading(true);
    setResults([]);
    const newResults: any[] = [];

    for (const user of users) {
      try {
        const result = await createUser({
          email: user.email,
          role: user.role,
        });
        newResults.push({
          email: user.email,
          role: user.role,
          status: "success",
          alias: result.alias,
          userId: result.userId,
        });
      } catch (error: any) {
        newResults.push({
          email: user.email,
          role: user.role,
          status: "error",
          error: error.message,
        });
      }
    }

    setResults(newResults);
    setLoading(false);
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Create Pilot Test Users</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Create all test users for the pilot. All users will share password: <strong>Farm2Market2024</strong>
      </p>

      <button
        onClick={handleCreateAll}
        disabled={loading}
        style={{
          padding: "1rem 2rem",
          background: loading ? "#ccc" : "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontSize: "1rem",
          fontWeight: "500",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "2rem"
        }}
      >
        {loading ? "Creating users..." : "Create All Test Users"}
      </button>

      {results.length > 0 && (
        <div>
          <h2>Results</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {results.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: "1rem",
                  background: result.status === "success" ? "#e8f5e9" : "#ffebee",
                  border: `1px solid ${result.status === "success" ? "#4caf50" : "#ef5350"}`,
                  borderRadius: "6px"
                }}
              >
                <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                  {result.email} ({result.role})
                </div>
                {result.status === "success" ? (
                  <div style={{ color: "#2e7d32", fontSize: "0.9rem" }}>
                    ✓ Created - Alias: {result.alias}
                  </div>
                ) : (
                  <div style={{ color: "#c62828", fontSize: "0.9rem" }}>
                    ✗ Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "2rem", padding: "1rem", background: "#fff3cd", borderRadius: "6px" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#856404" }}>
          <strong>Note:</strong> If a user already exists, you'll see an error. That's okay - just use the existing account to login.
        </p>
      </div>
    </main>
  );
}
