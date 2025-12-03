const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const network = hre.network.name;
  console.log(`🚀 Deploying Reward System to ${network}...`);

  // Deploy AuditToken
  console.log("📝 Deploying AuditToken...");
  const AuditToken = await hre.ethers.getContractFactory("AuditToken");
  const auditToken = await AuditToken.deploy();
  await auditToken.waitForDeployment();
  const tokenAddress = await auditToken.getAddress();
  console.log(`✅ AuditToken deployed to: ${tokenAddress}`);

  // Deploy SubscriptionManager
  console.log("📝 Deploying SubscriptionManager...");
  const SubscriptionManager = await hre.ethers.getContractFactory("SubscriptionManager");
  const subscriptionManager = await SubscriptionManager.deploy(tokenAddress);
  await subscriptionManager.waitForDeployment();
  const subscriptionAddress = await subscriptionManager.getAddress();
  console.log(`✅ SubscriptionManager deployed to: ${subscriptionAddress}`);

  // Save deployments
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = path.join(deploymentsDir, `${network}.json`);
  let deployments = {};
  
  if (fs.existsSync(filename)) {
    deployments = JSON.parse(fs.readFileSync(filename, 'utf8'));
  }

  deployments.AuditToken = tokenAddress;
  deployments.SubscriptionManager = subscriptionAddress;
  deployments.lastUpdated = new Date().toISOString();

  fs.writeFileSync(filename, JSON.stringify(deployments, null, 2));
  console.log(`💾 Deployment info saved to ${filename}`);

  console.log("\n🎉 Deployment complete!");
  console.log(`\nAdd to .env:`);
  console.log(`NEXT_PUBLIC_AUDIT_TOKEN_${network.toUpperCase().replace('-', '_')}=${tokenAddress}`);
  console.log(`NEXT_PUBLIC_SUBSCRIPTION_MANAGER_${network.toUpperCase().replace('-', '_')}=${subscriptionAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });