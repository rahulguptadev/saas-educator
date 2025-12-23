import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { classService } from '../services/classService';
import { FiArrowLeft, FiVideo, FiVideoOff, FiPhone, FiPhoneOff, FiMic, FiMicOff } from 'react-icons/fi';
import './ClassRoom.css';

const ClassRoom = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const jitsiInitialized = useRef(false);

  useEffect(() => {
    // Reset initialization flag when classId changes
    jitsiInitialized.current = false;
    loadClassData();
    
    return () => {
      if (api) {
        try {
          api.dispose();
        } catch (error) {
          console.error('Error disposing Jitsi API:', error);
        }
        setApi(null);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Clear the container
      const container = document.getElementById('jitsi-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [classId]);

  const loadClassData = async () => {
    try {
      const response = await classService.getClass(classId);
      setClassData(response.class);
      initializeJitsi(response.class);
    } catch (error) {
      console.error('Error loading class:', error);
      alert('Failed to load class. Redirecting...');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const initializeJitsi = (classInfo) => {
    // Prevent multiple initializations
    if (jitsiInitialized.current) {
      return;
    }

    // Clear container first
    const container = document.getElementById('jitsi-container');
    if (container) {
      container.innerHTML = '';
    }

    // Wait for Jitsi API to load
    intervalRef.current = setInterval(() => {
      if (window.JitsiMeetExternalAPI && classInfo.jitsiRoomName && !jitsiInitialized.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        jitsiInitialized.current = true;
        
        const domain = 'meet.jit.si';
        const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
        
        const options = {
          roomName: classInfo.jitsiRoomName,
          parentNode: container,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            enableClosePage: false,
            prejoinPageEnabled: false, // Skip the join page
            disableDeepLinking: true,
            enableInsecureRoomNameWarning: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'settings', 'raisehand', 'videoquality', 'filmstrip',
              'invite', 'feedback', 'stats', 'shortcuts', 'tileview', 'download',
              'help', 'mute-everyone', 'security'
            ],
            SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile'],
            DEFAULT_BACKGROUND: '#667eea',
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            DISABLE_PRESENCE_STATUS: false,
          },
          userInfo: {
            displayName: user?.name || 'User',
            email: user?.email || '',
          },
        };

        try {
          const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
          setApi(jitsiApi);

          jitsiApi.addEventListener('videoConferenceJoined', () => {
            console.log('Joined conference');
          });

          jitsiApi.addEventListener('readyToClose', () => {
            navigate(-1);
          });

          jitsiApi.addEventListener('participantLeft', () => {
            console.log('Participant left');
          });

          jitsiApi.addEventListener('participantJoined', () => {
            console.log('Participant joined');
          });

          // Try to auto-join if prejoin page appears
          const autoJoin = () => {
            try {
              const joinButton = document.querySelector('[data-testid="prejoin.joinMeeting"]') ||
                                document.querySelector('button[aria-label*="Join meeting"]') ||
                                document.querySelector('.prejoin-preview-dropdown-container button[aria-label*="Join"]') ||
                                Array.from(document.querySelectorAll('button')).find(btn => 
                                  btn.textContent?.toLowerCase().includes('join meeting')
                                );
              if (joinButton) {
                joinButton.click();
                return true;
              }
            } catch (error) {
              console.log('Auto-join error:', error);
            }
            return false;
          };

          // Try auto-join after a delay
          setTimeout(() => {
            if (!autoJoin()) {
              // Try again after another delay
              setTimeout(autoJoin, 1000);
            }
          }, 1500);
        } catch (error) {
          console.error('Error initializing Jitsi:', error);
          jitsiInitialized.current = false;
          // Fallback: open in new tab
          window.open(classInfo.meetingLink, '_blank');
        }
      }
    }, 100);

    // Timeout after 5 seconds
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (!window.JitsiMeetExternalAPI && !jitsiInitialized.current) {
        // Fallback: redirect to Jitsi Meet
        window.open(classInfo.meetingLink, '_blank');
        navigate(-1);
      }
    }, 5000);
  };

  if (loading) {
    return (
      <Layout>
        <div className="spinner"></div>
      </Layout>
    );
  }

  if (!classData) {
    return (
      <Layout>
        <div className="error-message">Class not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="classroom-container">
        <div className="classroom-header">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back to Dashboard
          </button>
          <h2>{classData.title}</h2>
          <div className="classroom-info">
            <span>Room: {classData.jitsiRoomName}</span>
          </div>
        </div>
        <div id="jitsi-container" className="jitsi-container"></div>
      </div>
    </Layout>
  );
};

export default ClassRoom;

