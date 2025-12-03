# 🔐 Smart Contract Auditor

An end-to-end, AI-powered smart contract security platform that enables users to:

- Authenticate with MetaMask

-  Access an interactive audit dashboard

-  Upload or paste Solidity code

-  Run vulnerability analysis using LLM + Slither

-  Generate vulnerability reports & auto-fixed Solidity code

-  Deploy fixed contracts to:

   -  Celo Sepolia

   - Flow EVM Testnet

   - Polygon Amoy

-  Export audits as PDF

-  Check deployment results via block explorer

-  Manage account profile (name + photo)

-  Backend Python microservice handles Slither + LLM

-  Merkle-Proof Cryptographically Verified Audit Proofs

-  Leaderboard Reputation System

-  NFT Auditor Badges

-  Audit Token + Subscription Manager

-  On-chain Vulnerability Registry

## 🚀 Features
- **MetaMask Authentication**

   Secure login with wallet-based identity. Easily track audits, badges, and on-chain scores.

- **Smart Contract Audit (LLM + Slither)**

  - Upload or paste Solidity code → backend automatically performs:

  - Static analysis via Slither

  - LLM-based vulnerability explanation

  - Auto-fixed, secure Solidity code

  - Raw analysis used to create cryptographic audit proofs

-  **Merkle-Proof Audit Verification**

    Every audit is converted into a cryptographically verifiable Merkle Tree, including:

     - Hash of each vulnerability

     - Hash of each fix
 
     - Hash of raw LLM reasoning

      - Hash of generated PDF

   The Merkle Root is stored on-chain, proving:

    -  ✔ Audit not tampered
    -  ✔ Fixes are genuine
    -  ✔ The audit PDF is verifiable
    -  ✔ Every vulnerability has integrity

-  **Smart Contract Deployment Module**

    Deploy auto-fixed contracts directly to:

    - ⭐ Polygon Amoy
 
    - 🌍 Celo Sepolia

    - 🌕 Flow EVM Testnet

    Deployment results include:

    - Contract address

    - Transaction hash
      
    - Audit ID

    - Explorer redirect link

-  **Vulnerability Registry (On-chain)**

   Every discovered vulnerability is:

   - Hashed

   - Classified

   - Stored on-chain

   - Queryable by auditors/projects

   - Used for ecosystem-wide tracking.

- **Leaderboard Reputation System**

  Each auditor receives:

   - Reputation Points

   - Streaks / Scores

   - Leaderboard Position

   Points increase based on:

    - Verified audits

    - Difficulty of vulnerabilities

    - On-chain badge score

-  **NFT Auditor Badges**

   Auditors earn soulbound NFT badges based on performance:

   - 🥉 Bronze
 
   - 🥈 Silver

   - 🥇 Gold

    Badges are claimable after generating a verified audit.

- **Subscription Manager**

   Users can unlock premium features using:

   - Subscription Contract

    Features unlocked:

    - Unlimited audits

    - Larger contracts

    - Premium badge tiers

- **Account Management**

   Users can update:

   - Profile Name

   - Profile Picture

   Stored in the platform's database.

## 🔧 Environment Variables
**📁 backend/.env**
```
NEXT_PUBLIC_POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
NEXT_PUBLIC_FLOW_TESTNET_RPC_URL=https://testnet.evm.nodes.onflow.org
NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org/
DEVELOPER_PRIVATE_KEY=(your private key)
```

**📁 .env.local**
```
NEXT_PUBLIC_POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
NEXT_PUBLIC_FLOW_TESTNET_RPC_URL=https://testnet.evm.nodes.onflow.org
NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org/
DEPLOYER_PRIVATE_KEY=(your private key)
PINATA_API_KEY=
PINATA_SECRET_KEY=
```

**Add your NFTs, registry, merkle-proof, subscription contract addresses by deploying them to hardhat.**

### ▶️ Backend Setup (Python)
 **Install Dependencies**
 ```
pip install -r backend/requirements.txt
```
### ▶️ Run the Microservice
```
python backend/main.py
```
### ▶️ Frontend Setup (Next.js)
```
npm install
npm run dev
```
  - Will run at - **http://localhost:3000**
## 🔨 Deploying Smart Contracts (Hardhat)
```
cd contracts
npx hardhat run scripts/<filename>.js --network <network-name>
```

- Example:
```
npx hardhat run scripts/deploy.js --network polygon_amoy
```
## 📝 License

Licensed under Apache 2.0.

## 🙌 Contributions

Pull Requests are welcome!
