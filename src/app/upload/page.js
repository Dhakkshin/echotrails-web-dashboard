"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { MapPin, Upload, Users, Clock, Music, Calendar, Mic, Square } from 'lucide-react';
import Navbar from '../../components/Navbar';

const AudioUploadForm = ({ onLocationSelect, formData, setFormData }) => {
  const [users, setUsers] = useState([]);
  const [currentUsername, setCurrentUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimer = useRef(null);
  const router = useRouter();

  // Use formData values instead of local state
  const { file, title, range, date, time, recipientUsernames } = formData;

  // Update handlers to use setFormData
  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const fetchCurrentUserAndFollowing = async () => {
      const token = localStorage.getItem('authToken');
      const username = localStorage.getItem('username');
      const userId = localStorage.getItem('userId');
      const headers = { Authorization: `Bearer ${token}` };

      try {
        setCurrentUsername(username);

        const usersRes = await axios.get('https://echo-trails-backend.vercel.app/users/following', { headers });
        // Add current user to the beginning of users list
        const currentUser = { _id: userId, username: username };
        setUsers([currentUser, ...usersRes.data]);

        // Check for selected location from map page
        const storedLocation = localStorage.getItem('selectedLocation');
        if (storedLocation) {
          const { lat, lng } = JSON.parse(storedLocation);
          setLatitude(lat.toString());
          setLongitude(lng.toString());
          localStorage.removeItem('selectedLocation');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to fetch user info. Please check your login.');
      }
    };

    fetchCurrentUserAndFollowing();

    // Check for selected location when component mounts or becomes visible
    const checkForSelectedLocation = () => {
      const storedLocation = localStorage.getItem('selectedLocation');
      if (storedLocation) {
        const { lat, lng } = JSON.parse(storedLocation);
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        localStorage.removeItem('selectedLocation');
      }
    };

    checkForSelectedLocation();
    window.addEventListener('focus', checkForSelectedLocation);
    return () => window.removeEventListener('focus', checkForSelectedLocation);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !range || !title || recipientUsernames.length === 0 || !latitude || !longitude) {
      setError('File, range, title, location coordinates, and at least one recipient are required.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    const hiddenUntil = date && time 
      ? new Date(`${date}T${time}`) 
      : new Date(Date.now() + 1000*60*60*24*365);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('latitude', parseFloat(latitude));
    formData.append('longitude', parseFloat(longitude));
    formData.append('range', parseFloat(range));
    formData.append('hidden_until', hiddenUntil.toISOString());
    formData.append('recipient_usernames', recipientUsernames.join(','));

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        'https://echo-trails-backend.vercel.app/audio/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 201 || response.status === 200) {
        setMessage('Audio file uploaded successfully!');

        if (recipientUsernames.includes(currentUsername)) {
          const series = JSON.parse(localStorage.getItem('audioSeries')) || [];
          series.push({
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            range: parseFloat(range),
            hiddenUntil: hiddenUntil.toISOString(),
            audioId: response.data.audioId,
            recipients: recipientUsernames,
          });
          localStorage.setItem('audioSeries', JSON.stringify(series));
        }

        // Reset form
        setFormData({
          file: null,
          title: '',
          range: '',
          date: '',
          time: '',
          recipientUsernames: [],
        });
        setLatitude('');
        setLongitude('');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = () => {
    onLocationSelect?.();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith('audio/')) {
      updateFormData('file', droppedFile);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        const audioFile = new File([blob], 'recorded-audio.mp3', { type: 'audio/mp3' });
        updateFormData('file', audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(recordingTimer.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = {
    container: {
      width: '100%',
      margin: '20px auto', // Changed from 0 auto
      padding: '20px 40px', // Added horizontal padding
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      backgroundColor: '#000000',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      minHeight: 'auto', // Changed from fixed height
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start', // Changed from center
      overflowX: 'hidden',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '20px',
    },
    label: {
      fontSize: '16px',
      fontWeight: '500',
      color: '#ffffff',
      marginLeft: '4px',
    },
    input: {
      padding: '18px 20px',
      fontSize: '18px',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#ffffff',
      height: '60px',
      outline: 'none',
    },
    dateTimeInput: {
      padding: '18px 20px',
      fontSize: '18px',
      borderRadius: '16px',
      border: '1px solid #00ff9d',
      backgroundColor: 'rgba(0, 255, 157, 0.05)',
      color: '#ffffff',
      height: '60px',
      outline: 'none',
      cursor: 'pointer',
      width: '100%',
      colorScheme: 'dark',
    },
    locationButton: {
      padding: '18px 20px',
      fontSize: '18px',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#ffffff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '20px',
      textDecoration: 'none',
      width: '100%',
    },
    locationInputs: {
      display: 'flex',
      gap: '12px',
    },
    locationInput: {
      flex: 1,
    },
    button: {
      padding: '20px',
      fontSize: '18px',
      fontWeight: '600',
      color: '#000000',
      backgroundColor: '#00ff9d',
      border: 'none',
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginTop: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      boxShadow: '0 0 20px rgba(0, 255, 157, 0.2)',
      height: '64px',
    },
    buttonDisabled: {
      backgroundColor: '#333333',
      cursor: 'not-allowed',
      color: '#666666',
      boxShadow: 'none',
    },
    error: {
      marginTop: '24px',
      textAlign: 'center',
      color: '#ff4d4d',
      fontSize: '16px',
      padding: '16px',
      borderRadius: '16px',
      backgroundColor: 'rgba(255, 77, 77, 0.1)',
      border: '1px solid rgba(255, 77, 77, 0.2)',
    },
    success: {
      marginTop: '24px',
      textAlign: 'center',
      color: '#4CAF50',
      fontSize: '16px',
      padding: '16px',
      borderRadius: '16px',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      border: '1px solid rgba(76, 175, 80, 0.2)',
    },
    dropdown: {
      position: 'relative',
      width: '100%',
    },
    dropdownList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#000000',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      marginTop: '4px',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 1000,
    },
    dropdownItem: {
      padding: '12px 16px',
      cursor: 'pointer',
      color: '#ffffff',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'background-color 0.2s',
    },
    selectedCount: {
      color: '#00ff9d',
      marginLeft: '8px',
    },
    section: {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      padding: '24px',
      borderRadius: '16px',
      marginBottom: '24px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
      color: '#00ff9d',
      fontSize: '18px',
      fontWeight: '600',
    },
    fileUpload: {
      border: `2px dashed ${dragActive ? '#00ff9d' : 'rgba(255, 255, 255, 0.1)'}`,
      borderRadius: '16px',
      padding: '32px 24px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: dragActive ? 'rgba(0, 255, 157, 0.05)' : 'transparent',
    },
    progress: {
      width: '100%',
      height: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '2px',
      overflow: 'hidden',
      marginTop: '8px',
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#00ff9d',
      width: `${uploadProgress}%`,
      transition: 'width 0.3s ease',
    },
  };

  const recordingStyles = {
    recordButton: {
      padding: '12px',
      borderRadius: '50%',
      backgroundColor: isRecording ? '#ff4d4d' : 'rgba(255, 255, 255, 0.05)',
      border: '1px solid',
      borderColor: isRecording ? '#ff4d4d' : '#00ff9d',
      color: isRecording ? '#ffffff' : '#00ff9d',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    recordingIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#ff4d4d',
      fontSize: '14px',
    },
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleSelectUser = (username) => {
    const newRecipients = recipientUsernames.includes(username)
      ? recipientUsernames.filter(u => u !== username)
      : [...recipientUsernames, username];
    updateFormData('recipientUsernames', newRecipients);
  };

  return (
    <>
      <div style={styles.container}>
        <form onSubmit={handleSubmit}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Music size={20} />
              Audio Details
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                style={recordingStyles.recordButton}
              >
                {isRecording ? <Square size={20} /> : <Mic size={20} />}
              </button>
              {isRecording && (
                <div style={recordingStyles.recordingIndicator}>
                  <span>Recording</span>
                  <span>{formatTime(recordingTime)}</span>
                </div>
              )}
            </div>
            <div
              style={styles.fileUpload}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !isRecording && document.getElementById('file-upload').click()}
            >
              <Upload size={32} style={{ color: '#00ff9d', marginBottom: '12px' }} />
              <div style={{ marginBottom: '8px', color: '#fff' }}>
                {file ? file.name : 'Drag and drop your audio file or click to browse'}
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                Supported formats: MP3, WAV, AAC
              </div>
              <input
                id="file-upload"
                type="file"
                accept="audio/*"
                onChange={(e) => updateFormData('file', e.target.files[0])}
                style={{ display: 'none' }}
              />
              {uploadProgress > 0 && (
                <div style={styles.progress}>
                  <div style={styles.progressBar} />
                </div>
              )}
            </div>

            <div style={styles.inputGroup}>
              <input
                type="text"
                value={title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="Enter title for your audio"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <MapPin size={20} />
              Location Settings
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Location <span style={{ color: '#ff4d4d' }}>*</span></label>
              <div style={styles.locationInputs}>
                <input
                  type="number"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude"
                  style={{ ...styles.input, ...styles.locationInput }}
                  step="any"
                  required
                />
                <input
                  type="number"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude"
                  style={{ ...styles.input, ...styles.locationInput }}
                  step="any"
                  required
                />
              </div>
              <input
                type="number"
                value={range}
                onChange={(e) => updateFormData('range', e.target.value)}
                placeholder="Enter range in meters"
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={handleSelectLocation}
                style={{
                  ...styles.locationButton,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#00ff9d',
                  border: '1px solid #00ff9d',
                }}
              >
                <MapPin size={20} />
                Use Map to Select Location
              </button>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Users size={20} />
              Share With
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Recipients</label>
              <div style={styles.dropdown}>
                <button
                  type="button"
                  onClick={toggleDropdown}
                  style={{
                    ...styles.input,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <span>
                    {recipientUsernames.length > 0
                      ? `${recipientUsernames.length} user(s) selected`
                      : 'Select recipients'}
                  </span>
                  <span style={styles.selectedCount}>
                    {recipientUsernames.length > 0 ? `(${recipientUsernames.length})` : ''}
                  </span>
                </button>
                {dropdownOpen && (
                  <div style={styles.dropdownList}>
                    {users.map((user, index) => (
                      <div
                        key={user._id || `user-${user.username}-${index}`}
                        onClick={() => handleSelectUser(user.username)}
                        style={{
                          ...styles.dropdownItem,
                          backgroundColor: recipientUsernames.includes(user.username)
                            ? 'rgba(0, 255, 157, 0.1)'
                            : 'transparent',
                          fontWeight: user.username === currentUsername ? '600' : 'normal', // Bold for current user
                        }}
                      >
                        {user.username === currentUsername ? 'Me' : user.username}
                        {recipientUsernames.includes(user.username) && (
                          <span style={{ color: '#00ff9d', marginLeft: '8px' }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Clock size={20} />
              Visibility Timing
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Hidden Until (Optional)</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => updateFormData('date', e.target.value)}
                  style={styles.dateTimeInput}
                />
                <div style={{ 
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}>
                  <Calendar size={20} style={{ color: '#00ff9d' }} />
                </div>
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => updateFormData('time', e.target.value)}
                  style={styles.dateTimeInput}
                />
                <div style={{ 
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}>
                  <Clock size={20} style={{ color: '#00ff9d' }} />
                </div>
              </div>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {message && <div style={styles.success}>{message}</div>}

          <button
            type="submit"
            disabled={loading || !file || !title || !range || recipientUsernames.length === 0 || !latitude || !longitude}
            style={{
              ...styles.button,
              ...((loading || !file || !title || !range || recipientUsernames.length === 0 || !latitude || !longitude) && styles.buttonDisabled)
            }}
          >
            {loading ? 'Uploading...' : 'Upload Audio'}
          </button>
        </form>
      </div>
      <style jsx global>{`
        /* Date and time picker styles */
        input[type="date"],
        input[type="time"] {
          color-scheme: dark;
        }

        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          opacity: 0; /* Hidden but functional */
          cursor: pointer;
          height: 100%;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
        }
      `}</style>
    </>
  );
};

export default AudioUploadForm;