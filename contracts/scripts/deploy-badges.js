const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const network = hre.network.name;
  console.log(`🚀 Deploying AuditBadgeNFT to ${network}...`);

  console.log("🔨 Compiling contracts...");
  await hre.run('compile');

  console.log("📝 Deploying AuditBadgeNFT...");
  const AuditBadgeNFT = await hre.ethers.getContractFactory("AuditBadgeNFT");
  const badgeNFT = await AuditBadgeNFT.deploy();
  await badgeNFT.waitForDeployment();
  const badgeAddress = await badgeNFT.getAddress();
  console.log(`✅ AuditBadgeNFT deployed to: ${badgeAddress}`);

  // Load existing deployments
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = path.join(deploymentsDir, `${network}.json`);
  let deployments = {};
  
  if (fs.existsSync(filename)) {
    deployments = JSON.parse(fs.readFileSync(filename, 'utf8'));
  }

  deployments = {
    ...deployments,
    network,
    chainId: hre.network.config.chainId,
    contracts: {
      ...deployments.contracts,
      AuditBadgeNFT: badgeAddress
    },
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(filename, JSON.stringify(deployments, null, 2));
  console.log(`💾 Deployment info saved to ${filename}`);

  console.log("\n🎉 Deployment complete!");
  console.log(`\nNEXT_PUBLIC_BADGE_NFT_CONTRACT_${network.toUpperCase().replace('-', '_')}=${badgeAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });