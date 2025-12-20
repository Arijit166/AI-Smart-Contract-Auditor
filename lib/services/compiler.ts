import { ethers } from 'ethers'

interface NetworkConfig {
  rpc: string
  name: string
  chainId: number
}

const networks: Record<string, NetworkConfig> = {
  'polygon-amoy': {
    rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || '',
    name: 'Polygon Amoy',
    chainId: 80002,
  },
  'flow-testnet': {
    rpc: process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC_URL || 'https://testnet.evm.nodes.onflow.org',
    name: 'Flow Testnet',
    chainId: 545,
  },
  'celo-sepolia': {
    rpc: process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org',
    name: 'Celo Sepolia',
    chainId: 11142220,
  },
}

interface CompilationPayload {
  contractCode: string
  network: string
}

interface CompilationResponse {
  success: boolean
  bytecode?: string
  abi?: any[]
  error?: string
}

export async function compileContract(payload: CompilationPayload): Promise<CompilationResponse> {
  try {
    console.log('🔵 [Compile] Sending to Next.js API...')
    
    // Call Next.js API route instead of Python backend
    const response = await fetch('/api/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: payload.contractCode,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      console.error('❌ [Compile] API error:', data.error)
      return {
        success: false,
        error: data.error || 'Compilation failed',
      }
    }

    // Ensure bytecode has 0x prefix
    let bytecode = data.bytecode || ''
    if (bytecode && !bytecode.startsWith('0x')) {
      bytecode = '0x' + bytecode
    }

    // Ensure ABI is valid array
    const abi = Array.isArray(data.abi) ? data.abi : []

    if (!bytecode || bytecode === '0x') {
      return {
        success: false,
        error: 'No bytecode returned from compilation',
      }
    }

    if (abi.length === 0) {
      console.warn('⚠️ [Compile] Warning: ABI is empty')
    }

    console.log('✅ [Compile] Success - bytecode length:', bytecode.length, 'ABI items:', abi.length)
    
    return {
      success: true,
      bytecode,
      abi,
    }
  } catch (error: any) {
    console.error('❌ [Compile] Error:', error.message)
    return {
      success: false,
      error: error.message || 'Compilation failed',
    }
  }
}

export function getNetworkConfig(network: string): NetworkConfig | null {
  return networks[network] || null
}

export function isValidNetwork(network: string): boolean {
  return network in networks
}