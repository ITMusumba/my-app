"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { TraderListings } from "./TraderListings";
import { useState } from "react";
import { exportToExcel, exportToPDF, formatUTIDDataForExport } from "../utils/exportUtils";

interface TraderDashboardProps {
  userId: Id<"users">;
}

export function TraderDashboard({ userId }: TraderDashboardProps) {
  const ledger = useQuery(api.traderDashboard.getLedgerBreakdown, { traderId: userId });
  const exposure = useQuery(api.traderDashboard.getExposureStatus, { traderId: userId });
  const inventory = useQuery(api.traderDashboard.getInventoryWithProjectedLoss, { traderId: userId });
  const activeUTIDs = useQuery(api.traderDashboard.getTraderActiveUTIDs, { traderId: userId });
  const storageFeeRate = useQuery(api.traderDashboard.getTraderStorageFeeRate, { traderId: userId });
  const initiateDeposit = useAction(api.pesapal.initiateTraderDeposit);
  const paymentTransactions = useQuery(api.pesapal.getUserPaymentTransactions, { userId });

  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositMessage, setDepositMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [proView, setProView] = useState(false);
  const user = useQuery(api.auth.getUser, { userId });

  const formatUGX = (amount: number) => {
    return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX" }).format(amount);
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!depositAmount || isNaN(amount) || amount <= 0) {
      setDepositMessage({ type: "error", text: "Please enter a valid amount" });
      return;
    }

    setIsDepositing(true);
    setDepositMessage(null);

    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const callbackUrl = `${baseUrl}/payment/callback`;
      const cancelUrl = `${baseUrl}/`;

      const result = await initiateDeposit({
        traderId: userId,
        amount: amount,
        currency: "UGX",
        callbackUrl,
        cancelUrl,
      });

      // Redirect to Pesapal payment page
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        throw new Error("No redirect URL received from Pesapal");
      }
    } catch (error: any) {
      setDepositMessage({
        type: "error",
        text: `Failed to initiate payment: ${error.message}`,
      });
      setIsDepositing(false);
    }
  };

  const handleExportUTIDs = (format: "excel" | "pdf") => {
    if (!activeUTIDs || !activeUTIDs.utids || activeUTIDs.utids.length === 0) {
      alert("No UTID data available to export");
      return;
    }

    const formattedData = formatUTIDDataForExport(activeUTIDs.utids);
    const filename = `trader_utid_report_${new Date().toISOString().split("T")[0]}`;

    if (format === "excel") {
      exportToExcel(formattedData, filename, "Trader");
    } else {
      exportToPDF(formattedData, filename, "Trader", user?.alias);
    }
  };

  // Calculate inventory percentage for simple view
  const inventoryPercentage = inventory && inventory.inventory.length > 0
    ? Math.min(100, (inventory.inventory.reduce((sum: number, inv: any) => sum + inv.totalKilos, 0) / 1000) * 100)
    : 0;

  // Calculate activity stats for simple view
  const lockedToday = activeUTIDs?.utids.filter((utid: any) => {
    const today = Date.now();
    const dayStart = today - (today % (24 * 60 * 60 * 1000));
    return utid.timestamp && utid.timestamp >= dayStart && utid.type === "unit_lock";
  }).length || 0;
  
  const inStorageKilos = inventory?.inventory.reduce((sum: number, inv: any) => sum + inv.totalKilos, 0) || 0;
  const soldKilos = 0; // This would need to come from a query - placeholder for now

  return (
    <div style={{ padding: "1rem", maxWidth: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ 
            fontSize: "clamp(1.5rem, 4vw, 1.8rem)", 
            marginBottom: "0.5rem", 
            color: "#2c2c2c",
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: "700",
            letterSpacing: "-0.02em"
          }}>
            Trader: {user?.alias || "Trader"} 🚚
          </h2>
          <p style={{ 
            color: "#3d3d3d", 
            fontSize: "clamp(0.85rem, 2.5vw, 0.9rem)",
            fontFamily: '"Montserrat", sans-serif'
          }}>
            Location: District
          </p>
        </div>
        <button
          onClick={() => setProView(!proView)}
          style={{
            padding: "0.5rem 1rem",
            background: proView ? "#1976d2" : "#f5f5f5",
            color: proView ? "#fff" : "#333",
            border: "1px solid #ddd",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "600"
          }}
        >
          {proView ? "Simple View" : "Pro View"}
        </button>
      </div>

      {!proView ? (
        /* Simple View (Default) */
        <>
          {/* Inventory Percentage */}
          <div style={{
            marginBottom: "1.5rem",
            padding: "clamp(1rem, 3vw, 1.5rem)",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0"
          }}>
            <div style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)", color: "#666" }}>
              Inventory: {inventoryPercentage.toFixed(0)}%
            </div>
            <div style={{
              width: "100%",
              height: "20px",
              background: "#e0e0e0",
              borderRadius: "10px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${inventoryPercentage}%`,
                height: "100%",
                background: "#4caf50",
                transition: "width 0.3s"
              }} />
            </div>
          </div>

          {/* Available Units */}
          <div style={{
            marginBottom: "1.5rem",
            padding: "clamp(1rem, 3vw, 1.5rem)",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0"
          }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: "1rem", 
              fontSize: "clamp(1.1rem, 3.5vw, 1.3rem)", 
              color: "#2c2c2c",
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: "600",
              letterSpacing: "-0.01em"
            }}>
              Available Units
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
              {inventory && inventory.inventory.length > 0 ? (
                inventory.inventory.slice(0, 5).map((inv: any, idx: number) => (
                  <div key={idx} style={{
                    padding: "0.75rem",
                    background: "#f5f5f5",
                    borderRadius: "8px",
                    fontSize: "0.9rem"
                  }}>
                    {inv.produceType} {inv.totalKilos}kg
                  </div>
                ))
              ) : (
                <p style={{ color: "#666" }}>No inventory available</p>
              )}
            </div>
            <button
              style={{
                padding: "0.75rem 1.5rem",
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "600"
              }}
            >
              LOCK UNIT
            </button>
          </div>

          {/* Activity Summary */}
          <div style={{
            padding: "clamp(1rem, 3vw, 1.5rem)",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0"
          }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: "1rem", 
              fontSize: "clamp(1.1rem, 3.5vw, 1.3rem)", 
              color: "#2c2c2c",
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: "600",
              letterSpacing: "-0.01em"
            }}>
              Your Activity
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1976d2" }}>
                  {lockedToday}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Locked Today</div>
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "#2e7d32" }}>
                  {inStorageKilos.toFixed(0)}kg
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>In Storage</div>
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1a1a1a" }}>
                  {soldKilos.toFixed(0)}kg
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Sold</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Pro View */
        <>
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

        {/* Deposit Section */}
        <div style={{
          padding: "clamp(1rem, 3vw, 1.5rem)",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #e0e0e0"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "clamp(1rem, 3vw, 1.2rem)", color: "#1a1a1a" }}>
            Deposit Funds
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
                Amount (UGX)
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                step="1"
                disabled={isDepositing}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  fontSize: "1rem",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <button
              onClick={handleDeposit}
              disabled={isDepositing || !depositAmount}
              style={{
                padding: "0.75rem 1.5rem",
                background: isDepositing || !depositAmount ? "#ccc" : "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: isDepositing || !depositAmount ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "500",
                transition: "background 0.2s"
              }}
            >
              {isDepositing ? "Processing..." : "Deposit via Pesapal"}
            </button>
            {depositMessage && (
              <div style={{
                padding: "0.75rem",
                borderRadius: "6px",
                background: depositMessage.type === "success" ? "#e8f5e9" : "#ffebee",
                color: depositMessage.type === "success" ? "#2e7d32" : "#d32f2f",
                fontSize: "0.9rem"
              }}>
                {depositMessage.text}
              </div>
            )}
          </div>
          {paymentTransactions && paymentTransactions.length > 0 && (
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e0e0e0" }}>
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }}>Recent Deposits</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {paymentTransactions.slice(0, 3).map((tx: any) => (
                  <div key={tx.transactionId} style={{
                    padding: "0.5rem",
                    background: "#f9f9f9",
                    borderRadius: "6px",
                    fontSize: "0.85rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: "600" }}>{formatUGX(tx.amount)}</span>
                      <span style={{
                        color: tx.status === "completed" ? "#2e7d32" : tx.status === "pending" ? "#ff9800" : "#d32f2f",
                        textTransform: "capitalize"
                      }}>
                        {tx.status}
                      </span>
                    </div>
                    {tx.walletDepositUtid && (
                      <div style={{ fontSize: "0.75rem", color: "#999", fontFamily: "monospace" }}>
                        UTID: {tx.walletDepositUtid}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Storage Fee Rate Info */}
      {storageFeeRate && (
        <div style={{
          marginBottom: "1.5rem",
          padding: "clamp(1rem, 3vw, 1.5rem)",
          background: "#fff3cd",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #ffc107"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "clamp(1rem, 3vw, 1.2rem)", color: "#856404" }}>
            ⚠️ Current Kilo-Shaving Rate
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>
            <strong>{storageFeeRate.rateKgPerDay} kg per day</strong> per 100kg block. This rate applies to all inventory in storage.
          </p>
        </div>
      )}

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
                  {/* Header with UTID */}
                  <div style={{ 
                    marginBottom: "1rem", 
                    paddingBottom: "0.75rem", 
                    borderBottom: "1px solid #e0e0e0" 
                  }}>
                    <div style={{ 
                      fontSize: "clamp(0.7rem, 2vw, 0.75rem)", 
                      color: "#666", 
                      marginBottom: "0.25rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      Transaction UTID
                    </div>
                    <div style={{ 
                      fontSize: "clamp(0.8rem, 2.5vw, 0.9rem)", 
                      color: "#1a1a1a", 
                      fontFamily: "monospace",
                      fontWeight: "600",
                      wordBreak: "break-all"
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

      {/* Active Transactions */}
      <div style={{
        marginBottom: "1.5rem",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0, marginBottom: 0, fontSize: "clamp(1.1rem, 3.5vw, 1.3rem)", color: "#1a1a1a" }}>
            Active Transactions
          </h3>
          {activeUTIDs && activeUTIDs.utids && activeUTIDs.utids.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => handleExportUTIDs("excel")}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#2e7d32",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: "500"
                }}
              >
                📊 Excel
              </button>
              <button
                onClick={() => handleExportUTIDs("pdf")}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#d32f2f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: "500"
                }}
              >
                📄 PDF
              </button>
            </div>
          )}
        </div>
        {activeUTIDs === undefined ? (
          <p style={{ color: "#999" }}>Loading...</p>
        ) : activeUTIDs.utids.length === 0 ? (
          <p style={{ color: "#666" }}>No active transactions</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {activeUTIDs.utids.map((utid: any, index: number) => {
              // Determine background color based on state
              const getStateColor = (state: string) => {
                if (state?.includes("Locked-In (In Transit)")) return "#fff3cd"; // Yellow for in transit
                if (state?.includes("Inventory")) return "#d4edda"; // Green for inventory
                if (state?.includes("Late")) return "#f8d7da"; // Red for late
                return "#f5f5f5"; // Default gray
              };
              
              const getStateBorderColor = (state: string) => {
                if (state?.includes("Locked-In (In Transit)")) return "#ffc107"; // Yellow border
                if (state?.includes("Inventory")) return "#28a745"; // Green border
                if (state?.includes("Late")) return "#dc3545"; // Red border
                return "#e0e0e0"; // Default border
              };
              
              const state = utid.state || (utid.type === "unit_lock" ? "Locked-In" : utid.type === "inventory" ? "Inventory" : "Active");
              
              return (
                <div key={index} style={{
                  padding: "clamp(0.75rem, 2.5vw, 1rem)",
                  background: getStateColor(state),
                  borderRadius: "8px",
                  border: `2px solid ${getStateBorderColor(state)}`,
                  fontSize: "clamp(0.8rem, 2.5vw, 0.85rem)",
                  wordBreak: "break-all"
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start",
                    marginBottom: "0.5rem",
                    flexWrap: "wrap",
                    gap: "0.5rem"
                  }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ 
                        fontSize: "clamp(0.7rem, 2vw, 0.75rem)", 
                        color: "#666",
                        marginBottom: "0.25rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        fontWeight: "600"
                      }}>
                        Transaction UTID
                      </div>
                      <div style={{ 
                        fontWeight: "600", 
                        fontFamily: "monospace",
                        color: "#1a1a1a",
                        fontSize: "clamp(0.8rem, 2.5vw, 0.9rem)"
                      }}>
                        {utid.utid}
                      </div>
                    </div>
                    <div style={{
                      padding: "0.25rem 0.75rem",
                      background: state.includes("Locked-In (In Transit)") ? "#ff9800" 
                        : state.includes("Inventory") ? "#28a745"
                        : state.includes("Late") ? "#dc3545"
                        : "#6c757d",
                      color: "#fff",
                      borderRadius: "4px",
                      fontSize: "clamp(0.7rem, 2vw, 0.75rem)",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      whiteSpace: "nowrap"
                    }}>
                      {state}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: "clamp(0.7rem, 2vw, 0.75rem)", 
                    color: "#666",
                    display: "flex",
                    gap: "1rem",
                    flexWrap: "wrap"
                  }}>
                    <span>Type: <strong>{utid.type}</strong></span>
                    {utid.status && (
                      <span>Status: <strong>{utid.status}</strong></span>
                    )}
                    {utid.entities && utid.entities.length > 0 && utid.entities[0].produceType && (
                      <span>Produce: <strong>{utid.entities[0].produceType}</strong></span>
                    )}
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

          {/* Pro View: Inventory Table */}
          <div style={{
            marginBottom: "1.5rem",
            padding: "clamp(1rem, 3vw, 1.5rem)",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0"
          }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: "1rem", 
              fontSize: "clamp(1.1rem, 3.5vw, 1.3rem)", 
              color: "#2c2c2c",
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: "600",
              letterSpacing: "-0.01em"
            }}>
              Inventory Table
            </h3>
            {inventory === undefined ? (
              <p style={{ color: "#999" }}>Loading...</p>
            ) : inventory.inventory.length === 0 ? (
              <p style={{ color: "#666" }}>No inventory</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.9rem", color: "#666" }}>Produce</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.9rem", color: "#666" }}>Qty</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.9rem", color: "#666" }}>Status</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.9rem", color: "#666" }}>Storage Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.inventory.map((item: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "0.75rem", fontSize: "0.9rem" }}>{item.produceType}</td>
                        <td style={{ padding: "0.75rem", fontSize: "0.9rem" }}>{item.totalKilos.toFixed(2)} kg</td>
                        <td style={{ padding: "0.75rem", fontSize: "0.9rem" }}>In Storage</td>
                        <td style={{ padding: "0.75rem", fontSize: "0.9rem" }}>{item.daysInStorage.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pro View: Analytics Placeholders */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}>
            <div style={{
              padding: "clamp(1rem, 3vw, 1.5rem)",
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "1px solid #e0e0e0"
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "clamp(1rem, 3vw, 1.2rem)", color: "#1a1a1a" }}>
                Inventory Over Time
              </h3>
              <div style={{ 
                height: "200px", 
                background: "#f5f5f5", 
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999"
              }}>
                [Graph: Inventory over Time]
              </div>
            </div>
            <div style={{
              padding: "clamp(1rem, 3vw, 1.5rem)",
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "1px solid #e0e0e0"
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "clamp(1rem, 3vw, 1.2rem)", color: "#1a1a1a" }}>
                Lock vs Sales
              </h3>
              <div style={{ 
                height: "200px", 
                background: "#f5f5f5", 
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999"
              }}>
                [Graph: Lock vs Sales]
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
