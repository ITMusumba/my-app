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
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      passwordHash,
    });

    return { userId, alias };
  },
});

/**
 * Login with email and shared pilot password
 * ⚠️ PILOT ONLY - Simple authentication for testing
 * Returns user info if credentials match
 */
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Find user by email
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      if (!user) {
        throw new Error("Invalid email or password. User not found. Please create test users first using pilotSetup.createPilotUsers");
      }

      // Check if user has password hash (for users created before password system)
      if (!user.passwordHash) {
        // If user exists but has no password, set it now
        const passwordHash = simpleHash(PILOT_SHARED_PASSWORD);
        await ctx.db.patch(user._id, {
          passwordHash,
          lastActiveAt: Date.now(),
        });
        
        // Check if provided password matches
        if (args.password !== PILOT_SHARED_PASSWORD) {
          throw new Error("Invalid email or password");
        }
      } else {
        // Check password (compare hash)
        const passwordHash = simpleHash(args.password);
        if (user.passwordHash !== passwordHash) {
          throw new Error("Invalid email or password");
        }
      }

      // Update last active timestamp
      await ctx.db.patch(user._id, {
        lastActiveAt: Date.now(),
      });

      // Return user info (alias only, not email)
      return {
        userId: user._id,
        alias: user.alias,
        role: user.role,
      };
    } catch (error: any) {
      // Re-throw with more context
      throw new Error(`Login failed: ${error.message}`);
    }
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
 * Check if any users exist (for pilot setup)
 */
export const checkUsersExist = query({
  args: {},
  handler: async (ctx) => {
    const userCount = await ctx.db.query("users").collect();
    return {
      exists: userCount.length > 0,
      count: userCount.length,
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
