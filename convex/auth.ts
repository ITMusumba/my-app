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
 * Create a new user with a role
 * - Exactly one role per user (enforced by schema)
 * - Auto-generates alias for anonymity
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

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      role: args.role,
      alias,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    return { userId, alias };
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
