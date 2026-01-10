# Setup Convex Deploy Key and Deploy
# This script helps you set up a deploy key for Convex deployment

Write-Host "Convex Deploy Key Setup" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Get Deploy Key from Convex Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://dashboard.convex.dev/d/adamant-armadillo-601/settings" -ForegroundColor White
Write-Host "2. Navigate to Deploy Keys or API Keys section" -ForegroundColor White
Write-Host "3. Click Generate Deploy Key or Create API Key" -ForegroundColor White
Write-Host "4. Copy the deploy key (it will look like: convex_xxxxx...)" -ForegroundColor White
Write-Host ""

$deployKey = Read-Host "Paste your Convex deploy key here (or press Enter to skip)"

if ([string]::IsNullOrWhiteSpace($deployKey)) {
    Write-Host ""
    Write-Host "No deploy key provided. Skipping deployment." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can set it manually later:" -ForegroundColor White
    Write-Host "  Set environment variable CONVEX_DEPLOY_KEY" -ForegroundColor Gray
    Write-Host "  npm run deploy:dev" -ForegroundColor Gray
    exit 0
}

# Set the deploy key as environment variable
$env:CONVEX_DEPLOY_KEY = $deployKey

Write-Host ""
Write-Host "Deploy key set!" -ForegroundColor Green
Write-Host ""

# Ask if user wants to deploy now
$deployNow = Read-Host "Deploy to dev Convex deployment now? (y/n)"

if ($deployNow -eq "y" -or $deployNow -eq "Y") {
    Write-Host ""
    Write-Host "Deploying to Dev Convex deployment..." -ForegroundColor Cyan
    Write-Host "Deployment: https://adamant-armadillo-601.convex.cloud" -ForegroundColor Cyan
    Write-Host ""
    
    npm run deploy:dev
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Deployment complete!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Deployment failed. Check the error above." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "Deploy key is set. You can deploy later with:" -ForegroundColor White
    Write-Host "  Set CONVEX_DEPLOY_KEY environment variable" -ForegroundColor Gray
    Write-Host "  npm run deploy:dev" -ForegroundColor Gray
}
