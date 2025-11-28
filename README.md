# 🔐 Smart Contract Auditor

An end-to-end web platform that allows users to:

* **Sign in with MetaMask**
* **Interactive Dashboard** 
* **Upload or paste Solidity smart contract code**
* **Run vulnerability analysis using LLM + Slither**
* **Generate raw audit output, vulnerability reports, and auto-fixed Solidity code**
* **Deploy auto-fixed contracts** to:

  * Celo Sepolia
  * Flow Testnet (EVM)
  * Polygon Amoy
* **View full audit & deployment history**, including:

  * Audit PDF export (vulnerabilities + suggested fixes)
  * Deployment transaction hash
  * Contract address with direct block explorer link
* **Manage accounts** including profile name + profile photo
* **Backend Python microservice** for Slither + LLM processing

---

## 🚀 Features

### 1. **MetaMask Authentication**

Users authenticate using MetaMask to access the platform and track audit/deployment activity.

### 2. **Smart Contract Audit (LLM + Slither)**

Upload or paste Solidity code → backend runs:

* Static analysis with **Slither**
* LLM-based vulnerability explanation
* Auto-fixed Solidity code generation
* Raw outputs stored for history

### 3. **Smart Contract Deployment Module**

Give corrected Solidity code → deploy to:

* **Celo Sepolia**
* **Flow EVM Testnet**
* **Polygon Amoy**

Deployment results:

* Contract address
* Transaction hash
* Redirect links to relevant explorers

### 4. **Audit & Deployment History**

For each audit:

* View vulnerabilities
* View auto-fixed code
* Export PDF containing:

  * Vulnerabilities
  * Suggestions
  * Raw Slither output

For each deployment:

* View contract address
* View transaction hash
* One-click open explorer link

### 5. **Account Management Page**

User can update:

* Profile name
* Profile image
---
## 🔧 Environment Variables

### **Backend/.env**

```
NEXT_PUBLIC_POLYGON_AMOY_RPC=
NEXT_PUBLIC_FLOW_TESTNET_RPC=
NEXT_PUBLIC_CELO_SEPOLIA_RPC=
PRIVATE_KEY=
```

### **.env.local**

```
MONGODB_URI=
GROQ_API_KEY=
```

---

## ▶️ Backend Setup (Python)

### Install dependencies

```
pip install -r backend/requirements.txt
```

### Start microservice

```
python backend/main.py
```

---

## ▶️ Frontend Setup (Next.js)

### Install

```
npm install
```

### Run

```
npm run dev
```

---

## 📝 License 
This project is under the Apache 2.0 license

## 🙌 Contributions

PRs are welcome — feel free to improve audit accuracy, add new networks, or extend PDF generation.

