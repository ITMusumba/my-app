/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminRedFlags from "../adminRedFlags.js";
import type * as auth from "../auth.js";
import type * as buyerDashboard from "../buyerDashboard.js";
import type * as buyers from "../buyers.js";
import type * as constants from "../constants.js";
import type * as demoData from "../demoData.js";
import type * as errors from "../errors.js";
import type * as farmerDashboard from "../farmerDashboard.js";
import type * as introspection from "../introspection.js";
import type * as listings from "../listings.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as pilotMode from "../pilotMode.js";
import type * as pilotSetup from "../pilotSetup.js";
import type * as rateLimits from "../rateLimits.js";
import type * as traderDashboard from "../traderDashboard.js";
import type * as utils from "../utils.js";
import type * as utils_index from "../utils/index.js";
import type * as utils_types from "../utils/types.js";
import type * as wallet from "../wallet.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminRedFlags: typeof adminRedFlags;
  auth: typeof auth;
  buyerDashboard: typeof buyerDashboard;
  buyers: typeof buyers;
  constants: typeof constants;
  demoData: typeof demoData;
  errors: typeof errors;
  farmerDashboard: typeof farmerDashboard;
  introspection: typeof introspection;
  listings: typeof listings;
  notifications: typeof notifications;
  payments: typeof payments;
  pilotMode: typeof pilotMode;
  pilotSetup: typeof pilotSetup;
  rateLimits: typeof rateLimits;
  traderDashboard: typeof traderDashboard;
  utils: typeof utils;
  "utils/index": typeof utils_index;
  "utils/types": typeof utils_types;
  wallet: typeof wallet;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
