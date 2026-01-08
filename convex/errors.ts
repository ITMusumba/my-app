/**
 * Standardized Error Response System
 * 
 * All mutation failures must return:
 * - Clear error code
 * - Human-readable explanation
 * 
 * Errors must never expose:
 * - Internal logic
 * - User identities
 * - System internals
 * - Sensitive data
 */

/**
 * Error codes for common failures
 */
export enum ErrorCode {
  // System state errors
  PILOT_MODE_ACTIVE = "PILOT_MODE_ACTIVE",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  
  // Financial errors
  SPEND_CAP_EXCEEDED = "SPEND_CAP_EXCEEDED",
  INSUFFICIENT_CAPITAL = "INSUFFICIENT_CAPITAL",
  INSUFFICIENT_PROFIT = "INSUFFICIENT_PROFIT",
  
  // Window/availability errors
  PURCHASE_WINDOW_CLOSED = "PURCHASE_WINDOW_CLOSED",
  UNIT_NOT_AVAILABLE = "UNIT_NOT_AVAILABLE",
  INVENTORY_NOT_AVAILABLE = "INVENTORY_NOT_AVAILABLE",
  
  // SLA/time errors
  DELIVERY_SLA_EXPIRED = "DELIVERY_SLA_EXPIRED",
  PICKUP_SLA_EXPIRED = "PICKUP_SLA_EXPIRED",
  
  // Validation errors
  INVALID_ROLE = "INVALID_ROLE",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  INVALID_KILOS = "INVALID_KILOS",
  INVALID_STATUS = "INVALID_STATUS",
  
  // Not found errors
  USER_NOT_FOUND = "USER_NOT_FOUND",
  LISTING_NOT_FOUND = "LISTING_NOT_FOUND",
  UNIT_NOT_FOUND = "UNIT_NOT_FOUND",
  INVENTORY_NOT_FOUND = "INVENTORY_NOT_FOUND",
  NOTIFICATION_NOT_FOUND = "NOTIFICATION_NOT_FOUND",
  
  // Authorization errors
  NOT_AUTHORIZED = "NOT_AUTHORIZED",
  NOT_ADMIN = "NOT_ADMIN",
  NOT_TRADER = "NOT_TRADER",
  NOT_FARMER = "NOT_FARMER",
  NOT_BUYER = "NOT_BUYER",
  
  // State errors
  ALREADY_LOCKED = "ALREADY_LOCKED",
  ALREADY_VERIFIED = "ALREADY_VERIFIED",
  INVALID_DELIVERY_STATUS = "INVALID_DELIVERY_STATUS",
  
  // Generic errors
  OPERATION_FAILED = "OPERATION_FAILED",
  VALIDATION_FAILED = "VALIDATION_FAILED",
}

/**
 * Standardized error response
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly message: string;
  public readonly userMessage: string; // Human-readable message for users
  public readonly metadata?: Record<string, any>; // Additional context (non-sensitive)

  constructor(
    code: ErrorCode,
    userMessage: string,
    metadata?: Record<string, any>
  ) {
    super(userMessage);
    this.name = "AppError";
    this.code = code;
    this.message = userMessage; // Same as userMessage (no internal details)
    this.userMessage = userMessage;
    this.metadata = metadata;
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.userMessage,
        ...(this.metadata && { metadata: this.metadata }),
      },
    };
  }
}

/**
 * Error factory functions for common failures
 */

/**
 * Pilot mode active error
 */
export function pilotModeActiveError(reason?: string): AppError {
  return new AppError(
    ErrorCode.PILOT_MODE_ACTIVE,
    "This operation is currently unavailable. The system is in pilot mode for testing and maintenance. Please try again later or contact support if you need immediate assistance.",
    {
      reason: reason || "System maintenance",
    }
  );
}

/**
 * Rate limit exceeded error
 */
export function rateLimitExceededError(
  limitType: string,
  limit: number,
  resetTime?: number
): AppError {
  const resetInfo = resetTime
    ? ` You can try again in approximately ${Math.ceil((resetTime - Date.now()) / (60 * 1000))} minute(s).`
    : "";

  return new AppError(
    ErrorCode.RATE_LIMIT_EXCEEDED,
    `You have exceeded the maximum number of ${limitType.replace(/_/g, " ")} allowed.${resetInfo} This action has been logged for review. If you believe this is an error, please contact support.`,
    {
      limitType,
      limit,
      resetTime,
    }
  );
}

/**
 * Spend cap exceeded error
 */
export function spendCapExceededError(): AppError {
  return new AppError(
    ErrorCode.SPEND_CAP_EXCEEDED,
    "You have reached your spending limit. You cannot make additional purchases at this time. Please wait for existing transactions to complete or contact support if you need assistance.",
    {}
  );
}

/**
 * Insufficient capital error
 */
export function insufficientCapitalError(): AppError {
  return new AppError(
    ErrorCode.INSUFFICIENT_CAPITAL,
    "You do not have sufficient available capital to complete this transaction. Please deposit more capital or wait for existing transactions to complete.",
    {}
  );
}

/**
 * Insufficient profit error
 */
export function insufficientProfitError(): AppError {
  return new AppError(
    ErrorCode.INSUFFICIENT_PROFIT,
    "You do not have sufficient profit balance to complete this withdrawal. Please check your profit balance and try again.",
    {}
  );
}

