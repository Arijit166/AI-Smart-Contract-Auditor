import { jsPDF } from 'jspdf';

export async function generateAuditPDF(auditData: any): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Smart Contract Audit Report', 20, 20);
  
  // Risk Score
  doc.setFontSize(12);
  doc.text(`Risk Score: ${auditData.riskScore || 0}/100`, 20, 40);
  
  // Vulnerabilities
  doc.setFontSize(14);
  doc.text('Vulnerabilities:', 20, 55);
  
  let y = 65;
  
  if (auditData.vulnerabilities && auditData.vulnerabilities.length > 0) {
    auditData.vulnerabilities.forEach((vuln: any, index: number) => {
      // Check if we need a new page
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(10);
      doc.text(`${index + 1}. [${vuln.severity?.toUpperCase() || 'UNKNOWN'}] ${vuln.title || 'Unknown vulnerability'}`, 20, y);
      y += 7;
      
      if (vuln.description) {
        doc.setFontSize(8);
        const descLines = doc.splitTextToSize(`   ${vuln.description}`, 170);
        doc.text(descLines, 20, y);
        y += descLines.length * 5;
      }
      y += 5;
    });
  } else {
    doc.setFontSize(10);
    doc.text('No vulnerabilities found.', 20, y);
    y += 10;
  }
  
  // Suggestions
  y += 10;
  
  // Check if we need a new page
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Improvement Suggestions:', 20, y);
  y += 10;
  
  if (auditData.suggestions && auditData.suggestions.length > 0) {
    auditData.suggestions.forEach((suggestion: string, index: number) => {
      // Check if we need a new page
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(10);
      const suggestionLines = doc.splitTextToSize(`${index + 1}. ${suggestion}`, 170);
      doc.text(suggestionLines, 20, y);
      y += suggestionLines.length * 7;
    });
  } else {
    doc.setFontSize(10);
    doc.text('No suggestions available.', 20, y);
  }
  
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}