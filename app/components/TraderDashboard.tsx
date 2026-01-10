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
    <div>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "1.5rem", color: "#1a1a1a" }}>
        Trader Dashboard
      </h2>

      {/* Wallet & Exposure */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Ledger Summary */}
        <div style={{
          padding: "1.5rem",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #e0e0e0"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.2rem", color: "#1a1a1a" }}>
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
          padding: "1.5rem",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #e0e0e0"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.2rem", color: "#1a1a1a" }}>
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
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
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
                  padding: "1.5rem",
                  background: "#f9f9f9",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0"
                }}>
                  {/* Header with UTID */}
                  <div style={{ 
                    marginBottom: "1rem", 
                    paddingBottom: "0.75rem", 
                    borderBottom: "1px solid #e0e0e0" 
                  }}>
                    <div style={{ 
                      fontSize: "0.75rem", 
                      color: "#666", 
                      marginBottom: "0.25rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      Transaction UTID
                    </div>
                    <div style={{ 
                      fontSize: "0.9rem", 
                      color: "#1a1a1a", 
                      fontFamily: "monospace",
                      fontWeight: "600"
                    }}>
                      {item.utid}
                    </div>
                  </div>

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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>
                          Quantity (Kilos)
                        </div>
                        <div style={{ fontSize: "1rem", fontWeight: "600", color: "#1976d2" }}>
                          {item.totalKilos.toFixed(2)} kg
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.25rem" }}>
                          Original: {item.originalKilos.toFixed(2)} kg
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>
                          Price per Kilo
                        </div>
                        <div style={{ fontSize: "1rem", fontWeight: "600", color: "#2e7d32" }}>
                          {formatUGX(item.originalPricePerKilo)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>
                          Total Value
                        </div>
                        <div style={{ fontSize: "1rem", fontWeight: "600", color: "#1a1a1a" }}>
                          {formatUGX(totalPrice)}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.25rem" }}>
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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", fontSize: "0.85rem" }}>
                      <div>
                        <div style={{ color: "#999" }}>Days in Storage</div>
                        <div style={{ fontWeight: "600", color: "#1a1a1a" }}>{item.daysInStorage.toFixed(1)} days</div>
                      </div>
                      <div>
                        <div style={{ color: "#999" }}>Projected Loss</div>
                        <div style={{ fontWeight: "600", color: "#d32f2f" }}>{item.projectedKilosLost.toFixed(2)} kg</div>
                      </div>
                      <div>
                        <div style={{ color: "#999" }}>Remaining</div>
                        <div style={{ fontWeight: "600", color: "#2e7d32" }}>{item.projectedKilosRemaining.toFixed(2)} kg</div>
                      </div>
                      <div>
                        <div style={{ color: "#999" }}>Loss Rate</div>
                        <div style={{ fontWeight: "600", color: "#1a1a1a" }}>{item.storageFeeRate} kg/day</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active UTIDs */}
      <div style={{
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.3rem", color: "#1a1a1a" }}>
          Active Transactions
        </h3>
        {activeUTIDs === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : activeUTIDs.utids.length === 0 ? (
          <p style={{ color: "#666" }}>No active transactions</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {activeUTIDs.utids.map((utid: any, index: number) => (
              <div key={index} style={{
                padding: "0.75rem",
                background: "#f5f5f5",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontFamily: "monospace"
              }}>
                {utid.utid} - {utid.status}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Listings for Negotiations */}
      <div style={{
        padding: "1.5rem",
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
