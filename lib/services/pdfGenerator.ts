import { jsPDF } from 'jspdf';

export async function generateAuditPDF(auditData: any): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Smart Contract Audit Report', 20, 20);
  
  // Risk Score
  doc.setFontSize(12);
  doc.text(`Risk Score: ${auditData.riskScore}/100`, 20, 40);
  
  // Vulnerabilities
  doc.setFontSize(14);
  doc.text('Vulnerabilities:', 20, 55);
  
  let y = 65;
  auditData.vulnerabilities?.forEach((vuln: any, index: number) => {
    doc.setFontSize(10);
    doc.text(`${index + 1}. [${vuln.severity.toUpperCase()}] ${vuln.title}`, 20, y);
    y += 7;
    doc.setFontSize(8);
    doc.text(`   ${vuln.description}`, 20, y);
    y += 10;
  });
  
  // Suggestions
  doc.setFontSize(14);
  doc.text('Improvement Suggestions:', 20, y + 10);
  y += 20;
  
  auditData.suggestions?.forEach((suggestion: string, index: number) => {
    doc.setFontSize(10);
    doc.text(`${index + 1}. ${suggestion}`, 20, y);
    y += 7;
  });
  
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}