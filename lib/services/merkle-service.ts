import { ethers } from 'ethers'

export interface MerkleLeaf {
  type: 'vulnerability' | 'fix' | 'llm_output' | 'pdf_report'
  data: string
  hash: string
}

export interface MerkleTreeData {
  leaves: MerkleLeaf[]
  root: string
  proofs: { [hash: string]: string[] }
}

export class MerkleTreeBuilder {
  private leaves: string[] = []
  private tree: string[][] = []

  addLeaf(data: string): string {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(data))
    this.leaves.push(hash)
    return hash
  }

  private pairwiseHash(left: string, right: string): string {
    const sorted = [left, right].sort()
    return ethers.keccak256(ethers.concat([sorted[0], sorted[1]]))
  }

  buildTree(): string {
    if (this.leaves.length === 0) {
      throw new Error('No leaves to build tree')
    }

    this.tree = [this.leaves]
    let currentLevel = this.leaves

    while (currentLevel.length > 1) {
      const nextLevel: string[] = []
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          nextLevel.push(this.pairwiseHash(currentLevel[i], currentLevel[i + 1]))
        } else {
          nextLevel.push(currentLevel[i])
        }
      }
      
      this.tree.push(nextLevel)
      currentLevel = nextLevel
    }

    return currentLevel[0]
  }

  getProof(leafHash: string): string[] {
    let index = this.tree[0].indexOf(leafHash)
    if (index === -1) {
      throw new Error('Leaf not found in tree')
    }

    const proof: string[] = []

    for (let level = 0; level < this.tree.length - 1; level++) {
      const isRightNode = index % 2 === 1
      const siblingIndex = isRightNode ? index - 1 : index + 1

      if (siblingIndex < this.tree[level].length) {
        proof.push(this.tree[level][siblingIndex])
      }

      index = Math.floor(index / 2)
    }

    return proof
  }

  getRoot(): string {
    if (this.tree.length === 0) {
      throw new Error('Tree not built yet')
    }
    return this.tree[this.tree.length - 1][0]
  }
}

export function buildAuditMerkleTree(auditData: {
  vulnerabilities: any[]
  fixes: any[]
  llmOutput: string
  pdfReportCID: string
}): MerkleTreeData {
  const builder = new MerkleTreeBuilder()
  const leaves: MerkleLeaf[] = []

  // Add vulnerability leaves
  auditData.vulnerabilities.forEach((vuln) => {
    const data = JSON.stringify(vuln)
    const hash = builder.addLeaf(data)
    leaves.push({ type: 'vulnerability', data, hash })
  })

  // Add fix leaves
  auditData.fixes.forEach((fix) => {
    const data = JSON.stringify(fix)
    const hash = builder.addLeaf(data)
    leaves.push({ type: 'fix', data, hash })
  })

  // Add LLM output leaf
  const llmHash = builder.addLeaf(auditData.llmOutput)
  leaves.push({ type: 'llm_output', data: auditData.llmOutput, hash: llmHash })

  // Add PDF report leaf
  const pdfHash = builder.addLeaf(auditData.pdfReportCID)
  leaves.push({ type: 'pdf_report', data: auditData.pdfReportCID, hash: pdfHash })

  const root = builder.buildTree()

  const proofs: { [hash: string]: string[] } = {}
  leaves.forEach((leaf) => {
    proofs[leaf.hash] = builder.getProof(leaf.hash)
  })

  return { leaves, root, proofs }
}