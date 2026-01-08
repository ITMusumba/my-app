# Dormant Code

This directory contains code that is **permanently dormant** and **MUST NOT be reactivated**.

## ⚠️ CRITICAL WARNING

**Do NOT use code from this directory in the active codebase.**

## Contents

### `supabase/`
- **Status**: PERMANENTLY DORMANT - DO NOT REACTIVATE
- **Reason**: Project architecture requires Convex ONLY - Supabase is FORBIDDEN
- **Action Required**: See `supabase/DO_NOT_USE.md` for detailed explanation
- **Active Backend**: Convex (see `convex/` directory)

## Why This Code Exists

This code is preserved **ONLY** for:
- Historical reference
- Audit trail of architectural decisions
- Understanding what was tried and why it was rejected

## DO NOT Reactivate

**Supabase code in this directory:**
- ❌ Violates core architecture constraints
- ❌ Breaks business logic consistency
- ❌ Compromises system safety (spend cap, pay-to-lock)
- ❌ Requires complete system rewrite

**If you think you need Supabase:**
1. Review `docs/architecture.md`
2. Review `convex/schema.ts`
3. Review `README.md` tech stack requirements
4. **Ask**: Can this be done with Convex? (Almost certainly yes)
5. Discuss with architecture team BEFORE writing any code

## Active Development

✅ **Use Convex** - Located in `convex/` directory  
✅ **All business logic** - In `convex/*.ts` files  
✅ **Schema** - Defined in `convex/schema.ts`  

**DO NOT reference or copy code from this dormant directory.**
