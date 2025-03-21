import { usePostUploadFile } from "@/controllers/API/queries/files/use-post-upload-file";
import { createFileUpload } from "@/helpers/create-file-upload";
import useFileSizeValidator from "@/shared/hooks/use-file-size-validator";
import { cn } from "@/utils/utils";
import { useEffect, useRef, useState } from "react";
import {
  CONSOLE_ERROR_MSG,
  INVALID_FILE_ALERT,
} from "../../../../../constants/alerts_constants";
import useAlertStore from "../../../../../stores/alertStore";
import useFlowsManagerStore from "../../../../../stores/flowsManagerStore";
import IconComponent from "../../../../common/genericIconComponent";
import { Button } from "../../../../ui/button";
import { FileComponentType, InputProps } from "../../types";
import { X, Upload, Camera, ImageIcon, SparkleIcon, AtomIcon } from 'lucide-react';
import Loading from "@/components/ui/loading";
import { OutputRender } from "@/components/core/canvasControlsComponent/OutputRender";
import { checkStatus, getUploadUrl, livePortrait, simple_generate, convertToComfyCompatibleUrl } from "@/components/core/canvasControlsComponent/comfy_generate";


async function uploadFile(uploadUrl: string, file: File): Promise<Response> {
  try {
    // Create a new fetch function that bypasses interceptors
    const directFetch = window.fetch.bind(window);
    
    // Use the direct fetch function to avoid interceptors
    return directFetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
        "x-amz-acl": "public-read",
        "Content-Length": file.size.toString(),
      },
      // Explicitly disable credentials to prevent cookies from being sent
      credentials: 'omit',
      // Set mode to cors to ensure proper CORS handling
      mode: 'cors'
    });
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

