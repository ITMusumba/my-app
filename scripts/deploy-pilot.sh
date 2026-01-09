#!/bin/bash
# Deploy to Pilot Convex Deployment
# This script deploys the current code to the pilot Convex project

echo "🚀 Deploying to Pilot Convex deployment..."
echo ""

# Check if we're on the right branch (optional warning)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
  echo "⚠️  Warning: You're not on main/master branch. Current branch: $CURRENT_BRANCH"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Deploy to pilot
npx convex deploy --project-name pilot-farm2market

echo ""
echo "✅ Pilot deployment complete!"
echo "📝 Make sure NEXT_PUBLIC_CONVEX_URL is set to the pilot URL in Vercel"
