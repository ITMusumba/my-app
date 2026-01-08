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
  const lockUnit = useMutation(api.payments.lockUnit);
  const [locking, setLocking] = useState<Id<"listings"> | null>(null);
  const [selectedListing, setSelectedListing] = useState<Id<"listings"> | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Get details for selected listing
  const listingDetails = useQuery(
    selectedListing ? api.listings.getListingDetails : "skip",
    selectedListing ? { listingId: selectedListing } : "skip"
  );

  const formatUGX = (amount: number) => {
    return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX" }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleLockUnit = async (listingId: Id<"listings">) => {
    setLocking(listingId);
    setSelectedListing(listingId);
    setMessage(null);
    
    // Wait a moment for the query to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!listingDetails) {
      setMessage({
        type: "error",
        text: "Loading listing details... Please try again.",
      });
      setLocking(null);
      setSelectedListing(null);
      return;
    }

    const availableUnit = listingDetails.units.find((u: any) => u.status === "available");
    if (!availableUnit) {
      setMessage({
        type: "error",
        text: "No available units in this listing. All units are already locked.",
      });
      setLocking(null);
      setSelectedListing(null);
      return;
    }

    try {
      const result = await lockUnit({
        traderId: userId,
        unitId: availableUnit.unitId,
      });
      
      setMessage({
        type: "success",
        text: `Unit #${availableUnit.unitNumber} locked successfully! UTID: ${result.utid}. Balance after: ${formatUGX(result.balanceAfter)}`,
      });
      
      // Clear selection and message after delay
      setTimeout(() => {
        setMessage(null);
        setSelectedListing(null);
      }, 5000);
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
          {listings.map((listing: any) => {
            // Get details for this listing if selected
            const details = selectedListing === listing.listingId ? listingDetails : null;
            const availableCount = details
              ? details.units.filter((u: any) => u.status === "available").length
              : listing.totalUnits;

            return (
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
                        <strong>Available:</strong> {availableCount} units
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
                    <strong>How to negotiate:</strong> Click "Lock Unit" to pay and lock a 10kg unit. First payment wins.
                  </p>
                  <button
                    onClick={() => handleLockUnit(listing.listingId)}
                    disabled={locking !== null || availableCount === 0}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: locking === listing.listingId || availableCount === 0 ? "#ccc" : "#1976d2",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: locking === listing.listingId || availableCount === 0 ? "not-allowed" : "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    {locking === listing.listingId
                      ? "Locking..."
                      : availableCount === 0
                      ? "All Units Locked"
                      : `Lock 1 Unit (${formatUGX(listing.pricePerKilo * 10)})`}
                  </button>
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8rem", color: "#999" }}>
                    ⚠️ Payment is immediate. Farmer must deliver within 6 hours.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
