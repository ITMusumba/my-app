/**
 * Password Hashing Actions
 * 
 * This file contains Convex actions for password hashing using bcrypt.
 * These are separate actions because bcrypt requires Node.js runtime.
 * 
 * "use node" directive is required for bcrypt to work in Convex.
 */

"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import * as bcrypt from "bcrypt";

/**
 * Hash a password using bcrypt (secure algorithm).
 * 
 * Requirements:
 * - Must use secure algorithm (bcrypt, argon2, or equivalent)
 * - Must use salt (unique per password, handled by bcrypt)
 * - Must be one-way (cannot be reversed)
 * - Must be computationally expensive (resistant to brute force)
 * 
 * @param password - Plaintext password to hash
 * @returns Password hash (bcrypt format, includes salt)
 */
export const hashPassword = action({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Use bcrypt with 10 rounds (configurable, 10 is standard)
    // bcrypt automatically generates and includes salt in the hash
    const saltRounds = 10;
    return await bcrypt.hash(args.password, saltRounds);
  },
});

/**
 * Verify a password against a stored bcrypt hash.
 * 
 * Requirements:
 * - Must use constant-time comparison (bcrypt.compare is constant-time)
 * - Must verify password hash format (bcrypt format)
 * 
 * @param password - Plaintext password to verify
 * @param storedHash - Stored password hash (bcrypt format)
 * @returns true if password matches, false otherwise
 */
export const verifyPassword = action({
  args: {
    password: v.string(),
    storedHash: v.string(),
  },
  handler: async (ctx, args) => {
    // bcrypt.compare is constant-time and handles hash format validation
    return await bcrypt.compare(args.password, args.storedHash);
  },
});
