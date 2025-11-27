import { ethers } from 'ethers'

interface NetworkConfig {
  rpc: string
  name: string
  chainId: number
}

const networks: Record<string, NetworkConfig> = {
  'polygon-amoy': {
    rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || '',
    name: 'Polygon Amoy',
    chainId: 80002,
  },
  'ethereum-sepolia': {
    rpc: process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC || '',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
  },
  'arbitrum-sepolia': {
    rpc: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || '',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
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
    console.log('🔵 [Compile] Sending to Python backend...')
    
    const response = await fetch('http://localhost:8000/api/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: payload.contractCode,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ [Compile] Backend error:', data.error)
      return {
        success: false,
        error: data.error || 'Compilation failed',
      }
    }

    console.log('✅ [Compile] Success')
    return {
      success: true,
      bytecode: data.bytecode,
      abi: data.abi,
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