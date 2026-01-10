"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface BuyerDashboardProps {
  userId: Id<"users">;
}

export function BuyerDashboard({ userId }: BuyerDashboardProps) {
  const inventory = useQuery(api.buyerDashboard.getAvailableInventory, { buyerId: userId });
  const windowStatus = useQuery(api.buyerDashboard.getPurchaseWindowStatus, { buyerId: userId });
  const orders = useQuery(api.buyerDashboard.getBuyerOrders, { buyerId: userId });
  const createPurchase = useMutation(api.buyers.createBuyerPurchase);
  
  const [purchasing, setPurchasing] = useState<Id<"traderInventory"> | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [kilosInput, setKilosInput] = useState<{ [key: string]: string }>({});

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeRemaining = (deadline: number) => {
    const now = Date.now();
    const diff = deadline - now;
    if (diff <= 0) return "OVERDUE";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const handlePurchase = async (inventoryId: Id<"traderInventory">, availableKilos: number) => {
    const kilosStr = kilosInput[inventoryId] || "";
    const kilos = parseFloat(kilosStr);

    if (!kilosStr || isNaN(kilos) || kilos <= 0) {
      setPurchaseMessage({ type: "error", text: "Please enter a valid quantity (kilos)" });
      return;
    }

    if (kilos > availableKilos) {
      setPurchaseMessage({ type: "error", text: `Requested quantity (${kilos} kg) exceeds available inventory (${availableKilos} kg)` });
      return;
    }

    setPurchasing(inventoryId);
    setPurchaseMessage(null);

    try {
      const result = await createPurchase({
        buyerId: userId,
        inventoryId: inventoryId,
        kilos: kilos,
      });

      setPurchaseMessage({
        type: "success",
        text: `Purchase successful! UTID: ${result.purchaseUtid}. You have 48 hours to pick up ${kilos} kg.`,
      });

      // Clear input
      setKilosInput({ ...kilosInput, [inventoryId]: "" });

      // Clear message after delay
      setTimeout(() => {
        setPurchaseMessage(null);
      }, 10000);
    } catch (error: any) {
      setPurchaseMessage({
        type: "error",
        text: `Purchase failed: ${error.message}`,
      });
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "100%", boxSizing: "border-box" }}>
      <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 1.8rem)", marginBottom: "1.5rem", color: "#1a1a1a" }}>
        Buyer Dashboard
      </h2>

      {/* Purchase Window Status */}
      <div style={{
        marginBottom: "1.5rem",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        background: windowStatus?.isOpen ? "#e8f5e9" : "#ffebee",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: `1px solid ${windowStatus?.isOpen ? "#4caf50" : "#ef5350"}`
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "clamp(1.1rem, 3.5vw, 1.3rem)", color: "#1a1a1a" }}>
          Purchase Window
        </h3>
        {windowStatus === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : (
          <div>
            <div style={{
              fontSize: "1.2rem",
              fontWeight: "600",
              color: windowStatus.isOpen ? "#2e7d32" : "#c62828",
              marginBottom: "0.5rem"
            }}>
              {windowStatus.isOpen ? "✅ OPEN" : "❌ CLOSED"}
            </div>
            {windowStatus.isOpen && (
              <p style={{ color: "#666", fontSize: "0.9rem" }}>
                You can purchase inventory now. Window opened at {formatDate(windowStatus.openedAt || 0)}.
              </p>
            )}
            {!windowStatus.isOpen && (
              <p style={{ color: "#666", fontSize: "0.9rem" }}>
                Purchase window is closed. Wait for admin to open it.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Available Inventory */}
      <div style={{
        marginBottom: "1.5rem",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "clamp(1.1rem, 3.5vw, 1.3rem)", color: "#1a1a1a" }}>
          Available Inventory
        </h3>
        
        {purchaseMessage && (
          <div style={{
            padding: "1rem",
            marginBottom: "1.5rem",
            background: purchaseMessage.type === "success" ? "#e8f5e9" : "#ffebee",
            borderRadius: "8px",
            border: `1px solid ${purchaseMessage.type === "success" ? "#4caf50" : "#ef5350"}`,
            color: purchaseMessage.type === "success" ? "#2e7d32" : "#c62828",
          }}>
            {purchaseMessage.text}
          </div>
        )}

        {inventory === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : inventory.inventory.length === 0 ? (
          <p style={{ color: "#666" }}>No inventory available</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {inventory.inventory.map((item: any, index: number) => {
              const itemId = item.inventoryId;
              const isPurchasing = purchasing === itemId;
              const canPurchase = windowStatus?.isOpen && !isPurchasing;
              
              return (
                <div key={index} style={{
                  padding: "clamp(1rem, 3vw, 1.5rem)",
                  background: "#f9f9f9",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0"
                }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontWeight: "600", marginBottom: "0.5rem", fontSize: "clamp(1rem, 3.5vw, 1.1rem)" }}>
                      {item.produceType}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: "0.75rem", fontSize: "clamp(0.85rem, 2.5vw, 0.9rem)", color: "#666" }}>
                      <div>
                        <div style={{ color: "#999", fontSize: "clamp(0.75rem, 2vw, 0.85rem)" }}>Available</div>
                        <div style={{ fontWeight: "600", color: "#1976d2", fontSize: "clamp(0.9rem, 3vw, 1rem)" }}>{item.totalKilos} kg</div>
                      </div>
                      <div>
                        <div style={{ color: "#999", fontSize: "clamp(0.75rem, 2vw, 0.85rem)" }}>Block Size</div>
                        <div style={{ fontWeight: "600", color: "#1a1a1a", fontSize: "clamp(0.9rem, 3vw, 1rem)" }}>{item.blockSize} kg</div>
                      </div>
                      <div>
                        <div style={{ color: "#999", fontSize: "clamp(0.75rem, 2vw, 0.85rem)" }}>Trader</div>
                        <div style={{ fontWeight: "600", color: "#1a1a1a", fontSize: "clamp(0.9rem, 3vw, 1rem)" }}>{item.traderAlias}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #e0e0e0" }}>
                      <div style={{ color: "#999", fontSize: "clamp(0.7rem, 2vw, 0.75rem)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Transaction UTID
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: "clamp(0.75rem, 2.5vw, 0.85rem)", color: "#666", wordBreak: "break-all" }}>
                        {item.inventoryUtid}
                      </div>
                    </div>
                  </div>

                  {windowStatus?.isOpen ? (
                    <div style={{ 
                      padding: "clamp(0.75rem, 2.5vw, 1rem)", 
                      background: "#fff", 
                      borderRadius: "6px",
                      border: "1px solid #e0e0e0"
                    }}>
                      <div style={{ marginBottom: "0.75rem", fontSize: "clamp(0.85rem, 2.5vw, 0.9rem)", color: "#666" }}>
                        <strong>Make Purchase:</strong> Enter quantity (kilos)
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                          <input
                            type="number"
                            min="1"
                            max={item.totalKilos}
                            step="0.01"
                            value={kilosInput[itemId] || ""}
                            onChange={(e) => setKilosInput({ ...kilosInput, [itemId]: e.target.value })}
                            placeholder="Enter kilos"
                            disabled={isPurchasing}
                            style={{
                              padding: "clamp(0.6rem, 2vw, 0.75rem)",
                              border: "1px solid #ddd",
                              borderRadius: "6px",
                              fontSize: "clamp(0.85rem, 2.5vw, 0.9rem)",
                              flex: "1",
                              minWidth: "120px",
                              fontFamily: "inherit"
                            }}
                          />
                          <button
                            onClick={() => handlePurchase(itemId, item.totalKilos)}
                            disabled={isPurchasing || !kilosInput[itemId] || parseFloat(kilosInput[itemId] || "0") <= 0}
                            style={{
                              padding: "clamp(0.6rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)",
                              background: isPurchasing || !kilosInput[itemId] || parseFloat(kilosInput[itemId] || "0") <= 0 ? "#ccc" : "#1976d2",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "clamp(0.85rem, 2.5vw, 0.9rem)",
                              fontWeight: "600",
                              cursor: isPurchasing || !kilosInput[itemId] || parseFloat(kilosInput[itemId] || "0") <= 0 ? "not-allowed" : "pointer",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {isPurchasing ? "Purchasing..." : "Purchase"}
                          </button>
                        </div>
                        <div style={{ fontSize: "clamp(0.75rem, 2vw, 0.85rem)", color: "#666" }}>
                          Max: {item.totalKilos} kg
                        </div>
                      </div>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "clamp(0.7rem, 2vw, 0.8rem)", color: "#999" }}>
                        ⚠️ You have 48 hours to pick up after purchase.
                      </p>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: "1rem", 
                      background: "#fff3cd", 
                      borderRadius: "6px",
                      border: "1px solid #ffc107",
                      color: "#856404",
                      fontSize: "0.9rem"
                    }}>
                      Purchase window is closed. Wait for admin to open it.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Orders */}
      <div style={{
        padding: "clamp(1rem, 3vw, 1.5rem)",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "clamp(1.1rem, 3.5vw, 1.3rem)", color: "#1a1a1a" }}>
          My Orders
        </h3>
        {orders === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : orders.orders.length === 0 ? (
          <p style={{ color: "#666" }}>No orders yet</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {orders.orders.map((order: any, index: number) => (
              <div key={index} style={{
                padding: "1rem",
                background: order.status === "overdue" ? "#ffebee" : "#e8f5e9",
                borderRadius: "8px",
                border: `1px solid ${order.status === "overdue" ? "#ef5350" : "#4caf50"}`
              }}>
                <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                  {order.produceType} - {order.kilos} kg
                </div>
                <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>
                  Pickup deadline: {formatDate(order.pickupSLA)}
                </div>
                <div style={{
                  fontSize: "clamp(0.85rem, 2.5vw, 0.9rem)",
                  fontWeight: "600",
                  color: order.isPastDeadline ? "#c62828" : "#2e7d32"
                }}>
                  {order.isPastDeadline ? `${order.hoursOverdue.toFixed(1)}h overdue` : `${order.hoursRemaining.toFixed(1)}h remaining`}
                </div>
                <div style={{ fontSize: "clamp(0.7rem, 2vw, 0.75rem)", color: "#999", marginTop: "0.5rem", fontFamily: "monospace", wordBreak: "break-all" }}>
                  UTID: {order.purchaseUtid}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