/**
 * Purchase window closed error
 */
export function purchaseWindowClosedError(): AppError {
  return new AppError(
    ErrorCode.PURCHASE_WINDOW_CLOSED,
    "Purchases are currently not available. The purchase window is closed. Please check back later or contact support for more information.",
    {}
  );
}

/**
 * Unit not available error
 */
export function unitNotAvailableError(): AppError {
  return new AppError(
    ErrorCode.UNIT_NOT_AVAILABLE,
    "This unit is no longer available. It may have been locked by another trader or removed from the listing. Please try selecting a different unit.",
    {}
  );
}

/**
 * Inventory not available error
 */
export function inventoryNotAvailableError(): AppError {
  return new AppError(
    ErrorCode.INVENTORY_NOT_AVAILABLE,
    "This inventory is no longer available for purchase. It may have been sold or is currently unavailable. Please try selecting different inventory.",
    {}
  );
}

/**
 * Delivery SLA expired error
 */
export function deliverySLAExpiredError(): AppError {
  return new AppError(
    ErrorCode.DELIVERY_SLA_EXPIRED,
    "The delivery deadline for this transaction has passed. Please contact support to resolve this issue.",
    {}
  );
}

/**
 * Pickup SLA expired error
 */
export function pickupSLAExpiredError(): AppError {
  return new AppError(
    ErrorCode.PICKUP_SLA_EXPIRED,
    "The pickup deadline for this purchase has passed. Please contact support to resolve this issue.",
    {}
  );
}

/**
 * Invalid role error
 */
export function invalidRoleError(requiredRole: string): AppError {
  return new AppError(
    ErrorCode.INVALID_ROLE,
    `This operation requires a ${requiredRole} account. Please ensure you are logged in with the correct account type.`,
    {
      requiredRole,
    }
  );
}

/**
 * Invalid amount error
 */
export function invalidAmountError(): AppError {
  return new AppError(
    ErrorCode.INVALID_AMOUNT,
    "The amount specified is invalid. Please enter a positive amount and try again.",
    {}
  );
}

/**
 * Invalid kilos error
 */
export function invalidKilosError(): AppError {
  return new AppError(
    ErrorCode.INVALID_KILOS,
    "The number of kilos specified is invalid. Please enter a positive number and try again.",
    {}
  );
}

/**
 * Not found errors
 */
export function userNotFoundError(): AppError {
  return new AppError(
    ErrorCode.USER_NOT_FOUND,
    "User account not found. Please check your login credentials and try again.",
    {}
  );
}

export function listingNotFoundError(): AppError {
  return new AppError(
    ErrorCode.LISTING_NOT_FOUND,
    "The requested listing could not be found. It may have been removed or is no longer available.",
    {}
  );
}

export function unitNotFoundError(): AppError {
  return new AppError(
    ErrorCode.UNIT_NOT_FOUND,
    "The requested unit could not be found. It may have been removed or is no longer available.",
    {}
  );
}

export function inventoryNotFoundError(): AppError {
  return new AppError(
    ErrorCode.INVENTORY_NOT_FOUND,
    "The requested inventory could not be found. It may have been sold or is no longer available.",
    {}
  );
}

/**
 * Authorization errors
 */
export function notAuthorizedError(): AppError {
  return new AppError(
    ErrorCode.NOT_AUTHORIZED,
    "You are not authorized to perform this operation. Please ensure you have the necessary permissions.",
    {}
  );
}

export function notAdminError(): AppError {
  return new AppError(
    ErrorCode.NOT_ADMIN,
    "This operation requires administrator privileges. Please contact an administrator if you need access.",
    {}
  );
}

/**
 * State errors
 */
export function alreadyLockedError(): AppError {
  return new AppError(
    ErrorCode.ALREADY_LOCKED,
    "This unit has already been locked by another trader. Please try selecting a different unit.",
    {}
  );
}

export function alreadyVerifiedError(): AppError {
  return new AppError(
    ErrorCode.ALREADY_VERIFIED,
    "This delivery has already been verified. No further action is required.",
    {}
  );
}

export function invalidDeliveryStatusError(currentStatus: string): AppError {
  return new AppError(
    ErrorCode.INVALID_DELIVERY_STATUS,
    `This operation cannot be performed because the delivery status is "${currentStatus}". Please contact support if you believe this is an error.`,
    {
      currentStatus,
    }
  );
}

/**
 * Generic validation error
 */
export function validationFailedError(message: string): AppError {
  return new AppError(
    ErrorCode.VALIDATION_FAILED,
    message,
    {}
  );
}

/**
 * Generic operation failed error
 */
export function operationFailedError(message: string): AppError {
  return new AppError(
    ErrorCode.OPERATION_FAILED,
    message,
    {}
  );
}

/**
 * Helper to convert AppError to Convex error
 * 
 * Convex mutations throw errors, so we need to throw the AppError
 * The error message will be the userMessage (human-readable)
 */
export function throwAppError(error: AppError): never {
  throw error;
}

/**
 * Helper to create and throw error in one call
 */
export function throwError(
  code: ErrorCode,
  userMessage: string,
  metadata?: Record<string, any>
): never {
  throw new AppError(code, userMessage, metadata);
}
