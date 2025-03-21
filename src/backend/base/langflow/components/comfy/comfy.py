import httpx
import aiohttp
from typing import Any, Dict
from langflow.custom import Component
from langflow.inputs import (
    StrInput,
    SecretStrInput,
    IntInput,
    DictInput
)

class Comfy(Component):
    display_name = "ComfyUI Workflow"
    description = "Executes workflows using ComfyDeploy API"
    icon = "ComfyUI"
    name = "ComfyWorkflow"

    inputs = [
        SecretStrInput(
            name="api_key",
            display_name="ComfyDeploy API Key", 
            info="The API key for ComfyDeploy service",
            required=True,
        ),
        StrInput(
            name="api_base",
            display_name="ComfyDeploy API Base URL",
            info="The base URL for the ComfyDeploy API",
            value="http://localhost:3000",
            required=True,
        ),
        StrInput(
            name="workflow_id", 
            display_name="Deployment ID",
            info="The deployment ID to execute",
            required=True,
        ),
        DictInput(
            name="workflow_inputs",
            display_name="Workflow Inputs",
            info="Additional inputs for the workflow",
            required=True,
            value={},
        ),
        IntInput(
            name="timeout",
            display_name="Timeout",
            info="Timeout in seconds for API requests",
            value=300,
            required=False,
        )
    ]
    
    def __init__(self, **data):
        super().__init__(**data)
        self.client = None
        
    async def initialize(self, **kwargs):
        print("Initializing ComfyDeploy Component")
        api_base = self.api_key.rstrip("/")
        if not api_base.startswith(("http://", "https://")):
            api_base = f"http://{api_base}"
        
        self.client = ComfyDeployClient(
            api_base=api_base,
            api_key=self.api_key,
            timeout=self.timeout or 300
        )
        return self

    async def __call__(self, *args, **kwargs) -> Dict[str, Any]:
        """This is the method that gets called when the component is executed"""
        if not self.client:
            await self.initialize()
            
        print("Executing ComfyDeploy API call")
        try:
            run_response = await self.client.create_run(
                deployment_id=self.workflow_id,
                inputs=self.workflow_inputs or {}
            )
            return {"result": run_response, "status": "success"}
        except Exception as e:
            print(f"Error executing ComfyDeploy workflow: {str(e)}")
            return {"error": str(e), "status": "error"}

    # Keep this for backward compatibility
    async def build_model(self) -> Any:
        return await self.initialize()

    # Keep this for backward compatibility
    async def execute(self, input_str: str) -> Dict[str, Any]:
        return await self.__call__()


class ComfyDeployClient:
    def __init__(self, api_base: str, api_key: str, timeout: int = 300):
        self.api_base = api_base.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout

    async def create_run(self, deployment_id: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        url = f"http://localhost:3000/api/run"
        # url = f"{self.api_base}/api/run"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "deployment_id": deployment_id,
            "inputs": inputs
        }
        
        print(f"Making API call to {url}")
        print(f"Payload: {payload}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url, 
                    json=payload,
                    headers=headers,
                    timeout=self.timeout
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        print(f"Error response from API: {error_text}")
                        raise RuntimeError(f"ComfyDeploy API error: {error_text}")
                    
                    result = await response.json()
                    print(f"Successful response: {result}")
                    return result
        except Exception as e:
            print(f"Exception during API call: {str(e)}")
            raise