# ⚠️ DO NOT USE - SUPABASE IS FORBIDDEN ⚠️

## CRITICAL WARNING

**This code is DORMANT and MUST NEVER be reactivated.**

## Why This Code Exists

This directory contains legacy Supabase code from an earlier iteration of the Farm2Market Uganda project. It is preserved **ONLY** for historical reference and audit purposes.

## Why Supabase Is Forbidden

### 1. Architecture Decision (Non-Negotiable)

The project architecture explicitly requires:
- **Backend**: Convex ONLY
- **No Supabase, Firebase, or raw SQL**

This is a **core constraint** defined in the MASTER SYSTEM & EXECUTION DOCUMENT (v1.1).

### 2. Business Logic Location

All business logic **MUST** live in Convex functions. Using Supabase would:
- Violate the single source of truth principle
- Create duplicate business logic paths
- Break the atomic transaction guarantees
- Compromise the pay-to-lock system integrity

### 3. Schema-First Design

The project uses Convex's schema-first design:
- Schema defined in `convex/schema.ts`
- All tables, indexes, and relationships are Convex-native
- Migrating to Supabase would require complete schema rewrite
- Would break all existing Convex functions

### 4. Critical System Features

The following features are **impossible** to implement correctly with Supabase:

- **Atomic Pay-to-Lock**: Convex guarantees atomic transactions. Supabase does not provide the same guarantees for the pay-to-lock pattern.
- **Spend Cap Enforcement**: Requires atomic exposure calculation + wallet debit. Convex mutations are atomic; Supabase transactions are not suitable for this pattern.
- **Real-time Subscriptions**: Convex provides real-time subscriptions out of the box. Supabase requires additional setup and doesn't match Convex's developer experience.

### 5. Deployment Architecture

- **Vercel-compatible**: The project is designed for Vercel deployment
- **Convex Integration**: Convex is designed to work seamlessly with Next.js and Vercel
- **Supabase**: Would require additional infrastructure and configuration

## What Happens If You Use This Code

❌ **Violates core architecture constraints**  
❌ **Breaks business logic consistency**  
❌ **Compromises system safety (spend cap, pay-to-lock)**  
❌ **Creates technical debt and maintenance burden**  
❌ **Requires complete system rewrite**  

## If You Think You Need Supabase

**STOP. Do not proceed.**

Instead:
1. Review `docs/architecture.md` for the system architecture
2. Review `convex/schema.ts` to understand the data model
3. Review `README.md` for the tech stack requirements
4. **Ask**: Can this be done with Convex? (Answer: Almost certainly yes)
5. If you have a legitimate use case, discuss with the architecture team BEFORE writing any code

## Current Active Backend

✅ **Convex** - Located in `convex/` directory  
✅ **All business logic** - In `convex/*.ts` files  
✅ **Schema** - Defined in `convex/schema.ts`  

## This Code Is For

- ✅ Historical reference only
- ✅ Audit trail of architectural decisions
- ✅ Understanding what was tried and why it was rejected

## This Code Is NOT For

- ❌ Copying into active codebase
- ❌ Using as a reference for new features
- ❌ Reactivating in any form
- ❌ Using as a "starting point" for Convex migration

## Final Warning

**Using Supabase code in this project will:**
1. Break the system architecture
2. Violate non-negotiable constraints
3. Require complete rewrite
4. Compromise system safety and correctness

**DO NOT USE THIS CODE.**

---

*Last updated: Project reorganization to Convex-only architecture*  
*Status: PERMANENTLY DORMANT - DO NOT REACTIVATE*
