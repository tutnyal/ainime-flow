import { S3 } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Create the S3 client
const s3Client = new S3({
  endpoint: import.meta.env.VITE_SPACES_ENDPOINT || "https://nyc3.digitaloceanspaces.com",
  region: import.meta.env.VITE_SPACES_REGION || "us-east-1",
  credentials: {
    accessKeyId: import.meta.env.VITE_SPACES_KEY || "DO00YRXYU8EFT4CG3FCD",
    secretAccessKey: import.meta.env.VITE_SPACES_SECRET || "QywrU5OjK1V0woTdyuC+GKEL/nAl7ClOx63r680LjFg",
  },
});

export async function getFileDownloadUrl(file: string) {
  try {
    // Construct a direct URL to the Digital Ocean Spaces object
    const bucketName = import.meta.env.VITE_SPACES_BUCKET || "anime-test";
    const region = "nyc3"; // Hardcoded region based on your URLs
    
    // Ensure the file path doesn't start with a slash
    const filePath = file.startsWith('/') ? file.substring(1) : file;
    
    // Format: https://<bucket>.<region>.digitaloceanspaces.com/<key>
    const url = `https://${bucketName}.${region}.digitaloceanspaces.com/${filePath}`;
    
    return url;
  } catch (error) {
    console.error("Error constructing URL:", error);
    throw error;
  }
}

// Alternative URL format if the above doesn't work
export function getDirectFileUrl(file: string) {
  const bucketName = import.meta.env.VITE_SPACES_BUCKET || "anime-test";
  
  // Ensure the file path doesn't start with a slash
  const filePath = file.startsWith('/') ? file.substring(1) : file;
  
  // Alternative format: https://<region>.digitaloceanspaces.com/<bucket>/<key>
  return `https://nyc3.digitaloceanspaces.com/${bucketName}/${filePath}`;
}

// // Browser-compatible version without direct AWS SDK dependencies
// // This uses pre-signed URLs that are already generated

// // Define a simple cache to avoid repeated requests for the same URL
// const urlCache: Record<string, { url: string, expiry: number }> = {};

// // Simple direct URL approach (temporary solution)
// export async function getFileDownloadUrl(file: string) {
//   try {
//     // For Digital Ocean Spaces, construct a direct URL
//     // This assumes public read access is enabled on your bucket
//     const bucketName = 'anime-test'; // Replace with your actual bucket name
//     return `https://nyc3.digitaloceanspaces.com/${bucketName}/${file}`;
//   } catch (error) {
//     console.error("URL generation error:", error);
//     throw error;
//   }
// }
