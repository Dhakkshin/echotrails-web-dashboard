'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export default function AudioPlayer({ audioId }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const audioRef = useRef(null);
  const [audioState, setAudioState] = useState({
    isLoaded: false,
    error: null,
    duration: 0
  });

  useEffect(() => {
    let audioElement = null;
    let retryCount = 0;
    const maxRetries = 3;

    const loadAudioMetadata = async (url) => {
      return new Promise((resolve, reject) => {
        audioElement = new Audio();
        
        const onMetadataLoaded = () => {
          if (audioElement.duration && audioElement.duration !== Infinity) {
            resolve(audioElement.duration);
          } else if (retryCount < maxRetries) {
            retryCount++;
            audioElement.currentTime = 24 * 60 * 60; // Seek to 24 hours
            // Try again after seeking
            setTimeout(() => {
              if (audioElement.duration && audioElement.duration !== Infinity) {
                resolve(audioElement.duration);
              } else {
                reject(new Error('Could not determine audio duration'));
              }
            }, 500);
          } else {
            reject(new Error('Could not determine audio duration after retries'));
          }
        };

        audioElement.addEventListener('loadedmetadata', onMetadataLoaded);
        audioElement.addEventListener('error', reject);
        audioElement.src = url;
      });
    };

    const fetchAudio = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");
      try {
        const response = await axios.get(`https://echo-trails-backend.vercel.app/audio/files/${audioId}/download`, {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        });

        const blob = response.data;
        const url = URL.createObjectURL(blob);
        
        try {
          const duration = await loadAudioMetadata(url);
          setAudioState({
            isLoaded: true,
            error: null,
            duration: duration
          });
          setAudioUrl(url);
          setIsLoading(false);
        } catch (metadataError) {
          console.warn("Failed to get exact duration, using estimate:", metadataError);
          // Fallback to a default duration or estimated duration
          setAudioState({
            isLoaded: true,
            error: null,
            duration: 180 // Default 3 minutes
          });
          setAudioUrl(url);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("❌ Audio fetch error:", err);
        setAudioState(prev => ({ ...prev, error: err.message }));
        setIsLoading(false);
      }
    };

    fetchAudio();
    return () => {
      if (audioElement) {
        audioElement.removeEventListener('loadedmetadata', null);
        audioElement.removeEventListener('error', null);
        audioElement.src = '';
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioId]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const seekTime = parseFloat(e.target.value);
    if (audio) {
      audio.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {audioState.isLoaded && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          hidden
        />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={togglePlayback}
          disabled={isLoading || !audioState.isLoaded}
          style={{
            padding: "4px 10px",
            backgroundColor: "#00ff9d",
            color: "#000",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            cursor: isLoading || !audioState.isLoaded ? "default" : "pointer",
            opacity: isLoading || !audioState.isLoaded ? 0.5 : 1,
          }}
        >
          {isLoading ? "Loading..." : isPlaying ? "⏸ Pause" : "▶️ Play"}
        </button>

        <span style={{ color: "#fff", fontSize: "12px", minWidth: "80px" }}>
          {formatTime(currentTime)} / {audioState.isLoaded ? formatTime(audioState.duration) : "--:--"}
        </span>
      </div>

      <input
        type="range"
        min="0"
        max={audioState.duration || 0}
        step="0.1"
        value={currentTime}
        onChange={handleSeek}
        disabled={isLoading || !audioState.isLoaded}
        style={{ 
          width: "100%",
          opacity: isLoading || !audioState.isLoaded ? 0.5 : 1,
          cursor: isLoading || !audioState.isLoaded ? "default" : "pointer"
        }}
      />
    </div>
  );
}

function formatTime(sec) {
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}