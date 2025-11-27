import { ethers } from 'ethers'

interface DeploymentResult {
  success: boolean
  contractAddress?: string
  transactionHash?: string
  gasUsed?: string
  blockNumber?: number
  error?: string
}

export async function deployContractWithUserWallet(
  network: string,
  bytecode: string,
  abi: any[],
): Promise<DeploymentResult> {
  try {
    console.log('🔵 [Frontend Deploy] Starting deployment on:', network)

    // Check if MetaMask or Web3 provider is available
    if (!window.ethereum) {
      return {
        success: false,
        error: 'MetaMask or Web3 provider not found. Please install MetaMask.',
      }
    }

    // Get the provider from MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum)
    console.log('✅ [Frontend Deploy] Provider connected')

    // Get the current network
    const currentNetwork = await provider.getNetwork()
    console.log('🔵 [Frontend Deploy] Current network chainId:', currentNetwork.chainId)

    // Map network string to chainId
    const networkChainIds: Record<string, number> = {
      'polygon-amoy': 80002,
      'ethereum-sepolia': 11155111,
      'arbitrum-sepolia': 421614,
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
        if (switchError.code === 4902) {
          return {
            success: false,
            error: `Please add ${network} to your wallet manually`,
          }
        }
        return {
          success: false,
          error: `Failed to switch network: ${switchError.message}`,
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

    // Create contract factory and deploy
    console.log('🟡 [Frontend Deploy] Creating contract factory...')
    console.log('📦 [Frontend Deploy] Bytecode length:', bytecode.length)
    console.log('📦 [Frontend Deploy] ABI items:', abi.length)
    
    const factory = new ethers.ContractFactory(abi, bytecode, signer)

    console.log('🟡 [Frontend Deploy] Deploying contract (this may take a moment)...')
    const contract = await factory.deploy()
    console.log('✅ [Frontend Deploy] Contract deployed, tx hash:', contract.deploymentTransaction()?.hash)

    console.log('🟡 [Frontend Deploy] Waiting for confirmation...')
    await contract.waitForDeployment()
    console.log('✅ [Frontend Deploy] Deployment confirmed')

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
    'ethereum-sepolia': {
      name: 'Ethereum Sepolia',
      chainId: 11155111,
      faucet: 'https://www.alchemy.com/faucets/ethereum-sepolia',
    },
    'arbitrum-sepolia': {
      name: 'Arbitrum Sepolia',
      chainId: 421614,
      faucet: 'https://faucet.arbitrum.io/',
    },
  }
  return networkInfo[network]
}