'use client';

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import UploadAudioPage from "../upload/page";
import Navbar from '@/components/Navbar';
import AudioPlayer from "@/components/Audioplayer";
import ReactDOM from 'react-dom/client';

const defaultPosition = {
  lng: 77.5946,
  lat: 12.9716,
  zoom: 13
};

export default function AudioMap() {
  const [audioFiles, setAudioFiles] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [markerIcon, setMarkerIcon] = useState({ default: null, nearby: null });
  const [showUpload, setShowUpload] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [formData, setFormData] = useState({
    file: null,
    title: '',
    range: '',
    date: '',
    time: '',
    recipientUsernames: [],
  });
  const audioRoots = useRef({}); // Add this ref to store audio player roots

  const mapContainer = useRef(null);
  const map = useRef(null);

  const validAudioFiles = audioFiles.filter(
    (file) =>
      file?.location &&
      Array.isArray(file.location.coordinates) &&
      file.location.coordinates.length === 2 &&
      typeof file.location.coordinates[0] === "number" &&
      typeof file.location.coordinates[1] === "number"
  );

  useEffect(() => {
    setMounted(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserPosition(coords);
          
          // Initialize map with user's position
          if (mapContainer.current && !map.current) {
            map.current = new maplibregl.Map({
              container: mapContainer.current,
              style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 13
            });

            map.current.addControl(new maplibregl.NavigationControl());
          }
          
          fetchAudioFiles(coords);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback to default position if geolocation fails
          if (mapContainer.current && !map.current) {
            map.current = new maplibregl.Map({
              container: mapContainer.current,
              style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
              center: [defaultPosition.lng, defaultPosition.lat],
              zoom: defaultPosition.zoom
            });

            map.current.addControl(new maplibregl.NavigationControl());
          }
          fetchAudioFiles(null);
        }
      );
    } else {
      // Fallback if geolocation is not supported
      if (mapContainer.current && !map.current) {
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
          center: [defaultPosition.lng, defaultPosition.lat],
          zoom: defaultPosition.zoom
        });

        map.current.addControl(new maplibregl.NavigationControl());
      }
      fetchAudioFiles(null);
    }

    return () => map.current?.remove();
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers and cleanup audio roots
    const markers = document.getElementsByClassName('maplibregl-marker');
    Array.from(markers).forEach(marker => marker.remove());
    Object.values(audioRoots.current).forEach(root => root.unmount());
    audioRoots.current = {};

    // Add new markers
    validAudioFiles.forEach((file) => {
      const isTimeUnlocked = new Date(file.hidden_until) <= new Date();
      const isAccessible = file.isNearby && isTimeUnlocked;

      const markerElement = document.createElement('div');
      markerElement.className = 'maplibregl-marker';
      const markerInner = document.createElement('div');
      markerInner.className = `marker-inner ${isAccessible ? 'accessible' : 'locked'}`;
      markerElement.appendChild(markerInner);
      
      const popup = new maplibregl.Popup({ offset: 25, className: 'custom-popup' })
        .setHTML(`
          <div class="popup-content">
            <b>${file.file_name}</b><br/>
            <b>${file.title}</b><br/>
            <span class="${isAccessible ? 'status-accessible' : file.isNearby ? 'status-nearby' : 'status-distant'}">
              ${isAccessible ? "✅ Accessible" : file.isNearby ? "⏳ Nearby but Locked" : "📍 Not Nearby"}
            </span><br/>
            Range: ${file.range}m<br/>
            Hidden Until: ${new Date(file.hidden_until).toLocaleString()}<br/>
            Created At: ${new Date(file.created_at).toLocaleString()}<br/><br/>
            ${isAccessible ? `<div id="player-${file._id}"></div>` : 
              '<span class="locked-text">🔒 Locked</span>'
            }
          </div>
        `);

      const marker = new maplibregl.Marker(markerElement)
        .setLngLat([file.location.coordinates[0], file.location.coordinates[1]])
        .setPopup(popup)
        .addTo(map.current);

      // Add event listener for popup open
      marker.getPopup().on('open', () => {
        if (isAccessible) {
          const playerContainer = document.getElementById(`player-${file._id}`);
          if (playerContainer) {
            if (!audioRoots.current[file._id]) {
              audioRoots.current[file._id] = ReactDOM.createRoot(playerContainer);
            }
            audioRoots.current[file._id].render(<AudioPlayer audioId={file._id} />);
          }
        }
      });
    });
  }, [validAudioFiles]);

  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = (e) => {
      if (isSelectingLocation) {
        const { lng, lat } = e.lngLat;
        localStorage.setItem('selectedLocation', JSON.stringify({ lat, lng }));
        setIsSelectingLocation(false);
        setShowUpload(true);
      }
    };

    map.current.on('click', handleMapClick);
    return () => map.current?.off('click', handleMapClick);
  }, [isSelectingLocation]);

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async function fetchAudioFiles(userCoords) {
    const bearerToken = localStorage.getItem("authToken");

    try {
      const res = await axios.get("https://echo-trails-backend.vercel.app/audio/user/files", {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });

      const userFiles = res.data.audio_files || [];

      const enrichedFiles = userFiles.map((file) => {
        const [lng, lat] = file.location.coordinates;
        const distance = userCoords
          ? calculateDistance(userCoords.latitude, userCoords.longitude, lat, lng)
          : Infinity;
        const isNearby = distance <= file.range;
        return {
          ...file,
          isNearby,
          hidden_until: new Date(file.hidden_until).toLocaleString(),
          created_at: new Date(file.created_at).toLocaleString(),
        };
      });

      setAudioFiles(enrichedFiles);
    } catch (err) {
      console.error("❌ Error fetching audio files:", err);
    }
  }

  const styles = {
    container: {
      height: '100vh',  // Changed from minHeight
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden', // Added to prevent scrolling
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
      height: 'calc(100vh - 80px)',
      overflow: 'hidden', // Added to prevent scrolling
    },
    uploadButton: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      padding: '10px 20px',
      fontSize: '16px',
      fontWeight: '600',
      color: '#000000',
      backgroundColor: '#00ff9d',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      boxShadow: '0 0 20px rgba(0, 255, 157, 0.2)',
    },
    uploadContainer: {
      position: 'absolute',
      zIndex: 999,
      top: '40px', // Changed from 80px to move it higher
      left: '50%',
      transform: 'translateX(-50%)',
      width: '95%',
      maxWidth: '800px',
      backgroundColor: '#000000',
      boxShadow: '0 0 30px rgba(0, 0, 0, 0.3)',
      borderRadius: '16px',
      overflowY: 'auto',
      maxHeight: 'calc(90vh - 80px)', // Adjusted to give more space at bottom
      border: '1px solid rgba(255, 255, 255, 0.1)',
      paddingBottom: '20px',
    },
    map: {
      width: '100%',
      height: '100%'
    }
  };

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.mapContainer}>
        {!isSelectingLocation ? (
          <button onClick={() => setShowUpload((prev) => !prev)} style={styles.uploadButton}>
            {showUpload ? "Close Upload" : "Upload Audio"}
          </button>
        ) : (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 1000,
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px'
          }}>
            Click anywhere on the map to select a location
          </div>
        )}

        {showUpload && !isSelectingLocation && (
          <div style={styles.uploadContainer}>
            <UploadAudioPage 
              onLocationSelect={() => {
                setShowUpload(false);
                setIsSelectingLocation(true);
              }}
              formData={formData}
              setFormData={setFormData}
            />
          </div>
        )}

        <div ref={mapContainer} style={styles.mapWrapper} />
      </div>

      <style jsx global>{`
        .maplibregl-marker {
          cursor: pointer;
        }
        .marker-inner {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ff4b4b;
          border: 2px solid #fff;
          transition: all 0.2s;
        }
        .marker-inner.accessible {
          background: #00ff9d;
        }
        .custom-popup .maplibregl-popup-content {
          background: #000;
          color: white;
          padding: 16px;
          border-radius: 8px;
          min-width: 250px;
        }
        
        .custom-popup .maplibregl-popup-close-button {
          color: white;
          font-size: 16px;
          padding: 5px;
          right: 5px;
          top: 5px;
        }
        .popup-content {
          min-width: 200px;
        }
        .status-accessible { color: #00ff9d; }
        .status-nearby { color: orange; }
        .status-distant { color: blue; }
        .locked-text { color: #888; }
        body {
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        .maplibregl-map {
          height: 100%;
          width: 100%;
        }

        /* Single scrollbar style */
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}