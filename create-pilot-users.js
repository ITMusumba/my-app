// Create Pilot Test Users
const { execSync } = require('child_process');

const users = [
  { email: "farmer1@pilot.farm2market", role: "farmer" },
  { email: "farmer2@pilot.farm2market", role: "farmer" },
  { email: "trader1@pilot.farm2market", role: "trader" },
  { email: "trader2@pilot.farm2market", role: "trader" },
  { email: "buyer1@pilot.farm2market", role: "buyer" },
  { email: "admin@pilot.farm2market", role: "admin" },
];

console.log("Creating pilot test users...\n");

for (const user of users) {
  const json = JSON.stringify(user);
  try {
    console.log(`Creating ${user.email}...`);
    execSync(`npx convex run auth:createUser '${json}'`, { stdio: 'inherit' });
    console.log(`✓ Created ${user.email}\n`);
  } catch (error) {
    console.log(`✗ Failed to create ${user.email} (may already exist)\n`);
  }
}

console.log("Done! All users share password: Farm2Market2024");