export default function InputFileComponent({
  value,
  handleOnNewValue,
  disabled,
  fileTypes,
  editNode = false,
  id,
}: InputProps<string, FileComponentType>): JSX.Element {
  const currentFlowId = useFlowsManagerStore((state) => state.currentFlowId);
  const setErrorData = useAlertStore((state) => state.setErrorData);
  const { validateFileSize } = useFileSizeValidator(setErrorData);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState({
    imageFile: null as File | null,
    videoFile: null as File | null,
    generatedImageUrl: null as string | null,
    generatedImageFilename: null as string | null,
    generatedVideoFilename: null as string | null,
    imageUpdateUrl: null as string | null,
    videoUpdateUrl: null as string | null,
    txtPrompt: '',
    status: '',
    error: null as string | null,
    imageGenerationRunId: '',
    videoGenerationRunId: '',
    isGeneratingImage: false,
    isGeneratingVideo: false
  });
  const updateState = (updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  };
  const hasValidImage = state.imageFile || state.generatedImageUrl;
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Clear component state
  useEffect(() => {
    if (disabled && value !== "") {
      handleOnNewValue({ value: "", file_path: "" }, { skipSnapshot: true });
    }
  }, [disabled, handleOnNewValue]);

  function checkFileType(fileName: string): boolean {
    if (fileTypes === undefined) return true;
    for (let index = 0; index < fileTypes.length; index++) {
      if (fileName.endsWith(fileTypes[index])) {
        return true;
      }
    }
    return false;
  }

  const { mutate, isPending } = usePostUploadFile();

  const handleButtonClick = (): void => {
    createFileUpload({ multiple: false, accept: fileTypes?.join(",") }).then(
      (files) => {
        const file = files[0];
        if (file) {
          if (!validateFileSize(file)) {
            return;
          }

          if (checkFileType(file.name)) {
            // Upload the file
            mutate(
              { file, id: currentFlowId },
              {
                onSuccess: (data) => {
                  // Get the file name from the response
                  const { file_path } = data;

                  // sets the value that goes to the backend
                  // Update the state and on with the name of the file
                  // sets the value to the user
                  handleOnNewValue({ value: file.name, file_path });
                },
                onError: (error) => {
                  console.error(CONSOLE_ERROR_MSG);
                  setErrorData({
                    title: "Error uploading file",
                    list: [error.response?.data?.detail],
                  });
                },
              },
            );
          } else {
            // Show an error if the file type is not allowed
            setErrorData({
              title: INVALID_FILE_ALERT,
              list: [fileTypes?.join(", ") || ""],
            });
          }
        }
      },
    );
  };
  
  const isDisabled = disabled || isPending;

  // const uploadFile = async (uploadUrl: string, file: File) => {
  //   try {
  //     // First, check if the file and URL are valid
  //     if (!file || !uploadUrl) {
  //       throw new Error('Invalid file or upload URL');
  //     }

  //     // Create the request
  //     const response = await fetch(uploadUrl, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': file.type,
  //         'Content-Length': file.size.toString(),
  //         'x-amz-acl': 'public-read',
  //         'Origin': window.location.origin
  //       },
  //       body: file,
  //       mode: 'cors',
  //       credentials: 'omit'
  //     });

  //     if (!response.ok) {
  //       console.error('Upload failed:', {
  //         status: response.status,
  //         statusText: response.statusText,
  //         url: uploadUrl
  //       });
  //       throw new Error(`Upload failed with status: ${response.status}`);
  //     }

  //     // For S3/Spaces, a successful upload returns the URL where the file was uploaded
  //     const uploadedUrl = uploadUrl.split('?')[0]; // Remove query parameters
  //     return uploadedUrl;

  //   } catch (error) {
  //     console.error('Error uploading file:', {
  //       error,
  //       fileType: file.type,
  //       fileSize: file.size,
  //       uploadUrl
  //     });
  //     throw error;
  //   }
  // };

  // Handle image generation from text prompt
  
  const handleImageGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.isGeneratingImage || !state.txtPrompt.trim()) return;

    try {
      updateState({ 
        isGeneratingImage: true, 
        error: null, 
        status: 'Generating image...' 
      });

      // Generate image from text prompt
      const saveResponse = await simple_generate(state.txtPrompt);
      if (!saveResponse){
        updateState({
          error: "Failed to get a response from the image generation service",
          isGeneratingImage: false,
          status: ''
        });
        return;
      }
      console.log("saveResponse:", saveResponse);
      updateState({ imageGenerationRunId: saveResponse?.run_id });

      // Poll for generation status
      const pollInterval = setInterval(async () => {
        try {
          console.log("saveResponse?.run_id :", saveResponse?.run_id );
          
          const result = await checkStatus(saveResponse?.run_id || "");
          
          if (result?.status === 'success') {
            const imageUrl = result.outputs?.[0]?.data?.images?.[0]?.url;
            const filename = result.outputs?.[0]?.data?.images?.[0]?.filename;
            if (imageUrl) {
              updateState({ 
                generatedImageUrl: imageUrl,
                generatedImageFilename: filename,
                isGeneratingImage: false,
                status: 'Image generated successfully',
                imageFile: null // Clear any uploaded image
              });
            } else {
              updateState({
                error: 'Image URL not found in response',
                isGeneratingImage: false
              });
            }
            
            clearInterval(pollInterval);
          } else if (result?.status === 'failed') {
            updateState({ 
              error: 'Image generation failed', 
              isGeneratingImage: false 
            });
            clearInterval(pollInterval);
          }
        } catch (pollError) {
          console.error("Error polling for status:", pollError);
          updateState({
            error: 'Error checking generation status',
            isGeneratingImage: false
          });
          clearInterval(pollInterval);
        }
      }, 2000);

    } catch (error) {
      console.error("Image generation error:", error);
      updateState({
        error: error instanceof Error ? error.message : 'Failed to generate image',
        isGeneratingImage: false,
        status: ''
      });
    }
  };

  // Handle video generation
  const handleVideoGeneration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (state.isGeneratingVideo || !state.videoFile || (!state.imageFile && !state.generatedImageUrl)) {
      updateState({ error: 'Please provide both image and video' });
      return;
    }

    try {
      updateState({ 
        isGeneratingVideo: true, 
        error: null, 
        status: 'Processing files...' 
      });

      // Variables to store our URLs
      let imageDownloadUrl = state.generatedImageUrl;
      let videoDownloadUrl = null;

      // Upload image if needed
      if (state.imageFile && !imageDownloadUrl) {
        const imageUrlResponse = await getUploadUrl(state.imageFile);

        if (!imageUrlResponse?.upload_url) {
          throw new Error('Failed to get image upload URL');
        }
        
        const imageUploadResponse = await uploadFile(imageUrlResponse.upload_url, state.imageFile);
        console.log("imageUploadResponse:", imageUploadResponse);
        
        if (!imageUploadResponse.ok) {
          throw new Error('Failed to upload image file');
        }
        
        imageDownloadUrl = convertToComfyCompatibleUrl(imageUrlResponse.download_url);
        updateState({ imageUpdateUrl: imageDownloadUrl });
        console.log("Converted image URL:", imageDownloadUrl);
      }

      // Upload video
      if (state.videoFile) {
        const videoUrlResponse = await getUploadUrl(state.videoFile);
        console.log("videoUrlResponse:", videoUrlResponse);

        if (!videoUrlResponse?.upload_url) {
          throw new Error('Failed to get video upload URL');
        }
        
        const videoUploadResponse = await uploadFile(videoUrlResponse.upload_url, state.videoFile);
        console.log("videoUploadResponse:", videoUploadResponse);
        
        if (!videoUploadResponse.ok) {
          throw new Error('Failed to upload video file');
        }
        
        videoDownloadUrl = convertToComfyCompatibleUrl(videoUrlResponse.download_url);
        updateState({ videoUpdateUrl: videoDownloadUrl });
        console.log("Converted video URL:", videoDownloadUrl);
      }

      // Use the local variables instead of relying on state which might not be updated yet
      if (!imageDownloadUrl || !videoDownloadUrl) {
        throw new Error('Missing image or video URL');
      }

      // Generate video using the download URLs
      const response = await livePortrait(imageDownloadUrl, videoDownloadUrl);
      console.log("response:", response);
      
      if (response?.run_id) {
        updateState({ 
          videoGenerationRunId: response.run_id,
          status: 'Video generation started'
        });
      } else {
        throw new Error('Failed to start video generation: No run ID received');
      }

    } catch (error) {
      console.error('Video generation error:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Failed to generate video',
        isGeneratingVideo: false,
        status: ''
      });
    }
  };

  // Add polling effect for video generation status
  useEffect(() => {
    if (!state.videoGenerationRunId) return;

    const interval = setInterval(async () => {
      try {
        const result = await checkStatus(state.videoGenerationRunId);
        console.log("Video generation status check result:", result);
        
        if (result?.status === 'success') {
          // Look for the video in the gifs array (despite the name, it contains mp4 videos)
          const videoData = result.outputs?.find(output => output.data?.gifs)?.data?.gifs?.[0];
          
          if (videoData?.filename && videoData?.url) {
            updateState({
              videoUpdateUrl: videoData.url,
              generatedVideoFilename: videoData.filename,
              status: 'Video generated successfully',
              isGeneratingVideo: false,
            });
          } else {
            // Fallback to looking in other possible locations
            const videoUrl = result.outputs?.[0]?.data?.videos?.[0]?.url;
            const videoFilename = result.outputs?.[0]?.data?.videos?.[0]?.filename;
            
            if (videoUrl && videoFilename) {
              updateState({
                videoUpdateUrl: videoUrl,
                generatedVideoFilename: videoFilename,
                status: 'Video generated successfully',
                isGeneratingVideo: false,
              });
            } else {
              updateState({
                error: 'Video not found in response',
                isGeneratingVideo: false,
              });
            }
          }
          clearInterval(interval);
        } else if (result?.status === 'failed') {
          updateState({
            error: 'Video generation failed',
            isGeneratingVideo: false,
          });
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error checking generation status:', error);
        updateState({
          error: 'Error checking generation status',
          isGeneratingVideo: false,
        });
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [state.videoGenerationRunId]);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        {/* Image Section */}
        <div className="w-full">
          <h3 className="text-lg font-semibold mb-2">Character Image</h3>
          <div 
            className={cn("border-1 hover:bg-stone-200 dark:hover:bg-stone-700 dark:bg-stone-800 bg-stone-100 shadow-md rounded-lg h-64 flex items-center justify-center mb-4",
            !value && "text-placeholder-foreground",
              editNode && "h-6",
            )}
            onClick={() => imageInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                imageInputRef.current?.click();
              }
            }}
          >
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  updateState({ 
                    imageFile: file,
                    generatedImageUrl: null // Clear any generated image
                  });
                }
              }}
              className="hidden"
            />
            {/* {hasValidImage ? (
              <img 
                src={state.imageFile ? URL.createObjectURL(state.imageFile) : state.generatedImageUrl!}
                alt="Selected or generated content"
                className="h-full w-full object-contain rounded-lg cursor-grab"
                draggable
                onDragStart={(e) => {
                  const transferData = {
                    id: `image-${Date.now()}`,
                    src: state.imageFile ? URL.createObjectURL(state.imageFile) : state.generatedImageUrl!,
                    type: "IMAGE"
                  };
                  e.dataTransfer.setData('application/json', JSON.stringify(transferData));
                }}
              />
            ) : (
              <div className="text-center">
                <ImageIcon size={48} className="mx-auto mb-2 text-gray-500" />
                <p className="text-sm text-gray-400">Upload image or generate from text</p>
                <p className="text-xs text-violet-300 mt-1">Face should be clearly visible</p>
              </div>
            )} */}

            {hasValidImage ? (
              state.generatedImageUrl && state.generatedImageFilename ? (
                <OutputRender run_id={state.imageGenerationRunId}  filename={state.generatedImageFilename} />

              ) : (
                <img 
                  src={state.imageFile ? URL.createObjectURL(state.imageFile) : ''}
                  alt="Character" 
                  className="object-contain rounded-lg h-full" 
                />
              )
            ) : (
              <div className="text-center">
                <ImageIcon size={48} className="mx-auto mb-2 text-gray-500" />
                <p className="text-sm text-gray-400">Upload image or generate from text</p>
                <p className="text-xs text-violet-300 mt-1">Face should be clearly visible</p>
              </div>
            )}

            
          </div>

          <div className="flex space-x-2 mb-4">
            <Button 
              onClick={() => imageInputRef.current?.click()}
              // variant="outline" 
              className="bg-inherit rounded-full text-inherit"
            >
              <Upload size={16} className="mr-2" />
              Upload Image
            </Button>
            
            {hasValidImage && (
              <Button 
                onClick={() => updateState({ 
                  imageFile: null, 
                  generatedImageUrl: null 
                })} 
                // variant="outline" 
                className="flex-1 bg-inherit text-inherit"
              >
                Clear
              </Button>
            )}
          </div>

          <textarea
            placeholder="{placeholder}"
            className="w-full p-2 rounded-md bg-inherit text-inherit"
            rows={2}
            value={state.txtPrompt}
            onChange={e => updateState({ txtPrompt: e.target.value })}
          />

          <Button 
            onClick={handleImageGeneration}
            disabled={state.isGeneratingImage}
            className="w-full mt-2"
            // variant="gooey"
          >
            {state.isGeneratingImage ? <Loading /> : (
              <>
                Generate Image
                <AtomIcon size={20} className="ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Video Section */}
        <div className="w-full">
          <h3 className="text-lg font-semibold mb-2">Input Video</h3>
          <div 
            className={cn("border-1 hover:bg-stone-200 dark:hover:bg-stone-700 dark:bg-stone-800 bg-stone-100 shadow-md rounded-lg h-64 flex items-center justify-center mb-4",
            !value && "text-placeholder-foreground",
              editNode && "h-6",
            )}
            onClick={() => videoInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                videoInputRef.current?.click();
              }
            }}
          >
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  updateState({ videoFile: file });
                }
              }}
              className="hidden"
            />
            {state.videoFile ? (
              <video 
                ref={videoRef} 
                controls 
                className="h-full rounded-lg cursor-grab"
                draggable
                onDragStart={(e) => {
                  const transferData = {
                    id: `video-${Date.now()}`,
                    src: URL.createObjectURL(state.videoFile),
                    type: "VIDEO"
                  };
                  e.dataTransfer.setData('application/json', JSON.stringify(transferData));
                }}
              >
                <source src={URL.createObjectURL(state.videoFile)} type={state.videoFile.type} />
                <track kind="captions" src="" label="English" />
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="text-center">
                <Camera size={48} className="mx-auto mb-2 text-gray-500" />
                <p className="text-sm text-gray-400">Click to upload video</p>
                <p className="text-xs text-violet-300 mt-1">Face should be clearly visible</p>
              </div>
            )}
          </div>

          <div className="flex space-x-2 mb-4">
            <Button 
              onClick={() => videoInputRef.current?.click()}
              // variant="outline" 
              className="bg-inherit rounded-full text-inherit"
            >
              <Upload size={16} className="mr-2" />
              Upload Video
            </Button>
            
            {state.videoFile && (
              <Button 
                onClick={() => updateState({ videoFile: null })} 
                // variant="outline" 
                className="flex-1 bg-inherit text-inherit"
              >
                Clear
              </Button>
            )}
          </div>

          <Button 
            onClick={handleVideoGeneration}
            disabled={state.isGeneratingVideo || !hasValidImage || !state.videoFile}
            className="w-full"
            // variant="gooeyGreen"
          >
            {state.isGeneratingVideo ? <Loading /> : (
              <>
                Generate Video
                <SparkleIcon size={20} className="ml-2" />
              </>
            )}
          </Button>
        </div>

        {state.error && (
          <p className="text-red-500 mt-4">{state.error}</p>
        )}

        {state.status && (
          <p className="text-blue-500 mt-4">{state.status}</p>
        )}

        {state.videoGenerationRunId && state.generatedVideoFilename && (
          <OutputRender run_id={state.videoGenerationRunId} filename={state.generatedVideoFilename} />
        )}

      </div>
    </div>
  );
}
