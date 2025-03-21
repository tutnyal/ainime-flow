import axios from "axios"

let apiToken = "";
let apiBase = "";
let deployment_id = "";
let deployment_id_lp = "";
const environment = "local";

if (environment === "local") {
    // apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yam1VRFI4c3ZwbUU0UkRCMDRLT2ZwbTVUWTMiLCJpYXQiOjE3NDIwMjY0NDl9.4JuzAyFi6iFuvOiYId4rdS0RnKSlNslMO7aYWWecbKQ";
    apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yam1VRFI4c3ZwbUU0UkRCMDRLT2ZwbTVUWTMiLCJpYXQiOjE3NDA4Njk4MDF9.hHDkE41WWLZdNhl7NXGFGHvKBy8KacV9dUkiSVxTYaE";
    // Use the proxy URL for development
    apiBase = process.env.NODE_ENV === 'development' 
        ? '/comfy-api' 
        : "https://comfydeploy-osv.vercel.app";
        // : "http://127.0.0.1:3001";
    // deployment_id = "f971b23d-01de-4a5f-b09f-33c3eeedf85b";
    deployment_id = "55f7e9ab-41be-4406-895e-d623fb1b2d54";
    deployment_id_lp = "cc4d728a-2fa5-4f86-90fa-dc9f5cd7c321";
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
    const response = await this._client.post(`${this.apiBase}/run`, {
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

    const response = await this._client.post(`${this.apiBase}/file-upload`, {
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
    const response = await this._client.get(`${this.apiBase}/websocket?deployment_id=${params.deployment_id}`);
    return response.data;
  }
}

const axiosInstance = axios.create({
  withCredentials: false // Important for CORS requests
});

axiosInstance.interceptors.request.use((config) => {
    // Clear any existing Authorization header
    delete config.headers['Authorization'];
    
    // Add the authorization header explicitly with the correct token
    config.headers = config.headers || {};
    config.headers['Authorization'] = 'Bearer ' + apiToken;
    config.headers['Content-Type'] = 'application/json';

    // Add CORS headers
    config.headers['Access-Control-Allow-Origin'] = '*';
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    config.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';

    
    return config;
});

// Add a response interceptor to handle errors more gracefully
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    console.error('API request error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

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


// Helper function to convert CDN URLs to direct URLs that ComfyUI can access
export function convertToComfyCompatibleUrl(url: string): string {
    // Check if the URL is already in the correct format
    if (url.includes('anime-test.nyc3.cdn.digitaloceanspaces.com')) {
      return url;
    }
    
    // If the URL is in the incorrect format (missing bucket name)
    if (url.includes('nyc3.cdn.digitaloceanspaces.com/inputs/')) {
      return url.replace(
        'nyc3.cdn.digitaloceanspaces.com/inputs/', 
        'anime-test.nyc3.cdn.digitaloceanspaces.com/inputs/'
      );
    }
    
    // If it's a different format, try to extract the filename and construct the proper URL
    const bucketName = import.meta.env.VITE_SPACES_BUCKET || "anime-test";
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    return `https://${bucketName}.nyc3.cdn.digitaloceanspaces.com/inputs/${filename}`;
  }

// Function to determine the API base URL
function getApiBaseUrl() {
    // For development, you might want to use a specific URL
    if (process.env.NODE_ENV === 'development') {
        return apiBase;
        // return process.env.COMFY_API_URL || "http://127.0.0.1:3000";
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
        deployment_id: deployment_id,
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
        
        // Log the request details for debugging
        console.log("Making request to ComfyDeploy API with:", {
            url: `${apiBase}/run`,
            deploymentId: `${deployment_id}`,
            prompt: positive_prompt
        });
        
        // Use axios directly to bypass the interceptors in the API.tsx file
        const response = await axiosInstance.post(
            `${apiBase}/run`,
            {
            deployment_id: deployment_id,
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
        // Ensure URLs are in the correct format
        const compatibleImageUrl = convertToComfyCompatibleUrl(imageUrl);
        const compatibleVideoUrl = convertToComfyCompatibleUrl(videoUrl);
        
        console.log("Starting live portrait generation with:", {
            imageUrl: compatibleImageUrl,
            videoUrl: compatibleVideoUrl
        });
        
        // Use axiosInstance to bypass the API.tsx interceptors
        const response = await axiosInstance.post(
            `${apiBase}/run`, 
            {
            deployment_id: deployment_id_lp,
            inputs: {
                "input_video": compatibleVideoUrl,
                "input_image": compatibleImageUrl
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
        
        console.log(`Checking status for run ID: ${runId}`);
        
        // Use axios instead of fetch for consistency with other requests
        const response = await axiosInstance.get(`${apiBase}/run`, {
            params: { run_id: runId },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`
            }
        });
        
        console.log("Status check response:", response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error checking status:', error);
        
        // Return a structured error object with a flag to indicate we should stop polling
        return { 
            status: 'error', 
            message: error instanceof Error ? error.message : String(error),
            stopPolling: true // Add this flag to indicate polling should stop
        };
    }
}

interface UploadUrlResponse {
    upload_url: string;
    file_id: string;
    download_url: string;
}

export async function getUploadUrl(file: File): Promise<UploadUrlResponse> {
  try {
    const response = await fetch(`${apiBase}/file-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
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
    });
}

// Debug function to check API connectivity
export async function checkComfyDeployConnection() {
    try {
        // Use axiosInstance to bypass the API.tsx interceptors
        const response = await axiosInstance.get(`${apiBase}/health`);
        
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