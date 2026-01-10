/**
 * Authentication and Authorization
 * 
 * This module handles:
 * - User authentication
 * - Role enforcement (server-side only)
 * - Alias generation for anonymity
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { PILOT_SHARED_PASSWORD } from "./constants";

/**
 * Generate a stable, non-identifying alias for a user
 * Format: role_prefix_randomstring (e.g., "farmer_a3k9x2", "trader_m7p4q1")
 */
function generateAlias(role: string): string {
  const prefix = role.substring(0, 3); // "farmer" -> "far", "trader" -> "tra"
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${random}`;
}

/**
 * Simple hash function for pilot password (NOT production-grade)
 * ⚠️ PILOT ONLY - Use proper password hashing in production
 */
function simpleHash(password: string): string {
  // Simple hash for pilot - NOT secure, just for testing
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Create a new user with a role
 * - Exactly one role per user (enforced by schema)
 * - Auto-generates alias for anonymity
 * - Sets shared pilot password hash
 */
export const createUser = mutation({
  args: {
    email: v.string(),
    role: v.union(
      v.literal("farmer"),
      v.literal("trader"),
      v.literal("buyer"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("User with this email already exists");
    }

    // Generate alias
    const alias = generateAlias(args.role);

    // Hash the shared pilot password
    const passwordHash = simpleHash(PILOT_SHARED_PASSWORD);

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      role: args.role,
      alias,
      state: "active", // Initial state for new users
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      passwordHash,
    });

    return { userId, alias };
  },
});

/**
 * Infer role from email (pilot mode helper)
 * Determines user role based on email prefix
 */
function inferRoleFromEmail(email: string): "farmer" | "trader" | "buyer" | "admin" {
  const lowerEmail = email.toLowerCase();
  if (lowerEmail.includes("admin") || lowerEmail.startsWith("admin")) return "admin";
  if (lowerEmail.includes("farmer") || lowerEmail.startsWith("farmer")) return "farmer";
  if (lowerEmail.includes("trader") || lowerEmail.startsWith("trader")) return "trader";
  return "buyer";
}

/**
 * Signup - Create a new user account
 * 
 * Behavior:
 * - Validates email and password
 * - Creates user with specified role
 * - Returns user info on success
 */
export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    role: v.union(
      v.literal("farmer"),
      v.literal("trader"),
      v.literal("buyer")
    ),
  },
  handler: async (ctx, args) => {
    // Validate email format
    if (!args.email.includes("@") || !args.email.includes(".")) {
      throw new Error("Invalid email format");
    }

    // Validate password length
    if (args.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .first();

    if (existing) {
      throw new Error("User with this email already exists");
    }

    // Generate alias
    const alias = generateAlias(args.role);
    
    // Hash the password
    const passwordHash = simpleHash(args.password.trim());

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email.trim().toLowerCase(),
      role: args.role,
      alias,
      state: "active",
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      passwordHash,
    });

    // Fetch the created user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Failed to create user");
    }

    // Return user info
    return {
      userId: user._id,
      alias: user.alias,
      role: user.role,
    };
  },
});

/**
 * Login with email and password
 * 
 * Behavior:
 * - Validates password against stored hash
 * - Returns user info on success
 */
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Validate password
    const passwordHash = simpleHash(args.password.trim());
    if (user.passwordHash !== passwordHash) {
      throw new Error("Invalid email or password");
    }

    // Check if user is active
    if (user.state !== "active") {
      throw new Error("Account is not active. Please contact support.");
    }

    // Update last active timestamp
    await ctx.db.patch(user._id, {
      lastActiveAt: Date.now(),
    });

    // Return user info
    return {
      userId: user._id,
      alias: user.alias,
      role: user.role,
    };
  },
});

/**
 * Get user by ID
 * - Returns alias, not real identity
 */
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Return only alias (anonymity enforced)
    return {
      userId: user._id,
      alias: user.alias,
      role: user.role,
      createdAt: user.createdAt,
    };
  },
});

/**
 * Verify user role (server-side enforcement)
 * - Never trust client claims
 */
export const verifyRole = query({
  args: {
    userId: v.id("users"),
    requiredRole: v.union(
      v.literal("farmer"),
      v.literal("trader"),
      v.literal("buyer"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { authorized: false, reason: "User not found" };
    }

    if (user.role !== args.requiredRole) {
      return {
        authorized: false,
        reason: `User role ${user.role} does not match required role ${args.requiredRole}`,
      };
    }

    return { authorized: true };
  },
});
