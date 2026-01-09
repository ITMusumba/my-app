#!/bin/bash
# Deploy to Dev Convex Deployment
# This script deploys the current code to the dev Convex project

echo "🚀 Deploying to Dev Convex deployment..."
echo ""

# Check if we're on the right branch (optional warning)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ] && [ "$CURRENT_BRANCH" != "dev" ]; then
  echo "⚠️  Warning: You're not on develop/dev branch. Current branch: $CURRENT_BRANCH"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Deploy to dev
npx convex deploy --project-name dev-farm2market

echo ""
echo "✅ Dev deployment complete!"
echo "📝 Make sure NEXT_PUBLIC_CONVEX_URL is set to the dev URL in Vercel"
