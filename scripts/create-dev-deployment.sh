#!/bin/bash
# Create Dev Convex Deployment
# This script guides you through creating a dev Convex deployment

echo "🚀 Creating Dev Convex Deployment"
echo ""
echo "This will create a NEW Convex project for dev mode."
echo "Your existing pilot deployment will NOT be affected."
echo ""

# Check if user wants to proceed
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Step 1: Creating new Convex project..."
echo "You will be prompted to:"
echo "  1. Log in to Convex (if not already logged in)"
echo "  2. Choose or create a team"
echo "  3. Enter project name: dev-farm2market"
echo "  4. Choose deployment type: Cloud"
echo ""

read -p "Ready to start? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Running: npx convex dev --configure new"
echo ""

# Run the configure command
npx convex dev --configure new

echo ""
echo "✅ Project creation complete!"
echo ""
echo "Step 2: Note your Convex URL"
echo "Look for a line like: NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud"
echo "Copy this URL - you'll need it for Vercel setup."
echo ""

read -p "Enter your dev Convex URL (or press Enter to skip): " convexUrl
if [ ! -z "$convexUrl" ]; then
    echo ""
    echo "✅ Dev Convex URL: $convexUrl"
    echo ""
    echo "Step 3: Deploying functions to dev..."
    
    # Deploy to the new project
    npx convex deploy
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "Next steps:"
    echo "1. Create a dev Vercel project (see docs/setup_dev_mode.md)"
    echo "2. Set environment variables in Vercel:"
    echo "   - NEXT_PUBLIC_CONVEX_URL = $convexUrl"
    echo "   - NEXT_PUBLIC_DEPLOYMENT_MODE = dev"
    echo ""
else
    echo ""
    echo "⚠️  Please note your Convex URL from the output above."
    echo "You'll need it when setting up the Vercel project."
    echo ""
    echo "To deploy functions later, run:"
    echo "  npx convex deploy"
    echo ""
fi
