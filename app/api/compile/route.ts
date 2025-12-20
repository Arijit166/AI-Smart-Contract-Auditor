import { NextRequest, NextResponse } from 'next/server'
import * as solc from 'solc'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code?.trim()) {
      return NextResponse.json(
        { success: false, error: 'No code provided' },
        { status: 400 }
      )
    }

    console.log('🔵 [Compile] Compiling Solidity contract...')

    const contractNameMatch = code.match(/contract\s+(\w+)/)
    const contractName = contractNameMatch ? contractNameMatch[1] : 'Contract'

    const input = {
      language: 'Solidity',
      sources: {
        [`${contractName}.sol`]: {
          content: code
        }
      },
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        }
      }
    }

    // Use the built-in compiler (no remote loading)
    const output = JSON.parse(solc.compile(JSON.stringify(input)))

    if (output.errors) {
      const errors = output.errors.filter((error: any) => error.severity === 'error')
      if (errors.length > 0) {
        console.error('❌ [Compile] Compilation errors:', errors)
        return NextResponse.json(
          { 
            success: false, 
            error: `Compilation failed: ${errors[0].formattedMessage || errors[0].message}` 
          },
          { status: 400 }
        )
      }
    }

    const contract = output.contracts?.[`${contractName}.sol`]?.[contractName]
    
    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract compilation failed - no output' },
        { status: 500 }
      )
    }

    const bytecode = contract.evm?.bytecode?.object
    const abi = contract.abi

    if (!bytecode) {
      return NextResponse.json(
        { success: false, error: 'No bytecode generated' },
        { status: 500 }
      )
    }

    const formattedBytecode = bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`

    console.log('✅ [Compile] Success')

    return NextResponse.json({
      success: true,
      bytecode: formattedBytecode,
      abi: abi || []
    })

  } catch (error: any) {
    console.error('❌ [Compile] Error:', error.message)
    return NextResponse.json(
      { success: false, error: `Compilation failed: ${error.message}` },
      { status: 500 }
    )
  }
}