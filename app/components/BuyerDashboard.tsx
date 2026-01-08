"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface BuyerDashboardProps {
  userId: Id<"users">;
}

export function BuyerDashboard({ userId }: BuyerDashboardProps) {
  const inventory = useQuery(api.buyerDashboard.getAvailableInventory, { buyerId: userId });
  const windowStatus = useQuery(api.buyerDashboard.getPurchaseWindowStatus, { buyerId: userId });
  const orders = useQuery(api.buyerDashboard.getBuyerOrders, { buyerId: userId });

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

  return (
    <div>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "1.5rem", color: "#1a1a1a" }}>
        Buyer Dashboard
      </h2>

      {/* Purchase Window Status */}
      <div style={{
        marginBottom: "2rem",
        padding: "1.5rem",
        background: windowStatus?.isOpen ? "#e8f5e9" : "#ffebee",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: `1px solid ${windowStatus?.isOpen ? "#4caf50" : "#ef5350"}`
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
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
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
          Available Inventory
        </h3>
        {inventory === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : inventory.inventory.length === 0 ? (
          <p style={{ color: "#666" }}>No inventory available</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {inventory.inventory.map((item: any, index: number) => (
              <div key={index} style={{
                padding: "1rem",
                background: "#f5f5f5",
                borderRadius: "8px",
                border: "1px solid #e0e0e0"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                      {item.produceType} - {item.totalKilos} kg
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>
                      Available in {item.blocksAvailable} blocks of 100kg each
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.25rem" }}>
                      Trader: {item.traderAlias}
                    </div>
                  </div>
                  <div style={{
                    padding: "0.5rem 1rem",
                    background: windowStatus?.isOpen ? "#1976d2" : "#ccc",
                    color: "#fff",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    cursor: windowStatus?.isOpen ? "pointer" : "not-allowed"
                  }}>
                    {windowStatus?.isOpen ? "Purchase" : "Window Closed"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Orders */}
      <div style={{
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
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
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: order.isPastDeadline ? "#c62828" : "#2e7d32"
                }}>
                  {order.isPastDeadline ? `${order.hoursOverdue.toFixed(1)}h overdue` : `${order.hoursRemaining.toFixed(1)}h remaining`}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.5rem", fontFamily: "monospace" }}>
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
