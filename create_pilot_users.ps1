# Create Pilot Test Users
# Run this script to create all test users for the pilot

Write-Host "Creating pilot test users..." -ForegroundColor Green

$users = @(
    @{email="farmer1@pilot.farm2market"; role="farmer"},
    @{email="farmer2@pilot.farm2market"; role="farmer"},
    @{email="trader1@pilot.farm2market"; role="trader"},
    @{email="trader2@pilot.farm2market"; role="trader"},
    @{email="buyer1@pilot.farm2market"; role="buyer"},
    @{email="admin@pilot.farm2market"; role="admin"}
)

foreach ($user in $users) {
    $json = '{"email":"' + $user.email + '","role":"' + $user.role + '"}'
    Write-Host "Creating $($user.email)..." -ForegroundColor Yellow
    npx convex run auth:createUser $json
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Created $($user.email)" -ForegroundColor Green
    } else {
        Write-Host "Failed to create $($user.email)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done! All users share password: Farm2Market2024" -ForegroundColor Green
