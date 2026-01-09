# Create Dev Convex Deployment
# This script guides you through creating a dev Convex deployment

Write-Host "🚀 Creating Dev Convex Deployment" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will create a NEW Convex project for dev mode." -ForegroundColor Yellow
Write-Host "Your existing pilot deployment will NOT be affected." -ForegroundColor Green
Write-Host ""

# Check if user wants to proceed
$response = Read-Host "Continue? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Step 1: Creating new Convex project..." -ForegroundColor Cyan
Write-Host "You will be prompted to:" -ForegroundColor Yellow
Write-Host "  1. Log in to Convex (if not already logged in)" -ForegroundColor Yellow
Write-Host "  2. Choose or create a team" -ForegroundColor Yellow
Write-Host "  3. Enter project name: dev-farm2market" -ForegroundColor Yellow
Write-Host "  4. Choose deployment type: Cloud" -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Ready to start? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Running: npx convex dev --configure new" -ForegroundColor Cyan
Write-Host ""

# Run the configure command
npx convex dev --configure new

Write-Host ""
Write-Host "✅ Project creation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Step 2: Note your Convex URL" -ForegroundColor Cyan
Write-Host "Look for a line like: NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud" -ForegroundColor Yellow
Write-Host "Copy this URL - you'll need it for Vercel setup." -ForegroundColor Yellow
Write-Host ""

$convexUrl = Read-Host "Enter your dev Convex URL (or press Enter to skip)"
if ($convexUrl) {
    Write-Host ""
    Write-Host "✅ Dev Convex URL: $convexUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "Step 3: Deploying functions to dev..." -ForegroundColor Cyan
    
    # Deploy to the new project
    npx convex deploy
    
    Write-Host ""
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Create a dev Vercel project (see docs/setup_dev_mode.md)" -ForegroundColor Yellow
    Write-Host "2. Set environment variables in Vercel:" -ForegroundColor Yellow
    Write-Host "   - NEXT_PUBLIC_CONVEX_URL = $convexUrl" -ForegroundColor Yellow
    Write-Host "   - NEXT_PUBLIC_DEPLOYMENT_MODE = dev" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  Please note your Convex URL from the output above." -ForegroundColor Yellow
    Write-Host "You'll need it when setting up the Vercel project." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To deploy functions later, run:" -ForegroundColor Cyan
    Write-Host "  npx convex deploy" -ForegroundColor White
    Write-Host ""
}
