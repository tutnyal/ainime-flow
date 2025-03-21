// Remove these lines completely:
// "use server"
// import { headers } from "next/headers";

import axios from "axios"

let apiToken = "";
let apiBase = "";
let deployment_id = "";
const environment = "local";

if (environment === "local") {
    apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yam1VRFI4c3ZwbUU0UkRCMDRLT2ZwbTVUWTMiLCJpYXQiOjE3NDA4Njk4MDF9.hHDkE41WWLZdNhl7NXGFGHvKBy8KacV9dUkiSVxTYaE";
    apiBase = "https://comfydeploy-osv.vercel.app";
    deployment_id = "55f7e9ab-41be-4406-895e-d623fb1b2d54";
}


// Custom client implementation using axios
class ComfyDeployClient {
  apiBase: string;
  apiToken: string;
  _client: any;
  timeout: number;

  constructor(config: {apiBase: string; apiToken: string; _client?: any; timeout?: number}) {
    this.apiBase = config.apiBase;
    this.apiToken = config.apiToken;
    this._client = config._client || axios.create();
    this.timeout = config.timeout || 30000;
  }

  async run(params: {deployment_id: string; inputs: any; webhook?: string}) {
    const response = await this._client.post(`${this.apiBase}/api/run`, {
      deployment_id: params.deployment_id,
      inputs: params.inputs,
      webhook: params.webhook
    });
    return response.data;
  }

  async getUploadUrl(fileType: string, fileSize: number): Promise<UploadUrlResponse> {
    // Generate a unique filename
    const extension = fileType.split('/')[1];
    const fileName = `upload_${Date.now()}.${extension}`;

    const response = await this._client.post(`${this.apiBase}/api/file-upload`, {
      type: fileType,
      fileSize: fileSize,
      fileName: fileName
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  async getWebsocketUrl(params: {deployment_id: string}) {
    const response = await this._client.get(`${this.apiBase}/api/websocket?deployment_id=${params.deployment_id}`);
    return response.data;
  }
}

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
    // Clear any existing Authorization header
    delete config.headers['Authorization'];
    
    // Add the authorization header explicitly with the correct token
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${apiToken}`;
    config.headers['Content-Type'] = 'application/json';
    
    return config;
});

const client = new ComfyDeployClient({
    apiBase: apiBase,
    apiToken: apiToken,
    _client: axiosInstance,
    timeout: 30000
});


// Function to get current URL information from the browser
function getCurrentUrlInfo() {
    const url = new URL(window.location.href);
    return {
        host: url.host,
        protocol: url.protocol.replace(':', '')
    };
}

// Function to determine the API base URL
function getApiBaseUrl() {
    // For development, you might want to use a specific URL
    if (process.env.NODE_ENV === 'development') {
        return apiBase || "http://127.0.0.1:3000";
        // return process.env.COMFY_API_URL || "https://comfydeploy-osv.vercel.app";
    }
    
    // For production, use the current domain with the appropriate protocol
    const urlInfo = getCurrentUrlInfo();
    return `${urlInfo.protocol}://${urlInfo.host}`;
}

export async function generate(prompt: string, prompt2: string) {
    const headersList = headers();
    const host = headersList.get("host") || "";
    const protocol = headersList.get("x-forwarded-proto") || "";
    const endpoint = `${protocol}://${host}`;
    // Usage example: const currentUrl = getCurrentUrl(req); // req should be passed to the generate function
    console.log(process.env.CHARACTER_SHEET_ID);

    return await client.run({
        // deployment_id: "55f7e9ab-41be-4406-895e-d623fb1b2d54",
        deployment_id: "a17896d8-c937-4da0-b335-e22ab5b80475",
        // deployment_id: process.env.CHARACTER_SHEET_ID!,
        inputs: {
            "input_text": prompt,
            "input_image": prompt2,
        },
        webhook: `${endpoint}/api/webhook`
    })
}


export async function simple_generate(positive_prompt: string) {
    try {
        console.log("Calling simple_generate with prompt:", positive_prompt);        
        // Use axios directly to bypass the interceptors in the API.tsx file
        const response = await axiosInstance.post(
            // `${process.env.COMFY_API_URL}/api/run`, 
            `${apiBase}/api/run`,
            // "https://comfydeploy-osv.vercel.app/api/run",
            {
            // deployment_id: "f971b23d-01de-4a5f-b09f-33c3eeedf85b",
            deployment_id: deployment_id,
            // deployment_id: `${process.env.TEXT_GENERATE}`,cc4d728a-2fa5-4f86-90fa-dc9f5cd7c321
            inputs: {
                "input_text": positive_prompt,
                "input_image": ""
            }
        });
        
        // Log the response status for debugging
        console.log("ComfyDeploy API response status:", response.status);
        console.log("simple_generate response:", response.data);
        
        return response.data;
    } catch (error: any) {
        console.log("Error in simple_generate:", error);
        
        // Detailed error logging
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });
        
        // Return null instead of throwing to allow the UI to handle the error
        return null;
    }
}


export async function livePortrait(imageUrl: string, videoUrl: string) {
    try {
        // const apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yam1VRFI4c3ZwbUU0UkRCMDRLT2ZwbTVUWTMiLCJpYXQiOjE3NDA4Njk4MDF9.hHDkE41WWLZdNhl7NXGFGHvKBy8KacV9dUkiSVxTYaE";
        
        console.log("Starting live portrait generation with:", {
            imageUrl: imageUrl,
            videoUrl: videoUrl
        });
        
        // Use axiosInstance to bypass the API.tsx interceptors
        const response = await axiosInstance.post(
            `${apiBase}/api/run`, 
            // "https://comfydeploy-osv.vercel.app/api/run",
            {
            // deployment_id: "cc4d728a-2fa5-4f86-90fa-dc9f5cd7c321",
            deployment_id: deployment_id,
            inputs: {
                "input_image": "https://nyc3.digitaloceanspaces.com/anime-test/inputs/ComfyUI2_00016_.png",
                "input_video": "https://nyc3.digitaloceanspaces.com/anime-test/inputs/d10.mp4"
            }
        });
        
        console.log("Live portrait response:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error in live portrait generation:', error);
        throw error;
    }
}


export async function checkStatus(runId: string) {
    try {
        if (!runId) {
            throw new Error('No run ID provided');
        }
        
        // const apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yam1VRFI4c3ZwbUU0UkRCMDRLT2ZwbTVUWTMiLCJpYXQiOjE3NDA4Njk4MDF9.hHDkE41WWLZdNhl7NXGFGHvKBy8KacV9dUkiSVxTYaE";
        // const apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yam1VRFI4c3ZwbUU0UkRCMDRLT2ZwbTVUWTMiLCJpYXQiOjE3NDA4Njk4MDF9.hHDkE41WWLZdNhl7NXGFGHvKBy8KacV9dUkiSVxTYaE";        
        console.log(`Checking status for run ID: ${runId}`);
        
        // Create a new XMLHttpRequest to bypass fetch interceptors
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            // xhr.open('GET', `https://comfydeploy-osv.vercel.app/api/run?run_id=${runId}`);
            xhr.open('GET', `${apiBase}/api/run?run_id=${runId}`);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${apiToken}`);
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        console.log("Status check response:", data);
                        resolve(data);
                    } catch (e) {
                        console.error("Error parsing response:", e);
                        reject(new Error("Invalid JSON response"));
                    }
                } else {
                    console.error("Status check error response:", xhr.responseText);
                    reject(new Error(`Status check failed with status ${xhr.status}`));
                }
            };
            
            xhr.onerror = function() {
                console.error("Network error during status check");
                reject(new Error("Network error"));
            };
            
            xhr.send();
        });
    } catch (error) {
        console.error('Error checking status:', error);
        return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
}

interface UploadUrlResponse {
    upload_url: string;
    file_id: string;
    download_url: string;
}

export async function getUploadUrl(file: File): Promise<UploadUrlResponse> {
  try {
    // const response = await fetch('https://comfydeploy-osv.vercel.app/api/file-upload', {
    const response = await fetch(`${apiBase}/api/file-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: file.type,
        fileSize: file.size,
        fileName: file.name,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate the response
    if (!data.upload_url || !data.file_id || !data.download_url) {
      throw new Error('Invalid response from getUploadUrl');
    }

    // Return the upload URL information
    return {
      upload_url: data.upload_url,
      file_id: data.file_id,
      download_url: data.download_url,
    };
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw error;
  }
}

export async function getWebsocketUrl() {
    return await client.getWebsocketUrl({
        deployment_id: deployment_id,
    })
}

export async function getWebsocketUrl2() {
    return await client.getWebsocketUrl({
        deployment_id: deployment_id,
    })
}

export async function getWebsocketUrl3() {
    return await client.getWebsocketUrl({
        deployment_id: deployment_id,
    })
}

export async function getWebsocketUrlAny(deployment_id: string) {
    return await client.getWebsocketUrl({
        deployment_id: deployment_id,
    })
}

// Debug function to check API connectivity
export async function checkComfyDeployConnection() {
    try {
        const apiBase = getApiBaseUrl();

        // Use axiosInstance to bypass the API.tsx interceptors
        const response = await axiosInstance.get(`${apiBase}/api/health`);
        
        if (!response.status || response.status >= 400) {
            return {
                status: "error",
                message: `Server responded with ${response.status}: ${response.statusText}`
            };
        }
        
        return {
            status: "success",
            message: "Connected to ComfyDeploy API successfully"
        };
    } catch (error) {
        return {
            status: "error",
            message: `Failed to connect: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}