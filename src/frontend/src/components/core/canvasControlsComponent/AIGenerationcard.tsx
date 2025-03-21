import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, Upload, Camera, ImageIcon, SparkleIcon, AtomIcon } from 'lucide-react';
// import { LoadingIcon } from '@/components/LoadingIcon';
import LoadingComponent from "@/components/common/loadingComponent"; 
import { checkStatus, generate, getUploadUrl, livePortrait, save_img, simple_generate } from './comfy_generate';
import { OutputRender } from './OutputRender';

// interface CardProps {
//   id: string;
//   index: number;
//   moveCard: (dragIndex: number, hoverIndex: number) => void;
//   removeCard: (id: string) => void;
//   placeholder: string;
// }

interface CardProps {
  userId: string;
}

const AIGenerationCard: React.FC<
  CardProps
> = ({
  userId,
}) => {
// const AIGenerationCard: React.FC<CardProps> = ({ id, removeCard, placeholder }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState({
    imageFile: null as File | null,
    videoFile: null as File | null,
    generatedImageUrl: null as string | null,
    generatedImageFilename: null as string | null,
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

  // Handle file uploads to S3/storage
  // const uploadFile = async (file: File) => {
  //   try {
  //     console.log('Uploading file:', { fileType: file.type, fileSize: file.size });
  //     const uploadResponse = await getUploadUrl(file.type, file.size);
      
  //     // Check if we have the required fields
  //     if (!uploadResponse?.upload_url || !uploadResponse?.download_url) {
  //       throw new Error('Invalid upload response: Missing required URLs');
  //     }

  //     // Attempt to upload the file
  //     const uploadResult = await fetch(uploadResponse.upload_url, {
  //       method: "PUT",
  //       body: file,
  //       headers: {
  //         "Content-Type": file.type,
  //         "x-amz-acl": "public-read",
  //       },
  //     });

  //     if (!uploadResult.ok) {
  //       throw new Error(`Upload failed with status: ${uploadResult.status}`);
  //     }

  //     return uploadResponse.download_url;
  //   } catch (error) {
  //     console.error('File upload failed:', error);
  //     throw new Error(error instanceof Error ? error.message : 'Failed to upload file');
  //   }
  // };

  async function uploadFile(uploadUrl: string, file: File): Promise<Response> {
    return fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
        "x-amz-acl": "public-read",
        "Content-Length": file.size.toString(),
      },
    });
  }

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
        return "there is no saveResponse AKA no RunId";
      }
      console.log("saveResponse:", saveResponse);
      updateState({ imageGenerationRunId: saveResponse?.run_id });

      // Poll for generation status
      const pollInterval = setInterval(async () => {
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
          }
          
          clearInterval(pollInterval);
        } else if (result?.status === 'failed') {
          updateState({ 
            error: 'Image generation failed', 
            isGeneratingImage: false 
          });
          clearInterval(pollInterval);
        }
      }, 2000);

    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Failed to generate image',
        isGeneratingImage: false
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

      // Get image URL - either upload the file or use generated URL
      let imageUrl;
      if (state.generatedImageUrl) {
        imageUrl = state.generatedImageUrl;
      } else if (state.imageFile) {
        try {
          const getUrl = getUploadUrl(state.imageFile.type, state.imageFile.size);
          imageUrl = uploadFile((await getUrl).upload_url, state.imageFile);
          if ((await getUrl).download_url) {
            updateState({ 
              imageUpdateUrl: (await getUrl).download_url,
              status: 'We got image download URL'
          });
          }else{
            throw new Error('No image available');
          };

        } catch (error) {
          throw new Error(error instanceof Error ? error.message : 'Failed to upload image file');
        }
      }
      imageUrl = state.imageUpdateUrl;
      if (!imageUrl) {
        throw new Error('No image available');
      }

      // Upload video file
      let videoUrl;
      try {
        const getVideoUrl = getUploadUrl(state.videoFile.type, state.videoFile.size);
        videoUrl = uploadFile((await getVideoUrl).upload_url, state.videoFile);
        // videoUrl = await uploadFile(state.videoFile);
        if ((await getVideoUrl).download_url) {
          updateState({ 
            videoUpdateUrl: (await getVideoUrl).download_url,
            status: 'We got video download URL'
        });
        }else{
          throw new Error('No video available');
        };

      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to upload video file');
        // throw new Error('Failed to upload video: ' + error.message);
      }


      videoUrl = state.imageUpdateUrl;
      if (!videoUrl) {
        throw new Error('Video upload failed');
      }

      // Generate video using image and video URLs
      const response = await livePortrait(imageUrl, videoUrl);
      
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

  const hasValidImage = state.imageFile || state.generatedImageUrl;

  // Helper functions
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      updateState({ 
        imageFile: file,
        generatedImageUrl: null
      });
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      updateState({ videoFile: file });
    }
  };

  const clearImage = () => {
    updateState({ 
      imageFile: null, 
      generatedImageUrl: null 
    });
  };

  const renderImagePreview = () => {
    if (hasValidImage) {
      return state.generatedImageUrl && state.generatedImageFilename ? (
        <OutputRender run_id={state.imageGenerationRunId} filename={state.generatedImageFilename} />
      ) : (
        <img 
          src={state.imageFile ? URL.createObjectURL(state.imageFile) : ''}
          alt="Character" 
          className="object-contain rounded-lg h-full" 
        />
      );
    }
    return (
      <div className="text-center">
        <ImageIcon size={48} className="mx-auto mb-2 text-gray-500" />
        <p className="text-sm text-gray-400">Upload image or generate from text</p>
        <p className="text-xs text-violet-300 mt-1">Face should be clearly visible</p>
      </div>
    );
  };

  const renderVideoPreview = () => {
    if (state.videoFile) {
      return (
        <video controls className="h-full rounded-lg">
          <source src={URL.createObjectURL(state.videoFile)} type={state.videoFile.type} />
          Your browser does not support video playback.
        </video>
      );
    }
    return (
      <div className="text-center">
        <Camera size={48} className="mx-auto mb-2 text-gray-500" />
        <p className="text-sm text-gray-400">Click to upload video</p>
        <p className="text-xs text-violet-300 mt-1">Face should be clearly visible</p>
      </div>
    );
  };

  return (
    <div className="h-full max-w-4xl p-4 mb-4 shadow-lg rounded-lg relative dark:text-white dark:bg-stone-900">
      {/* <Button 
        variant="ghost" 
        className="absolute top-2 right-2 p-1" 
        onClick={() => removeCard(id)}
      >
        <X size={16} />
      </Button> */}
      
      {/* Image Section */}
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-2">Character Image</h3>
        <div 
          className="border-1 hover:bg-stone-200 dark:hover:bg-stone-700 dark:bg-stone-800 bg-stone-100 shadow-md rounded-lg h-64 flex items-center justify-center mb-4"
          onClick={() => imageInputRef.current?.click()}
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {renderImagePreview()}
        </div>

        <div className="flex space-x-2 mb-4">
          <Button 
            onClick={() => imageInputRef.current?.click()}
            variant="outline" 
            className="bg-inherit rounded-full text-inherit"
          >
            <Upload size={16} className="mr-2" />
            Upload Image
          </Button>
          
          {hasValidImage && (
            <Button 
              onClick={clearImage} 
              variant="outline" 
              className="flex-1 bg-inherit text-inherit"
            >
              Clear
            </Button>
          )}
        </div>

        <textarea
          placeholder="Enter text prompt"
          className="w-full p-2 rounded-md bg-inherit text-inherit"
          rows={2}
          value={state.txtPrompt}
          onChange={e => updateState({ txtPrompt: e.target.value })}
        />

        <Button 
          onClick={handleImageGeneration}
          disabled={state.isGeneratingImage}
          className="w-full mt-2"
        >
          {state.isGeneratingImage ? <LoadingComponent remSize={50} /> : (
            <>
              Generate Image
              <AtomIcon size={20} className="ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

      {/* Video Section */}
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-2">Input Video</h3>
        <div 
          className="border-1 hover:bg-stone-200 dark:hover:bg-stone-700 dark:bg-stone-800 bg-stone-100 shadow-md rounded-lg h-64 flex items-center justify-center mb-4"
          onClick={() => videoInputRef.current?.click()}
        >
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />
          {renderVideoPreview()}
        </div>

        <Button 
          onClick={handleVideoGeneration}
          disabled={state.isGeneratingVideo || !hasValidImage || !state.videoFile}
          className="w-full"
        >
          {state.isGeneratingVideo ? <LoadingComponent remSize={50} /> : (
            <>
              Generate Video
              <SparkleIcon size={20} className="ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Status and Error Messages */}
      {state.error && (
        <p className="text-red-500 mt-4">{state.error}</p>
      )}

      {state.status && (
        <p className="text-blue-500 mt-4">{state.status}</p>
      )}

      {state.videoGenerationRunId && state.generatedImageFilename && (
        <OutputRender run_id={state.videoGenerationRunId} filename={state.generatedImageFilename} />
      )}
    </div>
  );
};

export default AIGenerationCard;