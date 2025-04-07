'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Users, UserPlus, Clock, XCircle, Search, Check, X } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    username: '',
    followers: [],
    following: []
  });
  const [activeTab, setActiveTab] = useState('following');
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showPendingRequests, setShowPendingRequests] = useState(false);

  useEffect(() => {
    fetchProfileData();
    fetchPendingRequests();
  }, []);

  const fetchProfileData = async () => {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');

    try {
      const [followersRes, followingRes] = await Promise.all([
        axios.get('https://echo-trails-backend.vercel.app/users/followers', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('https://echo-trails-backend.vercel.app/users/following', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setProfile({
        username: username,
        followers: followersRes.data,
        following: followingRes.data
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        'https://echo-trails-backend.vercel.app/users/follow/requests/pending',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const handleUnfollow = async (username) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `https://echo-trails-backend.vercel.app/users/unfollow/${username}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      // Update the following list
      setProfile(prev => ({
        ...prev,
        following: prev.following.filter(user => user.username !== username)
      }));
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handleRemoveFollower = async (username) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        // Changed endpoint path to match backend route
        `https://echo-trails-backend.vercel.app/users/followers/remove/${username}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      // Update the followers list
      setProfile(prev => ({
        ...prev,
        followers: prev.followers.filter(user => user.username !== username)
      }));
    } catch (error) {
      console.error('Error removing follower:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('https://echo-trails-backend.vercel.app/users/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleFollowRequest = async (username) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      await axios.post(
        `https://echo-trails-backend.vercel.app/users/follow/request/${username}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      // Update UI to show request sent
      setAllUsers(prev => 
        prev.map(user => 
          user.username === username 
            ? { ...user, requestSent: true }
            : user
        )
      );
    } catch (error) {
      console.error('Error sending follow request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `https://echo-trails-backend.vercel.app/users/follow/accept/${requesterId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setPendingRequests(prev => prev.filter(req => req.id !== requesterId));
      // Refresh followers list
      fetchProfileData();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const filteredUsers = allUsers.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    user.username !== profile.username &&
    !profile.following.some(f => f.username === user.username)
  );

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '40px 20px',
    },
    content: {
      maxWidth: '800px',
      margin: '0 auto',
    },
    profileHeader: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '24px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    username: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#00ff9d',
      marginBottom: '8px',
    },
    stats: {
      display: 'flex',
      gap: '24px',
      marginTop: '16px',
    },
    stat: {
      textAlign: 'center',
    },
    statNumber: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#00ff9d',
    },
    statLabel: {
      fontSize: '14px',
      color: '#888',
    },
    tabs: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
    },
    tab: {
      padding: '12px 24px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    activeTab: {
      backgroundColor: 'rgba(0, 255, 157, 0.1)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#00ff9d',
      color: '#00ff9d',
    },
    userList: {
      display: 'grid',
      gap: '12px',
    },
    userCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#00ff9d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#000',
      fontWeight: '600',
    },
    actionLinks: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    },
    actionLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      color: '#fff',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
    },
    removeButton: {
      backgroundColor: 'rgba(255, 77, 77, 0.1)',
      border: 'none',
      padding: '8px',
      borderRadius: '50%',
      cursor: 'pointer',
      color: '#ff4d4d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(255, 77, 77, 0.2)',
      }
    },
    searchOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchContainer: {
      width: '90%',
      maxWidth: '500px',
      backgroundColor: '#111111',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    searchHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '16px',
      marginBottom: '16px',
    },
    userItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    followButton: {
      padding: '8px 16px',
      backgroundColor: '#00ff9d',
      color: '#000000',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
    },
    followButtonSent: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#00ff9d',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: '500px',
      backgroundColor: '#111111',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      color: '#00ff9d',
      fontSize: '20px',
      fontWeight: '600',
    },
    requestCard: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      marginBottom: '12px',
    },
    requestActions: {
      display: 'flex',
      gap: '8px',
    },
    acceptButton: {
      padding: '8px',
      borderRadius: '50%',
      backgroundColor: 'rgba(0, 255, 157, 0.1)',
      border: 'none',
      color: '#00ff9d',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rejectButton: {
      padding: '8px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 77, 77, 0.1)',
      border: 'none',
      color: '#ff4d4d',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.profileHeader}>
            <h1 style={styles.username}>{profile.username}</h1>
            <div style={styles.stats}>
              <div style={styles.stat}>
                <div style={styles.statNumber}>{profile.following.length}</div>
                <div style={styles.statLabel}>Following</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statNumber}>{profile.followers.length}</div>
                <div style={styles.statLabel}>Followers</div>
              </div>
            </div>
            <div style={styles.actionLinks}>
              <button
                onClick={() => {
                  setShowUserSearch(true);
                  fetchAllUsers();
                }}
                style={styles.actionLink}
              >
                <UserPlus size={18} />
                Find People
              </button>
              <button 
                onClick={() => setShowPendingRequests(true)} 
                style={{
                  ...styles.actionLink,
                  position: 'relative',
                }}
              >
                <Clock size={18} />
                Pending Requests
                {pendingRequests.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#00ff9d',
                    color: '#000',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div style={styles.tabs}>
            <div 
              style={{
                ...styles.tab,
                ...(activeTab === 'following' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('following')}
            >
              Following
            </div>
            <div 
              style={{
                ...styles.tab,
                ...(activeTab === 'followers' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('followers')}
            >
              Followers
            </div>
          </div>

          <div style={styles.userList}>
            {activeTab === 'following' ? (
              profile.following.map((user, index) => (
                <div key={user._id || `following-${index}`} style={styles.userCard}>
                  <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>{user.username}</div>
                  </div>
                  <button
                    onClick={() => handleUnfollow(user.username)}
                    style={styles.removeButton}
                    title="Unfollow"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              ))
            ) : (
              profile.followers.map((user, index) => (
                <div key={user._id || `follower-${index}`} style={styles.userCard}>
                  <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>{user.username}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveFollower(user.username)}
                    style={styles.removeButton}
                    title="Remove follower"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showUserSearch && (
        <div style={styles.searchOverlay} onClick={() => setShowUserSearch(false)}>
          <div style={styles.searchContainer} onClick={e => e.stopPropagation()}>
            <div style={styles.searchHeader}>
              <h3 style={{ color: '#00ff9d', margin: 0 }}>Find People</h3>
              <button
                onClick={() => setShowUserSearch(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <Search 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#666'
                }} 
              />
            </div>

            <div style={styles.userList}>
              {filteredUsers.map(user => (
                <div key={user.id} style={styles.userItem}>
                  <span style={{ color: '#fff' }}>{user.username}</span>
                  <button
                    onClick={() => handleFollowRequest(user.username)}
                    disabled={user.requestSent || isLoading}
                    style={{
                      ...styles.followButton,
                      ...(user.requestSent ? styles.followButtonSent : {})
                    }}
                  >
                    {user.requestSent ? 'Request Sent' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests Modal */}
      {showPendingRequests && (
        <div style={styles.modalOverlay} onClick={() => setShowPendingRequests(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span>Pending Follow Requests</span>
              <button
                onClick={() => setShowPendingRequests(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            {pendingRequests.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                No pending requests
              </div>
            ) : (
              pendingRequests.map(request => (
                <div key={request.id} style={styles.requestCard}>
                  <div style={{ color: '#fff' }}>{request.username}</div>
                  <div style={styles.requestActions}>
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      style={styles.acceptButton}
                      title="Accept"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => {/* Implement reject handler */}}
                      style={styles.rejectButton}
                      title="Reject"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
