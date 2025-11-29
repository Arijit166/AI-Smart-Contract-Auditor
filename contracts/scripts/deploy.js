const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const network = hre.network.name;
  console.log(`🚀 Deploying to ${network}...`);

  // Compile contracts first
  console.log("🔨 Compiling contracts...");
  await hre.run('compile');

  // Deploy AuditCertificateNFT
  console.log("📝 Deploying AuditCertificateNFT...");
  const AuditCertificateNFT = await hre.ethers.getContractFactory("AuditCertificateNFT");
  const certificateNFT = await AuditCertificateNFT.deploy();
  await certificateNFT.waitForDeployment();
  const nftAddress = await certificateNFT.getAddress();
  console.log(`✅ AuditCertificateNFT deployed to: ${nftAddress}`);

  // Deploy AuditRegistry
  console.log("📝 Deploying AuditRegistry...");
  const AuditRegistry = await hre.ethers.getContractFactory("AuditRegistry");
  const auditRegistry = await AuditRegistry.deploy();
  await auditRegistry.waitForDeployment();
  const registryAddress = await auditRegistry.getAddress();
  console.log(`✅ AuditRegistry deployed to: ${registryAddress}`);

  // Save deployment addresses
  const deployments = {
    network,
    chainId: hre.network.config.chainId,
    contracts: {
      AuditCertificateNFT: nftAddress,
      AuditRegistry: registryAddress
    },
    deployedAt: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(filename, JSON.stringify(deployments, null, 2));
  console.log(`💾 Deployment info saved to ${filename}`);

  console.log("\n🎉 Deployment complete!");
  console.log("\nAdd these to your .env file:");
  console.log(`NEXT_PUBLIC_NFT_CONTRACT_${network.toUpperCase().replace('-', '_')}=${nftAddress}`);
  console.log(`NEXT_PUBLIC_REGISTRY_CONTRACT_${network.toUpperCase().replace('-', '_')}=${registryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });