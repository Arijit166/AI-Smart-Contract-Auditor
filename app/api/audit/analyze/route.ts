import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code?.trim()) {
      return NextResponse.json(
        { error: 'No code provided' },
        { status: 400 }
      )
    }

    const prompt = `You are an expert smart contract security auditor. Analyze this Solidity contract and provide a comprehensive security audit.

Contract Code:
\`\`\`solidity
${code}
\`\`\`

Provide your response ONLY as valid JSON in this exact format (no markdown, no extra text):
{
  "riskScore": 0-100,
  "vulnerabilities": [
    {
      "id": 1,
      "severity": "critical|high|medium|low",
      "title": "vulnerability name",
      "line": line_number,
      "description": "detailed explanation",
      "impact": "potential impact",
      "recommendation": "how to fix"
    }
  ],
  "suggestions": [
    "improvement suggestion 1",
    "improvement suggestion 2"
  ],
  "fixedCode": "complete fixed version of the contract"
}

Consider:
1. Reentrancy vulnerabilities
2. Integer overflow/underflow
3. Access control issues
4. Unchecked external calls
5. Gas optimization
6. Best practices compliance

Return ONLY the JSON object, nothing else.`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a smart contract security expert. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 8000,
    })

    let responseText = completion.choices[0].message.content || ''
    
    // Extract JSON from response
    responseText = responseText.trim()
    if (responseText.startsWith("```json")) {
      responseText = responseText.slice(7)
    }
    if (responseText.startsWith("```")) {
      responseText = responseText.slice(3)
    }
    if (responseText.endsWith("```")) {
      responseText = responseText.slice(0, -3)
    }
    
    responseText = responseText.trim()
    const startIdx = responseText.indexOf('{')
    const endIdx = responseText.lastIndexOf('}') + 1
    
    let auditResults
    if (startIdx !== -1 && endIdx > startIdx) {
      const jsonStr = responseText.slice(startIdx, endIdx)
      auditResults = JSON.parse(jsonStr)
    } else {
      auditResults = JSON.parse(responseText)
    }

    return NextResponse.json({
      success: true,
      audit: auditResults
    })

  } catch (error: any) {
    console.error('Groq analysis error:', error)
    return NextResponse.json(
      { error: `Analysis failed: ${error.message}` },
      { status: 500 }
    )
  }
}