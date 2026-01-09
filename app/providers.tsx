"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";
import { getDeploymentMode, getConvexUrl } from "./utils/deployment";

export function Providers({ children }: { children: ReactNode }) {
  const deploymentMode = useMemo(() => getDeploymentMode(), []);
  const convexUrl = useMemo(() => getConvexUrl(), []);
  
  const convex = useMemo(() => {
    if (!convexUrl) {
      console.warn("NEXT_PUBLIC_CONVEX_URL is not set. Convex features will not work.");
      return null;
    }
    try {
      console.log(`[${deploymentMode.toUpperCase()}] Creating Convex client with URL:`, convexUrl);
      const client = new ConvexReactClient(convexUrl);
      console.log(`[${deploymentMode.toUpperCase()}] Convex client created successfully`);
      return client;
    } catch (error) {
      console.error(`[${deploymentMode.toUpperCase()}] Failed to create Convex client:`, error);
      return null;
    }
  }, [convexUrl, deploymentMode]);

  if (!convex) {
    console.warn(`[${deploymentMode.toUpperCase()}] Convex client is null - rendering without provider`);
    return <>{children}</>;
  }
  
  console.log(`[${deploymentMode.toUpperCase()}] Rendering with ConvexProvider`);
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
