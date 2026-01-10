"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface AdminDashboardProps {
  userId: Id<"users">;
}

export function AdminDashboard({ userId }: AdminDashboardProps) {
  const redFlags = useQuery(api.adminRedFlags.getRedFlagsSummary, { adminId: userId });
  const allUTIDs = useQuery(api.introspection.getAllActiveUTIDs, { adminId: userId });
  const pilotMode = useQuery(api.pilotMode.getPilotMode);
  const purchaseWindowStatus = useQuery(api.buyerDashboard.getPurchaseWindowStatus, { buyerId: userId });
  
  const openPurchaseWindow = useMutation(api.admin.openPurchaseWindow);
  const closePurchaseWindow = useMutation(api.admin.closePurchaseWindow);
  
  const [reason, setReason] = useState("");
  const [windowActionLoading, setWindowActionLoading] = useState(false);
  const [windowActionMessage, setWindowActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  return (
    <div>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "1.5rem", color: "#1a1a1a" }}>
        Admin Dashboard
      </h2>

      {/* Red Flags Summary */}
      <div style={{
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
          Red Flags (High-Risk Signals)
        </h3>
        {redFlags === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div style={{ padding: "1rem", background: "#ffebee", borderRadius: "8px", border: "1px solid #ef5350" }}>
              <div style={{ fontSize: "2rem", fontWeight: "600", color: "#c62828" }}>
                {redFlags.deliveriesPastSLA || 0}
              </div>
              <div style={{ color: "#666", fontSize: "0.9rem" }}>Deliveries Past SLA</div>
            </div>
            <div style={{ padding: "1rem", background: "#fff3cd", borderRadius: "8px", border: "1px solid #ffc107" }}>
              <div style={{ fontSize: "2rem", fontWeight: "600", color: "#856404" }}>
                {redFlags.tradersNearSpendCap || 0}
              </div>
              <div style={{ color: "#666", fontSize: "0.9rem" }}>Traders Near Cap</div>
            </div>
            <div style={{ padding: "1rem", background: "#e3f2fd", borderRadius: "8px", border: "1px solid #2196f3" }}>
              <div style={{ fontSize: "2rem", fontWeight: "600", color: "#1565c0" }}>
                {redFlags.highStorageLossInventory || 0}
              </div>
              <div style={{ color: "#666", fontSize: "0.9rem" }}>High Storage Loss</div>
            </div>
            <div style={{ padding: "1rem", background: "#f3e5f5", borderRadius: "8px", border: "1px solid #9c27b0" }}>
              <div style={{ fontSize: "2rem", fontWeight: "600", color: "#6a1b9a" }}>
                {redFlags.buyersApproachingPickupSLA || 0}
              </div>
              <div style={{ color: "#666", fontSize: "0.9rem" }}>Buyers Near Pickup SLA</div>
            </div>
          </div>
        )}
      </div>

      {/* System UTIDs */}
      <div style={{
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
          System UTIDs
        </h3>
        {allUTIDs === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : (
          <div>
            <p style={{ color: "#666" }}>
              Total active UTIDs: <strong>{allUTIDs.totalUTIDs}</strong>
            </p>
            <div style={{ marginTop: "1rem", maxHeight: "400px", overflowY: "auto" }}>
              {allUTIDs.utids.slice(0, 20).map((utidData: any, index: number) => (
                <div key={index} style={{
                  padding: "0.75rem",
                  marginBottom: "0.5rem",
                  background: "#f5f5f5",
                  borderRadius: "6px",
                  fontSize: "0.85rem"
                }}>
                  <div style={{ fontFamily: "monospace", fontWeight: "600", marginBottom: "0.25rem" }}>
                    {utidData.utid}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#666" }}>
                    Type: {utidData.type} | Status: {utidData.status || "active"}
                  </div>
                </div>
              ))}
              {allUTIDs.utids.length > 20 && (
                <p style={{ color: "#999", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                  ... and {allUTIDs.utids.length - 20} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Purchase Window Control */}
      <div style={{
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
          Purchase Window Control
        </h3>
        {purchaseWindowStatus === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : (
          <div>
            <div style={{
              padding: "1rem",
              background: purchaseWindowStatus.isOpen ? "#e8f5e9" : "#ffebee",
              borderRadius: "6px",
              border: `1px solid ${purchaseWindowStatus.isOpen ? "#4caf50" : "#ef5350"}`,
              marginBottom: "1rem"
            }}>
              <div style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                color: purchaseWindowStatus.isOpen ? "#2e7d32" : "#c62828",
                marginBottom: "0.5rem"
              }}>
                Status: {purchaseWindowStatus.isOpen ? "✅ OPEN" : "❌ CLOSED"}
              </div>
              {purchaseWindowStatus.isOpen && purchaseWindowStatus.openedAt && (
                <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>
                  Opened at: {new Date(purchaseWindowStatus.openedAt).toLocaleString()}
                </p>
              )}
            </div>
            
            <div style={{ marginTop: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#1a1a1a" }}>
                Reason (required):
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for opening/closing purchase window..."
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                  resize: "vertical"
                }}
              />
              
              {windowActionMessage && (
                <div style={{
                  marginTop: "0.75rem",
                  padding: "0.75rem",
                  background: windowActionMessage.type === "success" ? "#e8f5e9" : "#ffebee",
                  border: `1px solid ${windowActionMessage.type === "success" ? "#4caf50" : "#ef5350"}`,
                  borderRadius: "6px",
                  color: windowActionMessage.type === "success" ? "#2e7d32" : "#c62828",
                  fontSize: "0.9rem"
                }}>
                  {windowActionMessage.text}
                </div>
              )}
              
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
                {!purchaseWindowStatus.isOpen ? (
                  <button
                    onClick={async () => {
                      if (!reason.trim()) {
                        setWindowActionMessage({ type: "error", text: "Please provide a reason" });
                        return;
                      }
                      setWindowActionLoading(true);
                      setWindowActionMessage(null);
                      try {
                        const result = await openPurchaseWindow({
                          adminId: userId,
                          reason: reason.trim(),
                        });
                        setWindowActionMessage({
                          type: "success",
                          text: `Purchase window opened successfully! UTID: ${result.utid}`
                        });
                        setReason("");
                      } catch (error: any) {
                        setWindowActionMessage({
                          type: "error",
                          text: `Failed to open purchase window: ${error.message}`
                        });
                      } finally {
                        setWindowActionLoading(false);
                      }
                    }}
                    disabled={windowActionLoading}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: windowActionLoading ? "#ccc" : "#4caf50",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      cursor: windowActionLoading ? "not-allowed" : "pointer"
                    }}
                  >
                    {windowActionLoading ? "Opening..." : "Open Purchase Window"}
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (!reason.trim()) {
                        setWindowActionMessage({ type: "error", text: "Please provide a reason" });
                        return;
                      }
                      setWindowActionLoading(true);
                      setWindowActionMessage(null);
                      try {
                        const result = await closePurchaseWindow({
                          adminId: userId,
                          reason: reason.trim(),
                        });
                        setWindowActionMessage({
                          type: "success",
                          text: `Purchase window closed successfully! UTID: ${result.utid}`
                        });
                        setReason("");
                      } catch (error: any) {
                        setWindowActionMessage({
                          type: "error",
                          text: `Failed to close purchase window: ${error.message}`
                        });
                      } finally {
                        setWindowActionLoading(false);
                      }
                    }}
                    disabled={windowActionLoading}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: windowActionLoading ? "#ccc" : "#ef5350",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      cursor: windowActionLoading ? "not-allowed" : "pointer"
                    }}
                  >
                    {windowActionLoading ? "Closing..." : "Close Purchase Window"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pilot Mode Control */}
      <div style={{
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
          System Controls
        </h3>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          Use Convex dashboard to manage pilot mode and other system settings.
        </p>
        <div style={{ padding: "1rem", background: "#f5f5f5", borderRadius: "6px", marginBottom: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
            <strong>Available Admin Actions:</strong>
          </p>
          <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem", color: "#666", fontSize: "0.85rem" }}>
            <li>Set pilot mode (pilotMode.setPilotMode)</li>
            <li>Verify deliveries (admin.verifyDelivery)</li>
            <li>Reverse failed deliveries (admin.reverseDeliveryFailure)</li>
          </ul>
        </div>
        <div style={{ padding: "1rem", background: "#e3f2fd", borderRadius: "6px", border: "1px solid #2196f3" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#1565c0", fontWeight: "600", marginBottom: "0.5rem" }}>
            🚀 Demo Data Seeding
          </p>
          <p style={{ margin: "0.5rem 0", fontSize: "0.85rem", color: "#666" }}>
            Seed the system with demo data: farmer listings, trader wallets (1M UGX), and buyer wallets (2M UGX).
          </p>
          <a
            href="/admin/seed-demo"
            style={{
              display: "inline-block",
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              background: "#1976d2",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          >
            Seed Demo Data →
          </a>
        </div>
        <div style={{ padding: "1rem", background: "#ffebee", borderRadius: "6px", border: "1px solid #d32f2f", marginTop: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#c62828", fontWeight: "600", marginBottom: "0.5rem" }}>
            ⚠️ Reset All Transactions
          </p>
          <p style={{ margin: "0.5rem 0", fontSize: "0.85rem", color: "#666" }}>
            DANGEROUS: This will permanently delete all wallet transactions, unlock all units, delete all inventory, and reset all listings.
          </p>
          <a
            href="/admin/reset-transactions"
            style={{
              display: "inline-block",
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              background: "#d32f2f",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          >
            Reset All Transactions →
          </a>
        </div>
      </div>
    </div>
  );
}
