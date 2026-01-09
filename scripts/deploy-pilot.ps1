# Deploy to Pilot Convex Deployment
# This script deploys the current code to the pilot Convex project

Write-Host "🚀 Deploying to Pilot Convex deployment..." -ForegroundColor Cyan
Write-Host ""

# Check if we're on the right branch (optional warning)
$currentBranch = git branch --show-current
if ($currentBranch -ne "main" -and $currentBranch -ne "master") {
    Write-Host "⚠️  Warning: You're not on main/master branch. Current branch: $currentBranch" -ForegroundColor Yellow
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
}

# Deploy to pilot
npx convex deploy --project-name pilot-farm2market

Write-Host ""
Write-Host "✅ Pilot deployment complete!" -ForegroundColor Green
Write-Host "📝 Make sure NEXT_PUBLIC_CONVEX_URL is set to the pilot URL in Vercel" -ForegroundColor Yellow
