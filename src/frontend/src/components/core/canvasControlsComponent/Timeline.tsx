import React, { useState, useRef, useEffect } from "react";
import {
  Trash2Icon,
  PlayIcon,
  PauseIcon,
  DownloadIcon,
  ChevronDown,
} from "lucide-react";
import { VideoPlayerModal } from "./VideoPlayerModal";

interface Clip {
  id: string;
  src: string;
  duration: number;
  type: "image" | "video" | "gif";
  thumbnail?: string;
  timestamp: number;
}

interface TimelineProps {
  onClose?: () => void;
  onExport?: (clips: Clip[]) => void;
}

const Timeline: React.FC<TimelineProps> = ({ onClose, onExport }) => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleDrop = (e) => {
    e.preventDefault();
    
    // Check if the dataTransfer contains the expected data
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data && data.type && data.src && data.id) {
        const type = data.type.toLowerCase();
        
        // Only accept image, video, or gif types
        if (['image', 'video', 'gif'].includes(type)) {
          const newClip: Clip = {
            id: data.id,
            src: data.src,
            type: type as "image" | "video" | "gif",
            duration: type === "video" ? 0 : 3, // Default duration for images/GIFs
            timestamp: Date.now(),
          };
          
          setClips((prev) => [...prev, newClip]);
        }
      }
    } catch (error) {
      console.error("Error processing dropped item:", error);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handlePlayPause = () => {
    if (clips.length === 0) return;
    
    setIsModalOpen(true);
    setIsPlaying(!isPlaying);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleClipSelection = (index: number) => {
    setCurrentClipIndex(index);
    setIsPlaying(false);
    setCurrentTime(
      clips.slice(0, index).reduce((total, clip) => total + clip.duration, 0)
    );
  };

  const calculateClipStartTime = (index: number) =>
    clips.slice(0, index).reduce((total, clip) => total + clip.duration, 0);

  const renderClip = (clip: Clip, index: number) => {
    const isCurrent = index === currentClipIndex;

    return (
      <div
        key={clip.id}
        onClick={() => handleClipSelection(index)}
        className={`relative flex-shrink-0 w-24 h-20 rounded cursor-pointer ${
          isCurrent ? "ring-2 ring-blue-500" : ""
        }`}
      >
        {clip.thumbnail ? (
          <img
            src={clip.thumbnail}
            alt={`Clip ${index + 1}`}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="w-full h-full bg-gray-400 rounded"></div>
        )}
        <span className="absolute bottom-0 right-0 p-1 text-xs bg-black text-white rounded">
          {Math.floor(clip.duration)}s
        </span>
      </div>
    );
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="fixed bottom-0 left-0 z-50 m-1 h-[200px] w-[calc(100%-8px)] rounded-xl bg-neutral-100 dark:bg-neutral-900"
    >
      <div className="flex h-12 w-full items-center justify-between px-4">
        <button
          onClick={handlePlayPause}
          className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full"
          disabled={clips.length === 0}
        >
          {isPlaying ? (
            <PauseIcon size={20} />
          ) : (
            <PlayIcon size={20} />
          )}
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setClips([])}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full"
          >
            <Trash2Icon size={20} />
          </button>
          <button
            onClick={() => onExport?.(clips)}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full"
          >
            <DownloadIcon size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full"
          >
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      <div className="flex h-full w-full flex-col bg-white dark:bg-neutral-800">
        <div className="flex gap-2 overflow-x-auto p-4 mx-3 mt-3 h-[60%] rounded-xl border border-dashed border-neutral-400 bg-neutral-100 dark:bg-black">
          {clips.map(renderClip)}
        </div>
      </div>

      <VideoPlayerModal
        isOpen={isModalOpen}
        clips={clips}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default Timeline;