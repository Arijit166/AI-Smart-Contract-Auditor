interface IPFSUploadResult {
  success: boolean;
  cid?: string;
  error?: string;
}

interface AuditMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    originalCodeHash: string;
    fixedCodeHash: string;
    riskScore: number;
    timestamp: string;
    auditor: string;
    vulnerabilities: number;
  };
  audit_details: {
    original_code_ipfs: string;
    fixed_code_ipfs: string;
    pdf_report_ipfs: string;
  };
}

export class IPFSService {
  private pinataApiKey: string;
  private pinataSecretKey: string;

  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY || '';
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY || '';
  }

  /**
   * Upload text content to IPFS via Pinata
   */
  async uploadText(content: string, filename: string): Promise<IPFSUploadResult> {
    try {
      const formData = new FormData();
      const blob = new Blob([content], { type: 'text/plain' });
      formData.append('file', blob, filename);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Pinata upload failed: ${error}` };
      }

      const data = await response.json();
      return { success: true, cid: data.IpfsHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJSON(json: any, filename: string): Promise<IPFSUploadResult> {
    const jsonString = JSON.stringify(json, null, 2);
    return this.uploadText(jsonString, filename);
  }

  /**
   * Upload PDF buffer to IPFS
   */
  async uploadPDF(pdfBuffer: Buffer, filename: string): Promise<IPFSUploadResult> {
    try {
      const formData = new FormData();
      const uint8Array = new Uint8Array(pdfBuffer);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      formData.append('file', blob, filename);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Pinata upload failed: ${error}` };
      }

      const data = await response.json();
      return { success: true, cid: data.IpfsHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create and upload complete audit metadata package
   */
  async uploadAuditPackage(
    originalCode: string,
    fixedCode: string,
    pdfBuffer: Buffer,
    auditData: {
      originalCodeHash: string;
      fixedCodeHash: string;
      riskScore: number;
      auditor: string;
      vulnerabilities: number;
    }
  ): Promise<{
    success: boolean;
    originalCodeCID?: string;
    fixedCodeCID?: string;
    pdfCID?: string;
    metadataCID?: string;
    error?: string;
  }> {
    try {
      // Upload original code
      const originalResult = await this.uploadText(originalCode, 'original.sol');
      if (!originalResult.success) {
        return { success: false, error: `Failed to upload original code: ${originalResult.error}` };
      }

      // Upload fixed code
      const fixedResult = await this.uploadText(fixedCode, 'fixed.sol');
      if (!fixedResult.success) {
        return { success: false, error: `Failed to upload fixed code: ${fixedResult.error}` };
      }

      // Upload PDF
      const pdfResult = await this.uploadPDF(pdfBuffer, 'audit-report.pdf');
      if (!pdfResult.success) {
        return { success: false, error: `Failed to upload PDF: ${pdfResult.error}` };
      }

      // Create metadata JSON
      const metadata: AuditMetadata = {
        name: `Smart Contract Audit Certificate`,
        description: `Official audit certificate for smart contract with risk score: ${auditData.riskScore}/100`,
        image: `ipfs://QmYourDefaultAuditBadgeImageCID`, // Replace with actual badge image CID
        attributes: {
          originalCodeHash: auditData.originalCodeHash,
          fixedCodeHash: auditData.fixedCodeHash,
          riskScore: auditData.riskScore,
          timestamp: new Date().toISOString(),
          auditor: auditData.auditor,
          vulnerabilities: auditData.vulnerabilities,
        },
        audit_details: {
          original_code_ipfs: `ipfs://${originalResult.cid}`,
          fixed_code_ipfs: `ipfs://${fixedResult.cid}`,
          pdf_report_ipfs: `ipfs://${pdfResult.cid}`,
        },
      };

      // Upload metadata
      const metadataResult = await this.uploadJSON(metadata, 'metadata.json');
      if (!metadataResult.success) {
        return { success: false, error: `Failed to upload metadata: ${metadataResult.error}` };
      }

      return {
        success: true,
        originalCodeCID: originalResult.cid,
        fixedCodeCID: fixedResult.cid,
        pdfCID: pdfResult.cid,
        metadataCID: metadataResult.cid,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get IPFS gateway URL
   */
  getGatewayURL(cid: string): string {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
}

export const ipfsService = new IPFSService();