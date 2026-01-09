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

# Deploy to dev
npx convex deploy --project-name dev-farm2market

Write-Host ""
Write-Host "✅ Dev deployment complete!" -ForegroundColor Green
Write-Host "📝 Make sure NEXT_PUBLIC_CONVEX_URL is set to the dev URL in Vercel" -ForegroundColor Yellow
