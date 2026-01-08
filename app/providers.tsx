"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

// Get Convex URL from environment variable
// For Vercel, this should be set in project settings
function getConvexUrl(): string {
  if (typeof window === "undefined") {
    // Server-side: use process.env
    return process.env.NEXT_PUBLIC_CONVEX_URL || "";
  }
  // Client-side: environment variables are injected at build time
  return process.env.NEXT_PUBLIC_CONVEX_URL || "";
}

export function Providers({ children }: { children: ReactNode }) {
  const convexUrl = useMemo(() => getConvexUrl(), []);
  
  const convex = useMemo(() => {
    if (!convexUrl) {
      console.warn("NEXT_PUBLIC_CONVEX_URL is not set. Convex features will not work.");
      return null;
    }
    try {
      return new ConvexReactClient(convexUrl);
    } catch (error) {
      console.error("Failed to create Convex client:", error);
      return null;
    }
  }, [convexUrl]);

  if (!convex) {
    return <>{children}</>;
  }
  
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
