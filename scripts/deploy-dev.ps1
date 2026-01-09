# Deploy to Dev Convex Deployment
# This script deploys the current code to the dev Convex project

Write-Host "🚀 Deploying to Dev Convex deployment..." -ForegroundColor Cyan
Write-Host ""

# Check if we're on the right branch (optional warning)
$currentBranch = git branch --show-current
if ($currentBranch -ne "develop" -and $currentBranch -ne "dev") {
    Write-Host "⚠️  Warning: You're not on develop/dev branch. Current branch: $currentBranch" -ForegroundColor Yellow
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
}

# Deploy to dev using .env.local configuration
Write-Host "Deploying to: https://adamant-armadillo-601.convex.cloud" -ForegroundColor Cyan
npx convex deploy --env-file .env.local --yes

Write-Host ""
Write-Host "✅ Dev deployment complete!" -ForegroundColor Green
Write-Host "📝 Dev Convex URL: https://adamant-armadillo-601.convex.cloud" -ForegroundColor Yellow
Write-Host "📝 Make sure NEXT_PUBLIC_CONVEX_URL is set to this URL in Vercel" -ForegroundColor Yellow
