import { ethers } from 'ethers'

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