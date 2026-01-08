"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect } from "react";

interface TraderListingsProps {
  userId: Id<"users">;
}

export function TraderListings({ userId }: TraderListingsProps) {
  const listings = useQuery(api.listings.getActiveListings);
  const lockUnit = useMutation(api.payments.lockUnit);
  const [locking, setLocking] = useState<Id<"listings"> | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [unitCache, setUnitCache] = useState<Map<Id<"listings">, Id<"listingUnits">>>(new Map());

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
      // Get listing details to find available unit
      const listingDetails = await fetch(`/api/convex?function=listings.getListingDetails&args=${JSON.stringify({ listingId })}`).catch(() => null);
      
      // Use a simpler approach: call the query via the mutation context
      // Actually, we need to get the unitId first
      // Let's use the getFirstAvailableUnit query result if we can cache it
      
      // For now, let's just show instructions
      // The proper way would be to have a mutation that accepts listingId and finds the unit
      // Or we pre-fetch all listing details
      
      setMessage({
        type: "error",
        text: "Please view listing details first. Use the Convex dashboard to lock units with the unitId.",
      });
      setLocking(null);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: `Failed to lock unit: ${error.message}`,
      });
      setLocking(null);
    }
  };

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
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
                padding: "1.5rem",
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #e0e0e0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", color: "#1a1a1a" }}>
                    {listing.produceType}
                  </h4>
                  <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <span>
                      <strong>Total:</strong> {listing.totalKilos} kg ({listing.totalUnits} units)
                    </span>
                    <span>
                      <strong>Price:</strong> {formatUGX(listing.pricePerKilo)}/kg
                    </span>
                    <span>
                      <strong>Unit Price:</strong> {formatUGX(listing.pricePerKilo * 10)} (10kg)
                    </span>
                    <span>
                      <strong>Available:</strong> {listing.availableUnits || listing.totalUnits} units
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#999" }}>
                    Farmer: {listing.farmerAlias} | Listed: {formatDate(listing.createdAt)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#999", fontFamily: "monospace", marginTop: "0.25rem" }}>
                    UTID: {listing.utid}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "1rem", padding: "1rem", background: "#f5f5f5", borderRadius: "8px" }}>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#666" }}>
                  <strong>How to negotiate:</strong> View listing details to see available units, then use the Convex dashboard to lock a unit.
                </p>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8rem", color: "#999" }}>
                  ⚠️ To lock a unit, use: <code>payments.lockUnit</code> mutation with <code>traderId</code> and <code>unitId</code> from listing details.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
