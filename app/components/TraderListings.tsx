"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface TraderListingsProps {
  userId: Id<"users">;
}

export function TraderListings({ userId }: TraderListingsProps) {
  const listings = useQuery(api.listings.getActiveListings);
  const lockUnitByListing = useMutation(api.payments.lockUnitByListing);
  const [locking, setLocking] = useState<Id<"listings"> | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const formatUGX = (amount: number) => {
    return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX" }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleLockUnit = async (listingId: Id<"listings">) => {
    setLocking(listingId);
    setMessage(null);
    
    try {
      const result = await lockUnitByListing({
        traderId: userId,
        listingId: listingId,
      });
      
      setMessage({
        type: "success",
        text: `Unit locked successfully! UTID: ${result.utid}. Balance after: ${formatUGX(result.balanceAfter)}. New exposure: ${formatUGX(result.newExposure)}`,
      });
      
      // Clear message after delay
      setTimeout(() => {
        setMessage(null);
      }, 8000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: `Failed to lock unit: ${error.message}`,
      });
    } finally {
      setLocking(null);
    }
  };

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "clamp(1.1rem, 3.5vw, 1.3rem)", color: "#1a1a1a" }}>
        Available Listings (Negotiations)
      </h3>

      {message && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1.5rem",
            background: message.type === "success" ? "#e8f5e9" : "#ffebee",
            borderRadius: "8px",
            border: `1px solid ${message.type === "success" ? "#4caf50" : "#ef5350"}`,
            color: message.type === "success" ? "#2e7d32" : "#c62828",
          }}
        >
          {message.text}
        </div>
      )}

      {listings === undefined ? (
        <p style={{ color: "#999" }}>Loading listings...</p>
      ) : listings.length === 0 ? (
        <p style={{ color: "#666" }}>No active listings available. Farmers need to create listings first.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {listings.map((listing: any) => (
            <div
              key={listing.listingId}
              style={{
                padding: "clamp(1rem, 3vw, 1.5rem)",
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #e0e0e0",
              }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "clamp(1rem, 3.5vw, 1.2rem)", color: "#1a1a1a" }}>
                    {listing.produceType}
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: "0.75rem", fontSize: "clamp(0.85rem, 2.5vw, 0.9rem)", color: "#666", marginBottom: "0.5rem" }}>
                    <div>
                      <strong>Total:</strong> {listing.totalKilos} kg ({listing.totalUnits} units)
                    </div>
                    <div>
                      <strong>Price:</strong> {formatUGX(listing.pricePerKilo)}/kg
                    </div>
                    <div>
                      <strong>Unit:</strong> {formatUGX(listing.pricePerKilo * 10)} (10kg)
                    </div>
                    <div>
                      <strong>Available:</strong> {listing.availableUnits || listing.totalUnits} units
                    </div>
                  </div>
                  <div style={{ fontSize: "clamp(0.8rem, 2.5vw, 0.85rem)", color: "#999" }}>
                    Farmer: {listing.farmerAlias} | Listed: {formatDate(listing.createdAt)}
                  </div>
                  <div style={{ fontSize: "clamp(0.7rem, 2vw, 0.75rem)", color: "#999", marginTop: "0.5rem", fontFamily: "monospace", wordBreak: "break-all" }}>
                    UTID: {listing.utid}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "1rem", padding: "1rem", background: "#f5f5f5", borderRadius: "8px" }}>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#666" }}>
                  <strong>How to negotiate:</strong> Click "Lock Unit" to pay and lock a 10kg unit. First payment wins.
                </p>
                <button
                  onClick={() => handleLockUnit(listing.listingId)}
                  disabled={locking !== null || (listing.availableUnits || 0) === 0}
                  style={{
                    padding: "clamp(0.6rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)",
                    background: locking === listing.listingId || (listing.availableUnits || 0) === 0 ? "#ccc" : "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: locking === listing.listingId || (listing.availableUnits || 0) === 0 ? "not-allowed" : "pointer",
                    fontSize: "clamp(0.85rem, 2.5vw, 0.9rem)",
                    fontWeight: "600",
                    marginTop: "0.5rem",
                    width: "100%",
                  }}
                >
                  {locking === listing.listingId
                    ? "Locking..."
                    : (listing.availableUnits || 0) === 0
                    ? "All Units Locked"
                    : `Lock 1 Unit (${formatUGX(listing.pricePerKilo * 10)})`}
                </button>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8rem", color: "#999" }}>
                  ⚠️ Payment is immediate. Farmer must deliver within 6 hours.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
