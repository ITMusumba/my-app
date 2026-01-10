"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { TraderListings } from "./TraderListings";

interface TraderDashboardProps {
  userId: Id<"users">;
}

export function TraderDashboard({ userId }: TraderDashboardProps) {
  const ledger = useQuery(api.traderDashboard.getLedgerBreakdown, { traderId: userId });
  const exposure = useQuery(api.traderDashboard.getExposureStatus, { traderId: userId });
  const inventory = useQuery(api.traderDashboard.getInventoryWithProjectedLoss, { traderId: userId });
  const activeUTIDs = useQuery(api.traderDashboard.getTraderActiveUTIDs, { traderId: userId });

  const formatUGX = (amount: number) => {
    return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX" }).format(amount);
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "100%", boxSizing: "border-box" }}>
      <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 1.8rem)", marginBottom: "1.5rem", color: "#1a1a1a" }}>
        Trader Dashboard
      </h2>

      {/* Wallet & Exposure */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Ledger Summary */}
        <div style={{
          padding: "clamp(1rem, 3vw, 1.5rem)",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #e0e0e0"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "clamp(1rem, 3vw, 1.2rem)", color: "#1a1a1a" }}>
            Wallet Summary
          </h3>
          {ledger === undefined ? (
            <p style={{ color: "#999" }}>Loading...</p>
          ) : (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Capital Deposited</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1976d2" }}>
                  {formatUGX(ledger.capital.balance)}
                </div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Profit Earned</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "#2e7d32" }}>
                  {formatUGX(ledger.profit.balance)}
                </div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Available Balance</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1a1a1a" }}>
                  {formatUGX(ledger.capital.available + ledger.profit.balance)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Exposure Status */}
        <div style={{
          padding: "clamp(1rem, 3vw, 1.5rem)",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #e0e0e0"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "clamp(1rem, 3vw, 1.2rem)", color: "#1a1a1a" }}>
            Exposure Status
          </h3>
          {exposure === undefined ? (
            <p style={{ color: "#999" }}>Loading...</p>
          ) : (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Current Exposure</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "600", color: exposure.exposure.totalExposure >= exposure.spendCap.maxExposure * 0.8 ? "#d32f2f" : "#1a1a1a" }}>
                  {formatUGX(exposure.exposure.totalExposure)}
                </div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Spend Cap</div>
                <div style={{ fontSize: "1.2rem", color: "#666" }}>
                  {formatUGX(exposure.spendCap.maxExposure)}
                </div>
              </div>
              <div style={{
                width: "100%",
                height: "8px",
                background: "#e0e0e0",
                borderRadius: "4px",
                overflow: "hidden",
                marginTop: "0.5rem"
              }}>
                <div style={{
                  width: `${Math.min(100, exposure.spendCap.usagePercent)}%`,
                  height: "100%",
                  background: exposure.spendCap.usagePercent >= 80 ? "#d32f2f" : "#4caf50",
                  transition: "width 0.3s"
                }} />
              </div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#666" }}>
                {exposure.spendCap.usagePercent}% of cap used
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inventory */}
      <div style={{
        marginBottom: "1.5rem",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "clamp(1.1rem, 3.5vw, 1.3rem)", color: "#1a1a1a" }}>
          Inventory in Storage
        </h3>
        {inventory === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : inventory.inventory.length === 0 ? (
          <p style={{ color: "#666" }}>No inventory in storage</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {inventory.inventory.map((item: any, index: number) => {
              const totalPrice = item.originalPricePerKilo * item.totalKilos;
              const projectedRemainingPrice = item.originalPricePerKilo * item.projectedKilosRemaining;
              
              return (
                <div key={index} style={{
                  padding: "clamp(1rem, 3vw, 1.5rem)",
                  background: "#f9f9f9",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0"
                }}>

                  {/* Produce Type and Quantity */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ 
                      fontSize: "1.1rem", 
                      fontWeight: "600", 
                      marginBottom: "0.5rem",
                      color: "#1a1a1a"
                    }}>
                      {item.produceType}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: "0.75rem" }}>
                      <div>
                        <div style={{ fontSize: "clamp(0.8rem, 2.5vw, 0.85rem)", color: "#666", marginBottom: "0.25rem" }}>
                          Quantity
                        </div>
                        <div style={{ fontSize: "clamp(0.9rem, 3vw, 1rem)", fontWeight: "600", color: "#1976d2" }}>
                          {item.totalKilos.toFixed(2)} kg
                        </div>
                        <div style={{ fontSize: "clamp(0.7rem, 2vw, 0.75rem)", color: "#999", marginTop: "0.25rem" }}>
                          Original: {item.originalKilos.toFixed(2)} kg
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "clamp(0.8rem, 2.5vw, 0.85rem)", color: "#666", marginBottom: "0.25rem" }}>
                          Price per Kilo
                        </div>
                        <div style={{ fontSize: "clamp(0.9rem, 3vw, 1rem)", fontWeight: "600", color: "#2e7d32" }}>
                          {formatUGX(item.originalPricePerKilo)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "clamp(0.8rem, 2.5vw, 0.85rem)", color: "#666", marginBottom: "0.25rem" }}>
                          Total Value
                        </div>
                        <div style={{ fontSize: "clamp(0.9rem, 3vw, 1rem)", fontWeight: "600", color: "#1a1a1a" }}>
                          {formatUGX(totalPrice)}
                        </div>
                        <div style={{ fontSize: "clamp(0.7rem, 2vw, 0.75rem)", color: "#999", marginTop: "0.25rem" }}>
                          Projected: {formatUGX(projectedRemainingPrice)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Storage Details */}
                  <div style={{ 
                    padding: "0.75rem", 
                    background: "#fff", 
                    borderRadius: "6px",
                    border: "1px solid #e0e0e0"
                  }}>
                    <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }}>
                      Storage Information
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 100px), 1fr))", gap: "0.5rem", fontSize: "clamp(0.75rem, 2.5vw, 0.85rem)" }}>
                      <div>
                        <div style={{ color: "#999", fontSize: "clamp(0.7rem, 2vw, 0.75rem)" }}>Days Stored</div>
                        <div style={{ fontWeight: "600", color: "#1a1a1a", fontSize: "clamp(0.8rem, 2.5vw, 0.9rem)" }}>{item.daysInStorage.toFixed(1)}</div>
                      </div>
                      <div>
                        <div style={{ color: "#999", fontSize: "clamp(0.7rem, 2vw, 0.75rem)" }}>Loss</div>
                        <div style={{ fontWeight: "600", color: "#d32f2f", fontSize: "clamp(0.8rem, 2.5vw, 0.9rem)" }}>{item.projectedKilosLost.toFixed(2)} kg</div>
                      </div>
                      <div>
                        <div style={{ color: "#999", fontSize: "clamp(0.7rem, 2vw, 0.75rem)" }}>Remaining</div>
                        <div style={{ fontWeight: "600", color: "#2e7d32", fontSize: "clamp(0.8rem, 2.5vw, 0.9rem)" }}>{item.projectedKilosRemaining.toFixed(2)} kg</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Listings for Negotiations */}
      <div style={{
        padding: "clamp(1rem, 3vw, 1.5rem)",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <TraderListings userId={userId} />
      </div>
    </div>
  );
}
