const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const network = hre.network.name;
  console.log(`🚀 Deploying AuditReputation to ${network}...`);

  // Compile contracts first
  console.log("🔨 Compiling contracts...");
  await hre.run('compile');

  // Deploy AuditReputation
  console.log("📝 Deploying AuditReputation...");
  const AuditReputation = await hre.ethers.getContractFactory("AuditReputation");
  
  // ✅ FIXED: Simpler deployment without custom gas settings
  console.log("⚙️ Deploying contract...");
  const reputation = await AuditReputation.deploy();
  
  console.log("⏳ Waiting for deployment...");
  await reputation.waitForDeployment();
  
  const reputationAddress = await reputation.getAddress();
  console.log(`✅ AuditReputation deployed to: ${reputationAddress}`);

  // Load existing deployments or create new
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = path.join(deploymentsDir, `${network}.json`);
  let deployments = {};
  
  if (fs.existsSync(filename)) {
    deployments = JSON.parse(fs.readFileSync(filename, 'utf8'));
  }

  // Update deployments with reputation contract
  deployments = {
    ...deployments,
    network,
    chainId: hre.network.config.chainId,
    contracts: {
      ...deployments.contracts,
      AuditReputation: reputationAddress
    },
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(filename, JSON.stringify(deployments, null, 2));
  console.log(`💾 Deployment info saved to ${filename}`);

  console.log("\n🎉 Deployment complete!");
  console.log("\nAdd this to your .env file:");
  console.log(`NEXT_PUBLIC_REPUTATION_CONTRACT_${network.toUpperCase().replace('-', '_')}=${reputationAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });