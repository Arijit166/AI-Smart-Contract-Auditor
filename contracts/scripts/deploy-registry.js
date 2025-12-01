const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const network = hre.network.name;
  console.log(`🚀 Deploying VulnerabilityRegistry to ${network}...`);

  await hre.run('compile');

  console.log("📝 Deploying VulnerabilityRegistry...");
  const VulnerabilityRegistry = await hre.ethers.getContractFactory("VulnerabilityRegistry");
  const registry = await VulnerabilityRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`✅ VulnerabilityRegistry deployed to: ${registryAddress}`);

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

  deployments.VulnerabilityRegistry = registryAddress;
  deployments.lastUpdated = new Date().toISOString();

  fs.writeFileSync(filename, JSON.stringify(deployments, null, 2));
  console.log(`💾 Deployment info saved to ${filename}`);

  console.log("\n🎉 Deployment complete!");
  console.log(`\nAdd to .env:\nNEXT_PUBLIC_VULNERABILITY_REGISTRY_${network.toUpperCase().replace('-', '_')}=${registryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });