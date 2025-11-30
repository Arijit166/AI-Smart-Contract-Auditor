import { ethers } from 'ethers'

interface DeploymentResult {
  success: boolean
  contractAddress?: string
  transactionHash?: string
  gasUsed?: string
  blockNumber?: number
  error?: string
}

async function ensurePolygonAmoyNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x13882',
        chainName: 'Polygon Amoy Testnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        },
        rpcUrls: ['https://rpc-amoy.polygon.technology/'],
        blockExplorerUrls: ['https://amoy.polygonscan.com/']
      }]
    })
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected network addition')
    }
  }
}

export async function deployContractWithUserWallet(
  network: string,
  bytecode: string,
  abi: any[],
): Promise<DeploymentResult> {
  try {
    console.log('🔵 [Frontend Deploy] Starting deployment on:', network)

    if (!window.ethereum) {
      return {
        success: false,
        error: 'MetaMask or Web3 provider not found. Please install MetaMask.',
      }
    }

    // Always use MetaMask's provider - it handles RPC automatically
    const provider = new ethers.BrowserProvider(window.ethereum)
    console.log('✅ [Frontend Deploy] Using MetaMask provider')

    // Verify we're using MetaMask's connection
    const connection = await provider._detectNetwork()
    console.log('🔵 [Frontend Deploy] Connected via MetaMask to chainId:', connection.chainId)

    // Get the current network
    const currentNetwork = await provider.getNetwork()
    console.log('🔵 [Frontend Deploy] Current network chainId:', currentNetwork.chainId)

    // Map network string to chainId
    const networkChainIds: Record<string, number> = {
    'polygon-amoy': 80002,
    'flow-testnet': 545,
    'celo-sepolia': 11142220
,
  }

    const expectedChainId = networkChainIds[network]
    if (!expectedChainId) {
      return {
        success: false,
        error: 'Invalid network',
      }
    }

    // Check if user is on the correct network
    if (Number(currentNetwork.chainId) !== expectedChainId) {
      console.log('🟡 [Frontend Deploy] Requesting network switch...')
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
        })
        console.log('✅ [Frontend Deploy] Network switched')
      } catch (switchError: any) {
        if (switchError.code === 4902 && network === 'polygon-amoy') {
          // Network not added, add it
          console.log('🟡 [Frontend Deploy] Adding Polygon Amoy network...')
          await ensurePolygonAmoyNetwork()
          console.log('✅ [Frontend Deploy] Network added, switching...')
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13882' }],
          })
        } else {
          return {
            success: false,
            error: `Failed to switch network: ${switchError.message}`,
          }
        }
      }
    }

    // Get signer from provider
    const signer = await provider.getSigner()
    const userAddress = await signer.getAddress()
    console.log('✅ [Frontend Deploy] Signer obtained:', userAddress)

    // Check user balance
    const balance = await provider.getBalance(userAddress)
    const balanceInEth = ethers.formatEther(balance)
    console.log('💰 [Frontend Deploy] Balance:', balanceInEth, 'ETH')

    if (balance === BigInt(0)) {
      return {
        success: false,
        error: 'Insufficient balance. Please get testnet tokens from the faucet.',
      }
    }
    
    const factory = new ethers.ContractFactory(abi, bytecode, signer)

    console.log('🟡 [Frontend Deploy] Deploying contract (this may take a moment)...')

    // Polygon Amoy needs explicit gas settings
    const deployOptions: any = {}

    if (network === 'polygon-amoy') {
      deployOptions.gasLimit = 800000
      deployOptions.maxFeePerGas = ethers.parseUnits('100', 'gwei')
      deployOptions.maxPriorityFeePerGas = ethers.parseUnits('30', 'gwei')
      console.log('⚙️ [Frontend Deploy] Using Polygon Amoy gas settings')
    }

    const contract = await factory.deploy(deployOptions)
    const deployTx = contract.deploymentTransaction()
    console.log('✅ [Frontend Deploy] Contract deployed, tx hash:', deployTx?.hash)

    console.log('🟡 [Frontend Deploy] Waiting for confirmation...')
    try {
      // Wait for deployment with timeout (60 seconds)
      await Promise.race([
        contract.waitForDeployment(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Deployment confirmation timeout')), 60000)
        )
      ])
      console.log('✅ [Frontend Deploy] Deployment confirmed')
    } catch (error: any) {
      if (error.message.includes('timeout')) {
        // If timeout but we have tx hash, try to get contract address from tx
        console.log('⚠️ [Frontend Deploy] Confirmation timeout, fetching from transaction...')
        if (deployTx?.hash) {
          const receipt = await provider.waitForTransaction(deployTx.hash, 1, 60000)
          if (receipt && receipt.contractAddress) {
            console.log('✅ [Frontend Deploy] Contract address retrieved from receipt')
            // Continue with receipt data
          } else {
            throw new Error('Could not confirm deployment. Please check the transaction hash on the explorer.')
          }
        } else {
          throw error
        }
      } else {
        throw error
      }
    }

    const contractAddress = await contract.getAddress()
    const txHash = contract.deploymentTransaction()?.hash
    let gasUsed = '0'
    let blockNumber = 0

    if (txHash) {
      try {
        const receipt = await provider.getTransactionReceipt(txHash)
        if (receipt) {
          gasUsed = receipt.gasUsed.toString()
          blockNumber = receipt.blockNumber
          console.log('⛽ [Frontend Deploy] Gas used:', gasUsed)
          console.log('📦 [Frontend Deploy] Block number:', blockNumber)
        }
      } catch (err: any) {
        console.warn('⚠️ [Frontend Deploy] Could not get receipt:', err.message)
      }
    }

    console.log('✅ [Frontend Deploy] Deployment successful!')
    return {
      success: true,
      contractAddress,
      transactionHash: txHash,
      gasUsed,
      blockNumber,
    }
  } catch (error: any) {
    console.error('❌ [Frontend Deploy] Error:', error.message)
    return {
      success: false,
      error: error.message || 'Deployment failed',
    }
  }
}

export function getNetworkInfo(network: string) {
  const networkInfo: Record<string, { name: string; chainId: number; faucet: string }> = {
    'polygon-amoy': {
      name: 'Polygon Amoy',
      chainId: 80002,
      faucet: 'https://faucet.polygon.technology/',
    },
    'flow-testnet': {
      name: 'Flow Testnet',
      chainId: 545,
      faucet: 'https://testnet-faucet.onflow.org/',
    },
    'celo-sepolia': {
      name: 'Celo sepolia',
      chainId: 11142220
,
      faucet: 'https://forno.celo-sepolia.celo-testnet.org',
    },
  }
  return networkInfo[network]
}