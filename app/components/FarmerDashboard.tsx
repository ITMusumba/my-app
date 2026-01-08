"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface FarmerDashboardProps {
  userId: Id<"users">;
}

export function FarmerDashboard({ userId }: FarmerDashboardProps) {
  const listings = useQuery(api.farmerDashboard.getFarmerListings, { farmerId: userId });
  const negotiations = useQuery(api.farmerDashboard.getActiveNegotiations, { farmerId: userId });
  const confirmations = useQuery(api.farmerDashboard.getPayToLockConfirmations, { farmerId: userId });
  const deliveryDeadlines = useQuery(api.farmerDashboard.getDeliveryDeadlines, { farmerId: userId });

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
        Farmer Dashboard
      </h2>

      {/* My Listings */}
      <div style={{
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
          My Listings
        </h3>
        {listings === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : listings.listings.length === 0 ? (
          <p style={{ color: "#666" }}>No listings yet. Create your first listing to get started.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {listings.listings.map((listing: any, index: number) => (
              <div key={index} style={{
                padding: "1rem",
                background: "#f5f5f5",
                borderRadius: "8px",
                border: "1px solid #e0e0e0"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                  <div>
                    <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                      {listing.produceType} - {listing.totalKilos} kg
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>
                      Price: UGX {listing.pricePerKilo.toLocaleString()}/kg
                    </div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#999", fontFamily: "monospace" }}>
                    {listing.utid}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "#666" }}>
                  <span>Available: {listing.units.available}</span>
                  <span>Locked: {listing.units.locked}</span>
                  <span>Delivered: {listing.units.delivered}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Negotiations */}
      <div style={{
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
          Active Negotiations
        </h3>
        {negotiations === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : negotiations.negotiations.length === 0 ? (
          <p style={{ color: "#666" }}>No active negotiations</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {negotiations.negotiations.map((neg: any, index: number) => (
              <div key={index} style={{
                padding: "1rem",
                background: "#fff3cd",
                borderRadius: "8px",
                border: "1px solid #ffc107"
              }}>
                <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                  {neg.produceType} - {neg.unitsLocked} units locked
                </div>
                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                  Trader: {neg.traderAlias} | Status: {neg.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Deadlines */}
      <div style={{
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
          Delivery Deadlines
        </h3>
        {deliveryDeadlines === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : deliveryDeadlines.pending.deadlines.length === 0 && deliveryDeadlines.overdue.deadlines.length === 0 ? (
          <p style={{ color: "#666" }}>No pending deliveries</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[...deliveryDeadlines.overdue.deadlines, ...deliveryDeadlines.pending.deadlines].map((delivery: any, index: number) => (
              <div key={index} style={{
                padding: "1rem",
                background: delivery.timeRemainingMs <= 0 ? "#ffebee" : "#e8f5e9",
                borderRadius: "8px",
                border: `1px solid ${delivery.timeRemainingMs <= 0 ? "#ef5350" : "#4caf50"}`
              }}>
                <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                  {delivery.produceType} - {delivery.kilos} kg
                </div>
                <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>
                  Deadline: {formatDate(delivery.deadline)}
                </div>
                <div style={{
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: delivery.timeRemainingMs <= 0 ? "#c62828" : "#2e7d32"
                }}>
                  {formatTimeRemaining(delivery.deadline)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.5rem", fontFamily: "monospace" }}>
                  UTID: {delivery.lockUtid}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
