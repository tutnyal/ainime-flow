import aiohttp
import httpx  # Add this import
from typing import Any, Dict
from langflow.custom import Component
from langflow.field_typing import LanguageModel
from langflow.inputs import (
    StrInput,
    SecretStrInput,
    IntInput,
    DictInput
)
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yam1VRFI4c3ZwbUU0UkRCMDRLT2ZwbTVUWTMiLCJpYXQiOjE3Mzk2NDQ5MDl9.z9DjHwt4TkUasX3DQldO_CA-HyuTu0Bxh6u41n0Fz-M"
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yam1VRFI4c3ZwbUU0UkRCMDRLT2ZwbTVUWTMiLCJpYXQiOjE3Mzk2NDE2Mzh9.lIua1YjWR8C5orYIq1zLs8xo--uVm5N3EU-D-i6e1Do"

class Comfy(Component):
    display_name = "ComfyUI Workflow"
    description = "Executes workflows using ComfyUI API"
    icon = "ComfyUI"
    name = "ComfyWorkflow"

    inputs = [
        SecretStrInput(
            name="api_key",
            display_name="ComfyUI API Key", 
            info="The API key for ComfyUI service",
            required=True,
        ),
        StrInput(
            name="api_base",
            display_name="ComfyUI API Base URL",
            info="The base URL for the ComfyUI API",
            value="http://localhost:3000",  # Use value instead of default
            required=True,
        ),
        StrInput(
            name="workflow_id", 
            display_name="Workflow ID",
            info="The ID of the workflow to execute",
            required=True,
        ),
        DictInput(
            name="workflow_inputs",
            display_name="Workflow Inputs",
            info="Additional inputs for the workflow",
            required=False,
        ),
        IntInput(
            name="timeout",
            display_name="Timeout",
            info="Timeout in seconds for API requests",
            value=300,  # Use value instead of default
            required=False,
        )
    ]
        
    async def build_model(self) -> Any:  # Changed from LanguageModel
        """Initialize the ComfyUI client"""
        self.log("Building ComfyUI Component")  # Add logging
        api_base = self.api_base.rstrip("/")
        if not api_base.startswith(("http://", "https://")):
            api_base = f"http://{api_base}"
        
        self.log(f"Initializing client with base URL: {api_base}")
        
        self.client = ComfyUIClient(
            api_base=api_base,
            api_key=self.api_key,
            timeout=self.timeout or 300
        )
        return self

    async def execute(self, input_str: str) -> Dict[str, Any]:
        self.log("Starting execute() method")  # Add logging
        try:
            self.log("Starting ComfyUI component execution") # Add this line
            self.log(f"API Base: {self.api_base}")
            self.log(f"Workflow ID: {self.workflow_id}")
            self.log(f"Creating run for workflow {self.workflow_id}")
            self.log(f"Using API base: {self.api_base}")
            # Create run
            run_response = await self.client.create_run(
                workflow_id=self.workflow_id,
                inputs=self.workflow_inputs or {}
            )
            
            self.log(f"Run response: {run_response}")
            
            if not run_response or "run_id" not in run_response:
                raise ValueError("Invalid response from ComfyUI API")
            
            run_id = run_response["run_id"]
            
            # Get results
            run_result = await self.client.get_run(run_id)
            return {"result": run_result}
            
        except Exception as e:
            self.log(f"ComfyUI API Error: {str(e)}")
            raise RuntimeError(f"ComfyUI workflow execution failed: {str(e)}")

class ComfyUIClient:
    def __init__(self, api_base: str, api_key: str, timeout: int = 300):
        self.api_base = api_base.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout

    async def create_run(self, workflow_id: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.api_base}/api/run/deployment/queue"
        payload = {
            "deployment_id": workflow_id,
            "inputs": inputs
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()

    async def get_run(self, run_id: str) -> Dict[str, Any]:
        url = f"{self.api_base}/api/run/status"
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        params = {"run_id": run_id}
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            return response.json()