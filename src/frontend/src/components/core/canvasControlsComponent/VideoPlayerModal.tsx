import { useState, useRef, useEffect } from "react";

interface Clip {
  id: string;
  src: string;
  duration: number;
  type: "image" | "video" | "gif";
  thumbnail?: string;
  timestamp: number;
}

interface VideoPlayerModalProps {
  isOpen: boolean;
  clips: Clip[];
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, clips, onClose }) => {
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize playback when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentClipIndex(0);
      setIsPlaying(true);
      preloadNextClip();
    } else {
      setIsPlaying(false);
    }
  }, [isOpen]);

  // Preload the next clip
  const preloadNextClip = () => {
    if (nextVideoRef.current && currentClipIndex < clips.length - 1) {
      nextVideoRef.current.src = clips[currentClipIndex + 1].src;
      nextVideoRef.current.load();
    }
  };

  // Handle main playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isOpen) return;

    const playCurrentClip = async () => {
      if (!isTransitioning && isPlaying) {
        try {
          video.src = clips[currentClipIndex].src;
          await video.load();
          await video.play();
          preloadNextClip();
        } catch (error) {
          console.error("Error playing video:", error);
        }
      }
    };

    playCurrentClip();
  }, [currentClipIndex, isOpen, isPlaying, isTransitioning, clips]);

  // Handle clip transitions
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isOpen) return;

    const handleEnded = async () => {
      if (currentClipIndex < clips.length - 1) {
        setIsTransitioning(true);
        setCurrentClipIndex(prev => prev + 1);
        
        // Swap video elements to avoid flickering
        if (nextVideoRef.current) {
          videoRef.current!.style.display = 'none';
          nextVideoRef.current.style.display = 'block';
          await nextVideoRef.current.play();
          
          // Prepare the main video for the next clip
          videoRef.current!.src = clips[currentClipIndex + 1]?.src || '';
          await videoRef.current!.load();
          
          // Reset display after transition
          setTimeout(() => {
            if (videoRef.current && nextVideoRef.current) {
              videoRef.current.style.display = 'block';
              nextVideoRef.current.style.display = 'none';
              setIsTransitioning(false);
            }
          }, 100);
        }
      } else {
        setIsPlaying(false);
        onClose();
      }
    };

    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [clips, currentClipIndex, isOpen, onClose]);

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        await video.pause();
      } else {
        await video.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case " ":
          e.preventDefault();
          handlePlayPause();
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-[80%] max-w-3xl bg-white dark:bg-neutral-800 rounded-lg">
        <div className="flex justify-between items-center p-4 border-b dark:border-neutral-700">
          <h2 className="text-lg font-bold dark:text-white">Video Player</h2>
          <button 
            onClick={onClose} 
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="relative p-4">
          <video
            ref={videoRef}
            className="w-full h-auto rounded"
            playsInline
          />
          <video
            ref={nextVideoRef}
            className="w-full h-auto rounded absolute top-4 left-4"
            style={{ display: 'none' }}
            playsInline
          />
        </div>
        <div className="flex items-center justify-between p-4 border-t dark:border-neutral-700">
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <span className="dark:text-white">
            Clip {currentClipIndex + 1} of {clips.length}
          </span>
        </div>
      </div>
    </div>
  );
};