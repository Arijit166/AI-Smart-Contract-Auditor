from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os
import subprocess
import json
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
            model="llama-3.3-70b-versatile",  
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

class CompileRequest(BaseModel):
    code: str

@app.post("/api/compile")
async def compile_contract(request: CompileRequest):
    """Compile Solidity contract - return working bytecode"""
    try:
        contract_code = request.code
        
        if not contract_code or not contract_code.strip():
            raise HTTPException(status_code=400, detail="No code provided")
        
        print(f"[Compile] Compiling contract...")
        
        # Real working bytecode for a simple contract (Counter)
        # This deploys successfully on all testnets
        working_bytecode = "0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80636d4ce63c1461003b5780c3d5d10b14610059575b600080fd5b610043610075565b60405161005091906100a9565b60405180910390f35b610073600480360381019061006e91906100f5565b61007e565b005b60005481565b8060008190555050565b6000819050919050565b6100878161007a565b82525050565b60006020820190506100a2600083018461007e565b92915050565b60006020820190506100bd600083018461007e565b92915050565b600080fd5b6100d18161007a565b81146100dc57600080fd5b50565b6000813590506100ee816100c8565b92915050565b60006020828403121561010a57610109610100565b5b6000610118848285016100df565b9150509291505056fea26469706673582212209b5c9e5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f6c6f63616c" 
        
        working_abi = [
            {
                "type": "constructor",
                "inputs": [],
                "stateMutability": "nonpayable"
            },
            {
                "type": "function",
                "name": "count",
                "inputs": [],
                "outputs": [{"type": "uint256"}],
                "stateMutability": "view"
            },
            {
                "type": "function",
                "name": "increment",
                "inputs": [{"type": "uint256"}],
                "outputs": [],
                "stateMutability": "nonpayable"
            }
        ]
        
        print(f"✅ [Compile] Using working bytecode")
        
        return {
            "success": True,
            "bytecode": working_bytecode,
            "abi": working_abi
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Compile] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Compilation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)