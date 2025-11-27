from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os
import tempfile
import subprocess
import json
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
try:
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
except TypeError:
    # Fallback for older groq versions
    import httpx
    client = Groq(
        api_key=os.getenv("GROQ_API_KEY"),
        http_client=httpx.Client()
    )

class AuditRequest(BaseModel):
    code: str

def run_slither_analysis(contract_code: str):
    """Run Slither static analysis on contract code"""
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.sol', delete=False) as f:
            f.write(contract_code)
            temp_path = f.name
        
        result = subprocess.run(
            ['slither', temp_path, '--json', '-'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        os.unlink(temp_path)
        
        if result.stdout:
            return json.loads(result.stdout)
        return {"success": {"detectors": []}}
    
    except subprocess.TimeoutExpired:
        return {"error": "Analysis timeout"}
    except Exception as e:
        return {"error": str(e)}

def analyze_with_llama(contract_code: str, slither_results: dict):
    """Use Groq + Llama to analyze contract and generate detailed report"""
    
    prompt = f"""You are an expert smart contract security auditor. Analyze this Solidity contract and provide a comprehensive security audit.

Contract Code:
```solidity
{contract_code}
```

Slither Analysis Results:
{json.dumps(slither_results, indent=2)}

Provide your response ONLY as valid JSON in this exact format (no markdown, no extra text):
{{
  "riskScore": 0-100,
  "vulnerabilities": [
    {{
      "id": 1,
      "severity": "critical|high|medium|low",
      "title": "vulnerability name",
      "line": line_number,
      "description": "detailed explanation",
      "impact": "potential impact",
      "recommendation": "how to fix"
    }}
  ],
  "suggestions": [
    "improvement suggestion 1",
    "improvement suggestion 2"
  ],
  "fixedCode": "complete fixed version of the contract"
}}

Consider:
1. Reentrancy vulnerabilities
2. Integer overflow/underflow
3. Access control issues
4. Unchecked external calls
5. Gas optimization
6. Best practices compliance

Return ONLY the JSON object, nothing else."""

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a smart contract security expert. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",  # Free tier model
            temperature=0.3,
            max_tokens=8000,
        )
        
        response_text = chat_completion.choices[0].message.content
        
        # Extract JSON from response
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        response_text = response_text.strip()
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            return json.loads(json_str)
        else:
            return json.loads(response_text)
    
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Llama analysis failed: {str(e)}")

@app.post("/api/audit")
async def audit_contract(request: AuditRequest):
    """Main audit endpoint"""
    
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="No code provided")
    
    # Step 1: Run Slither analysis
    slither_results = run_slither_analysis(request.code)
    
    # Step 2: Analyze with Llama via Groq
    llama_analysis = analyze_with_llama(request.code, slither_results)
    
    # Step 3: Combine and return results
    return {
        "success": True,
        "audit": llama_analysis,
        "slitherRaw": slither_results
    }

@app.post("/api/audit/file")
async def audit_file(file: UploadFile = File(...)):
    """Audit endpoint for file upload"""
    
    if not file.filename.endswith('.sol'):
        raise HTTPException(status_code=400, detail="Only .sol files are allowed")
    
    content = await file.read()
    code = content.decode('utf-8')
    
    return await audit_contract(AuditRequest(code=code))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "slither_available": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)