"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const verifyPayment = useAction(api.pesapal.verifyPesapalPayment);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!orderTrackingId) {
      setStatus("error");
      setMessage("No order tracking ID provided");
      return;
    }

    const verify = async () => {
      try {
        const result = await verifyPayment({ orderTrackingId });
        setStatus("success");
        setMessage(`Payment ${result.status}. Redirecting to dashboard...`);
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } catch (error: any) {
        setStatus("error");
        setMessage(`Payment verification failed: ${error.message}`);
      }
    };

    verify();
  }, [orderTrackingId, verifyPayment, router]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "2rem",
      background: "#f5f5f5"
    }}>
      <div style={{
        background: "#fff",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        maxWidth: "500px",
        width: "100%",
        textAlign: "center"
      }}>
        {status === "loading" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
            <h2 style={{ marginBottom: "1rem", color: "#1a1a1a" }}>Verifying Payment...</h2>
            <p style={{ color: "#666" }}>Please wait while we verify your payment.</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ marginBottom: "1rem", color: "#2e7d32" }}>Payment Successful!</h2>
            <p style={{ color: "#666", marginBottom: "1rem" }}>{message}</p>
            <p style={{ color: "#999", fontSize: "0.9rem" }}>You will be redirected shortly...</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
            <h2 style={{ marginBottom: "1rem", color: "#d32f2f" }}>Payment Verification Failed</h2>
            <p style={{ color: "#666", marginBottom: "1rem" }}>{message}</p>
            <button
              onClick={() => router.push("/")}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "500"
              }}
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
