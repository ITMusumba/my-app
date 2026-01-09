/**
 * Deployment Mode Utilities
 * 
 * Provides utilities for detecting and working with deployment modes.
 * Supports "pilot" and "dev" deployment modes with separate URLs and databases.
 */

export type DeploymentMode = "pilot" | "dev";

/**
 * Get the current deployment mode from environment variable
 * 
 * @returns "pilot" | "dev" (defaults to "pilot" for backward compatibility)
 */
export function getDeploymentMode(): DeploymentMode {
  if (typeof window === "undefined") {
    // Server-side: use process.env
    const mode = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE;
    if (mode === "dev" || mode === "pilot") {
      return mode;
    }
    return "pilot"; // Default for backward compatibility
  }
  
  // Client-side: environment variables are injected at build time
  const mode = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE;
  if (mode === "dev" || mode === "pilot") {
    return mode;
  }
  return "pilot"; // Default for backward compatibility
}

/**
 * Check if the current deployment is in pilot mode
 */
export function isPilotMode(): boolean {
  return getDeploymentMode() === "pilot";
}

/**
 * Check if the current deployment is in dev mode
 */
export function isDevMode(): boolean {
  return getDeploymentMode() === "dev";
}

/**
 * Get a human-readable label for the current deployment mode
 */
export function getDeploymentModeLabel(): string {
  const mode = getDeploymentMode();
  return mode === "dev" ? "Development" : "Pilot";
}

/**
 * Get the Convex URL from environment variable
 * Each deployment mode should have its own Convex URL configured
 */
export function getConvexUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_CONVEX_URL || "";
  }
  return process.env.NEXT_PUBLIC_CONVEX_URL || "";
}
