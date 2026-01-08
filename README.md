# Farm2Market Uganda

**Controlled, negotiation-driven agricultural trading platform with strict, non-negotiable rules.**

This repository is the canonical source of truth for the application. All system behavior must be reflected in files here.

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Convex (serverless backend)
- **Language**: TypeScript everywhere
- **Deployment**: Vercel-compatible

### Core Principles

1. **Backend**: Convex only - no Supabase, Firebase, or raw SQL
2. **Business Logic**: All business logic lives in Convex functions
3. **User Roles**: Exactly one role per user (farmer, trader, buyer, admin)
4. **Anonymity**: System-generated aliases only - no real names or identities
5. **UTID**: Every meaningful action generates or references a UTID
6. **Wallet System**: Closed loop, ledger-based (NOT a bank)
7. **Spend Cap**: Trader exposure max UGX 1,000,000 (enforced atomically)
8. **Pay-to-Lock**: Unit locking and wallet debit are atomic operations

## Project Structure

```
my-app/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema (schema-first design)
│   ├── auth.ts            # Authentication & authorization
│   ├── wallet.ts          # Wallet system (closed loop)
│   ├── listings.ts        # Farmer listings & inventory
│   ├── payments.ts        # Pay-to-lock system (atomic)
│   ├── admin.ts           # Admin authority & actions
│   ├── utils.ts           # Utility functions (UTID, exposure calc)
│   ├── constants.ts       # System constants
│   └── _generated/        # Auto-generated Convex files
├── docs/                  # Documentation
│   ├── architecture.md    # System architecture & governance
│   ├── day66_pre_activation.md
│   └── day67_production_activation.md
├── dormant/               # Dormant/unused code
│   └── supabase/          # Supabase code (not used - Convex only)
├── package.json
├── tsconfig.json
├── next.config.js
├── convex.json            # Convex configuration
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Convex account (sign up at https://dashboard.convex.dev)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Convex**:
   ```bash
   npx convex dev
   ```
   This will:
   - Create a Convex project (if needed)
   - Generate `.env.local` with `NEXT_PUBLIC_CONVEX_URL`
   - Start the Convex development server

3. **Start Next.js dev server**:
   ```bash
   npm run dev
   ```

4. **Open** http://localhost:3000

## Development

### Convex Functions

All business logic lives in `convex/`:
- **Schema**: `convex/schema.ts` - defines all tables and indexes
- **Auth**: `convex/auth.ts` - user creation, role verification
- **Wallet**: `convex/wallet.ts` - closed loop wallet system
- **Listings**: `convex/listings.ts` - farmer listings, auto-split into 10kg units
- **Payments**: `convex/payments.ts` - atomic pay-to-lock system
- **Admin**: `convex/admin.ts` - admin actions, purchase windows

### Key Features

#### 1. User Roles (Exactly One Per User)
- `farmer`: Lists produce, receives payments
- `trader`: Buys from farmers, sells to buyers
- `buyer`: Purchases from traders (no price visibility)
- `admin`: Final authority, controls purchase windows

#### 2. Anonymity (Non-Negotiable)
- All users interact via system-generated aliases
- No real names, phone numbers, or identities exposed
- Aliases are stable but non-identifying

#### 3. UTID (Unique Transaction ID)
- Every meaningful action generates a UTID
- Format: `YYYYMMDD-HHMMSS-ROLE-RANDOM`
- Immutable, server-generated, human-readable
- Anchors wallet entries, listings, negotiations, admin actions

#### 4. Wallet System (Closed Loop)
- Internal ledger only (NOT a bank)
- Traders have:
  - `capital` ledger (locked by default)
  - `profit` ledger (always withdrawable)
- No balance overwrites - ledger entries only
- All entries reference UTIDs

#### 5. Spend Cap Enforcement
- Trader exposure max: UGX 1,000,000
- Exposure = capital committed + locked orders + inventory value
- Enforcement happens BEFORE payment
- Violations fail atomically

#### 6. Pay-to-Lock (Critical)
- Unit locking and wallet debit are atomic
- First successful payment wins
- Race conditions are impossible
- Partial state changes are forbidden

#### 7. Listings & Inventory
- Farmers list produce → auto-split into 10kg units
- Units lock only on successful payment
- Trader inventory aggregates into 100kg blocks for buyers
- Buyers never see prices

#### 8. Time-Based Rules
- Farmer delivery SLA: 6 hours after trader payment
- Buyer pickup SLA: 48 hours after purchase
- Storage fees apply as kilo-shaving per day

#### 9. Admin Authority
- Admin decisions are final in v1.x
- No automated dispute resolution
- All admin actions logged with UTID, reason, timestamp
- Admin controls purchase windows (buyers can only buy during open windows)

## Rules of Operation

- No execution without artifacts
- No deployment without explicit authorization
- No assumptions without evidence
- All business logic in Convex functions
- Server-side role enforcement (never trust client)
- Atomic operations for critical paths (pay-to-lock)

## Current Status

- Status: Project restructured for Convex backend
- Environment: Local development setup
- Backend: Convex (Supabase moved to dormant/)
- Production: Not activated (see `docs/architecture.md`)

## Out of Scope (v1.x)

- Reputation systems
- Automated disputes
- Credit, loans, or financing
- SMS, USSD, or WhatsApp
- Multi-admin approval flows
- Mobile apps

## License

Private - Farm2Market Uganda