'use client';
import React, { useState, useEffect } from "react";
import Loading from "@/components/ui/loading";
import { getFileDownloadUrl, getDirectFileUrl } from "./getFileDownloadUrl";

interface OutputRenderProps {
  run_id: string;
  filename: string;
}

export const OutputRender: React.FC<OutputRenderProps> = ({ run_id, filename }) => {
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async (retryCount = 0) => {
      try {
        setLoading(true);
        
        // Construct the file path for the S3 object
        const filePath = `outputs/runs/${run_id}/${filename}`;
        
        try {
          // First try to get a signed URL from the backend
          const signedUrl = await getFileDownloadUrl(filePath);
          setOutputUrl(signedUrl);
        } catch (signedUrlError) {
          console.warn("Failed to get signed URL, falling back to direct URL:", signedUrlError);
          
          // Fallback to direct URL if signed URL fails
          const directUrl = getDirectFileUrl(filePath);
          setOutputUrl(directUrl);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching URL:", err);
        
        if (retryCount < 3) {
          // Retry with exponential backoff
          setTimeout(() => {
            fetchUrl(retryCount + 1);
          }, 1000 * Math.pow(2, retryCount));
        } else {
          setError("Failed to load the image. Please try again later.");
          setLoading(false);
        }
      }
    };

    if (run_id && filename) {
      fetchUrl();
    }

    return () => {
      if (outputUrl && outputUrl.startsWith('blob:')) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, [run_id, filename]);

  const handleDragStart = (e: React.DragEvent<HTMLImageElement>) => {
    if (outputUrl) {
      e.dataTransfer.setData('application/json', JSON.stringify({
        id: `${run_id}_${filename}`,
        src: outputUrl,
        type: 'image'
      }));
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loading /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="relative">
      {outputUrl && (
        <img 
          src={outputUrl} 
          alt="Generated output" 
          className="w-full rounded-lg cursor-grab"
          draggable
          onDragStart={handleDragStart}
        />
      )}
      <p className="text-xs text-center mt-1 text-muted-foreground">
        Drag to timeline to add to your project
      </p>
    </div>
  );
};