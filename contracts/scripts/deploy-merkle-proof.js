const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const network = hre.network.name;
  console.log(`🚀 Deploying MerkleAuditProof to ${network}...`);

  await hre.run('compile');

  const MerkleAuditProof = await hre.ethers.getContractFactory("MerkleAuditProof");
  const merkleProof = await MerkleAuditProof.deploy();
  await merkleProof.waitForDeployment();
  const merkleProofAddress = await merkleProof.getAddress();
  console.log(`✅ MerkleAuditProof deployed to: ${merkleProofAddress}`);

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = path.join(deploymentsDir, `${network}.json`);
  let deployments = {};
  
  if (fs.existsSync(filename)) {
    deployments = JSON.parse(fs.readFileSync(filename, 'utf8'));
  }

  deployments.MerkleAuditProof = merkleProofAddress;
  deployments.lastUpdated = new Date().toISOString();

  fs.writeFileSync(filename, JSON.stringify(deployments, null, 2));
  console.log(`💾 Deployment info saved to ${filename}`);

  console.log(`\nAdd to .env:\nNEXT_PUBLIC_MERKLE_PROOF_${network.toUpperCase().replace('-', '_')}=${merkleProofAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });