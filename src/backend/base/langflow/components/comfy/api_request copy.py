# import asyncio
# import json
# import tempfile
# from datetime import datetime, timezone
# from pathlib import Path
# from typing import Any
# import io
# import os
# import base64
# from langflow.base.comfy.base_comfy_file import BaseComfyFileComponent

# import aiofiles
# import aiofiles.os as aiofiles_os
# import httpx
# from langflow.inputs import (
#     StrInput,
#     SecretStrInput,
#     IntInput, MessageTextInput,
#     DictInput, MultilineInput
# )

# from langflow.base.curl.parse import parse_context
# from langflow.custom import Component
# from langflow.io import (
#     MessageTextInput,
#     Output, FileInput
# )
# from langflow.schema import Data
# from PIL import Image
# from PIL.PngImagePlugin import PngInfo
# # from apps.langflow.src.backend.base.langflow.inputs.inputs import ComfyFileInput

# # try:
# #     import folder_paths
# # except ImportError:
# #     folder_paths = None  # Fallback for non-ComfyUI environments
# # import numpy as np
# # import torch

# class APIRequestComponent(Component):
#     display_name = "Comfy - API Request"
#     description = "Make HTTP requests to the specified API endpoint with text and image inputs."
#     icon = "Globe"
#     name = "APIRequest"

#     inputs = [
#         # MessageTextInput(
#         #     name="input_text",
#         #     display_name="Text Input",
#         #     info="Enter the text to process",
#         #     advanced=False,
#         # ),
#         MultilineInput(
#             name="input_text",
#             display_name="Text",
#             info="Text to be passed as input.",
#         ),
#         *BaseComfyFileComponent._base_inputs,
#         StrInput(
#             name="input_image",
#             display_name="Image URL",
#             info="URL of the image to process (optional)",
#             advanced=False,
#         ),
#     ]
#     outputs = [
#         Output(display_name="Data", name="data", method="make_requests"),
#         # Output(display_name="Image", name="image", method="display_image"),
#     ]

#     # Hardcoded curl command configurations
#     INITIAL_REQUEST_CONFIG = {
#         "url": "http://127.0.0.1:3000/api/run",
#         "method": "POST",
#         "headers": {
#             "Content-Type": "application/json",
#             "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yam1VRFI4c3ZwbUU0UkRCMDRLT2ZwbTVUWTMiLCJpYXQiOjE3NDAwNzExMTF9.-HYVZJSekJQXQ3o6XPUL9dJIfK87IoTWNFm-ZmPe3zE"
#         },
#         "deployment_id": "a702ea91-9b42-4b2d-ac32-969d654c39af"
#     }

#     # IMAGE_REQUEST_CONFIG = {
#     #     "base_url": "http://localhost:3000/api/run/api/run",
#     #     "method": "GET",
#     #     "headers": {
#     #         "Content-Type": "application/json"
#     #     }
#     # }

#     def __init__(self, **data):
#         super().__init__(**data)
#         self.generated_image = None  # Store the generated image

#     async def _save_response_to_file(self, response: httpx.Response, is_binary: bool = True) -> Path:
#         """Save the response content to a file and return the file path."""
#         # Create a temporary directory for this component
#         component_temp_dir = Path(tempfile.gettempdir()) / self.__class__.__name__
#         await aiofiles_os.makedirs(component_temp_dir, exist_ok=True)

#         # Generate a unique filename with timestamp
#         timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
#         extension = ".bin" if is_binary else ".json"
#         filename = f"response_{timestamp}{extension}"
#         file_path = component_temp_dir / filename

#         # Save the content
#         mode = "wb" if is_binary else "w"
#         encoding = None if is_binary else response.encoding
        
#         if is_binary:
#             async with aiofiles.open(file_path, "wb") as f:
#                 await f.write(response.content)
#             # Convert to image and save in ComfyUI output format
#             await self._save_as_comfyui_image(response.content, filename)
#         else:
#             async with aiofiles.open(file_path, "w", encoding=encoding) as f:
#                 await f.write(response.text)

#         return file_path

#     async def _save_as_comfyui_image(self, image_data: bytes, filename_prefix: str) -> dict:
#         # Save image to Digital Ocean Spaces
#         spaces_bucket_url = "https://your-bucket-name.nyc3.digitaloceanspaces.com"
#         timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
#         filename = f"{filename_prefix}_{timestamp}.png"
#         file_path = f"outputs/runs/{filename}"

#         # Upload image to Digital Ocean Spaces
#         await self._upload_to_spaces(file_path, image_data)

#         return {
#             "filename": filename,
#             "subfolder": "",
#             "type": "output",
#             "output_id": "api_request_image",
#             "url": f"{spaces_bucket_url}/{file_path}"
#         }

#     async def _upload_to_spaces(self, file_path: str, file_data: bytes):
#         # Implement your Digital Ocean Spaces upload logic here
#         # You'll need to use the boto3 library or similar
#         pass

#     async def _fetch_generated_image(self, client: httpx.AsyncClient, run_id: str) -> tuple[Path | None, str | None]:
#         try:
#             # Get the Digital Ocean Spaces URL for the image
#             image_url = await get_file_download_url(f"outputs/runs/{run_id}/image.png")
            
#             # Fetch the image from Digital Ocean Spaces
#             response = await client.get(image_url, timeout=30)
            
#             if response.status_code == 200:
#                 # Save the image and store it in the component
#                 file_path = await self._save_response_to_file(response, is_binary=True)
#                 self.generated_image = Image.open(io.BytesIO(response.content))  # Store PIL Image
#                 return file_path, None
#             else:
#                 error_msg = f"Failed to fetch image. Status code: {response.status_code}"
#                 self.log(error_msg)
#                 return None, error_msg

#         except Exception as exc:
#             error_msg = f"Error fetching generated image: {str(exc)}"
#             self.log(error_msg)
#             return None, error_msg

#     async def display_image(self) -> Data:
#         """Display the generated image in the node"""
#         if self.generated_image is None:
#             return Data(data={"error": "No image generated"})
        
#         # Convert image to base64 for display
#         buffered = io.BytesIO()
#         self.generated_image.save(buffered, format="PNG")
#         img_str = base64.b64encode(buffered.getvalue()).decode()
        
#         return Data(data={
#             "image": f"data:image/png;base64,{img_str}",
#             "status": "success"
#         })

#     async def make_request(
#         self,
#         client: httpx.AsyncClient,
#         input_text: str,
#         input_image: str,  # Now accepts URL string
#     ) -> Data:
#         """Make the initial request and fetch the generated image if available."""
#         try:
#             # Handle image input from URL
#             # image_data = None
#             # if input_image:
#             #     # Fetch image from URL
#             #     try:
#             #         response = await client.get(input_image, timeout=30)
#             #         if response.status_code == 200:
#             #             image_data = base64.b64encode(response.content).decode('utf-8')
#             #             if not image_data.startswith('data:image/'):
#             #                 image_data = f"data:image/png;base64,{image_data}"
#             #         else:
#             #             self.log(f"Failed to fetch image from URL: {input_image}")
#             #     except Exception as e:
#             #         self.log(f"Error fetching image from URL: {str(e)}")

#             # Prepare the initial request body
#             body = {
#                 "deployment_id": self.INITIAL_REQUEST_CONFIG["deployment_id"],
#                 "inputs": {
#                     "input_text": "",
#                     "input_image": ""  # Use the processed image data
#                     # "input_text": input_text,
#                     # "input_image": image_data  # Use the processed image data
#                 }
#             }

#             # Add logging
#             self.log(f"Sending request to {self.INITIAL_REQUEST_CONFIG['url']}")
#             self.log(f"Request body: {json.dumps(body, indent=2)}")
            
#             initial_response = await client.request(
#                 self.INITIAL_REQUEST_CONFIG["method"],
#                 self.INITIAL_REQUEST_CONFIG["url"],
#                 headers=self.INITIAL_REQUEST_CONFIG["headers"],
#                 json=body,
#                 timeout=30,
#                 follow_redirects=True,
#             )

#             try:
#                 initial_result = initial_response.json()
#                 # Save the initial response
#                 initial_file_path = await self._save_response_to_file(initial_response, is_binary=False)
                
#                 # Check for run_id in the response
#                 run_id = initial_result.get('run_id')
                
#                 if run_id:
#                     # Fetch and save the generated image
#                     image_file_path, error = await self._fetch_generated_image(client, run_id)
                    
#                     return Data(data={
#                         "source": self.INITIAL_REQUEST_CONFIG["url"],
#                         "initial_response": initial_result,
#                         "initial_response_file": str(initial_file_path),
#                         "status_code": initial_response.status_code,
#                         "run_id": run_id,
#                         "image_file": str(image_file_path) if image_file_path else None,
#                         "image_error": error
#                     })
#                 else:
#                     return Data(data={
#                         "source": self.INITIAL_REQUEST_CONFIG["url"],
#                         "initial_response": initial_result,
#                         "initial_response_file": str(initial_file_path),
#                         "status_code": initial_response.status_code,
#                         "error": "No run_id found in response"
#                     })

#             except json.JSONDecodeError:
#                 self.log("Failed to decode JSON response")
#                 return Data(data={
#                     "source": self.INITIAL_REQUEST_CONFIG["url"],
#                     "error": "Invalid JSON response",
#                     "status_code": initial_response.status_code
#                 })

#             if initial_response.status_code == 400:
#                 error_detail = await initial_response.text()
#                 self.log(f"400 Error Details: {error_detail}")
#                 return Data(data={
#                     "error": f"Bad Request: {error_detail}",
#                     "status_code": 400
#                 })

#         except httpx.TimeoutException:
#             return Data(
#                 data={
#                     "source": self.INITIAL_REQUEST_CONFIG["url"],
#                     "status_code": 408,
#                     "error": "Request timed out",
#                 },
#             )
#         except Exception as exc:
#             self.log(f"Error making request: {exc}")
#             return Data(
#                 data={
#                     "source": self.INITIAL_REQUEST_CONFIG["url"],
#                     "status_code": 500,
#                     "error": str(exc),
#                 },
#             )

#     async def make_requests(self) -> list[Data]:
#         """Process inputs and make the API requests."""
#         input_text = self.input_text or ""
#         input_image = self.input_image or ""

#         async with httpx.AsyncClient() as client:
#             result = await self.make_request(client, input_text, input_image)
            
#         self.status = [result]
#         return [result]

# async def get_file_download_url(file_path: str) -> str:
#     # Replace with your Digital Ocean Spaces bucket URL
#     spaces_bucket_url = "https://your-bucket-name.nyc3.digitaloceanspaces.com"
#     return f"{spaces_bucket_url}/{file_path}"