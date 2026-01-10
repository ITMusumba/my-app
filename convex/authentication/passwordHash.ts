/**
 * Password Hashing Actions
 * 
 * NOTE: This file is temporarily disabled because bcrypt has native dependencies
 * that are not compatible with Convex's deployment environment (Linux ARM64).
 * 
 * Production authentication is not yet active (system uses pilot auth).
 * 
 * TODO: When production auth is activated, implement password hashing using:
 * - Web Crypto API (available in Convex runtime)
 * - Or a pure JavaScript bcrypt implementation
 * - Or use Convex's external HTTP actions to call a password hashing service
 * 
 * Current status: DISABLED for deployment compatibility
 */

// Temporarily disabled - bcrypt native module not compatible with Convex deployment
// "use node";
// 
// import { action } from "../_generated/server";
// import { v } from "convex/values";
// import * as bcrypt from "bcrypt";
//
// export const hashPassword = action({
//   args: {
//     password: v.string(),
//   },
//   handler: async (ctx, args) => {
//     const saltRounds = 10;
//     return await bcrypt.hash(args.password, saltRounds);
//   },
// });
//
// export const verifyPassword = action({
//   args: {
//     password: v.string(),
//     storedHash: v.string(),
//   },
//   handler: async (ctx, args) => {
//     return await bcrypt.compare(args.password, args.storedHash);
//   },
// });
