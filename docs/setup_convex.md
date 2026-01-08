# Convex Setup Guide

## Environment Variables

### For Local Development

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_CONVEX_URL=https://chatty-camel-373.convex.cloud
```

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `NEXT_PUBLIC_CONVEX_URL`
   - **Value**: `https://chatty-camel-373.convex.cloud`
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**
5. Redeploy your application (or it will auto-deploy on next push)

## Deploy Convex Functions

After setting the environment variable, you need to deploy your Convex functions to regenerate the API:

```bash
npx convex deploy
```

This will:
- Deploy all Convex functions to your deployment
- Regenerate `convex/_generated/api.d.ts` with all available modules
- Make the `pilotMode` and other modules available to the frontend

## Verify Connection

Once both are set up:

1. The dashboard should show "Connected" status
2. Pilot mode status should display real-time data
3. No warning messages about missing Convex URL

## Troubleshooting

### "Convex connection not configured" warning
- Check that `NEXT_PUBLIC_CONVEX_URL` is set in Vercel
- Verify the URL is correct (should end with `.convex.cloud`)
- Redeploy after adding the environment variable

### "API module not found" errors
- Run `npx convex deploy` to regenerate the API
- Check that all Convex functions are exported correctly
- Verify the deployment URL matches your environment variable
