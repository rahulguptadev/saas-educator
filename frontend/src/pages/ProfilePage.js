import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { userService } from '../services/userService';
import { FiUser, FiMail, FiPhone, FiLock, FiEdit2, FiCheck, FiX, FiShield, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, login } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  
  // Change password states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userService.getProfile();
      setProfile(response.user);
      setEditForm({
        name: response.user.name || '',
        email: response.user.email || '',
        phone: response.user.phone || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
    setEditError('');
    setEditSuccess('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      const response = await userService.updateProfile(editForm);
      setProfile(response.user);
      setIsEditing(false);
      setEditSuccess('Profile updated successfully!');
      
      // Update the user in context/localStorage
      const token = localStorage.getItem('token');
      login(response.user, token);
      
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (error) {
      setEditError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || ''
    });
    setEditError('');
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);

    try {
      await userService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'teacher': return 'role-teacher';
      case 'student': return 'role-student';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="spinner"></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="profile-page">
        <div className="profile-header">
          <div className="profile-avatar">
            <FiUser />
          </div>
          <div className="profile-info">
            <h1>{profile?.name}</h1>
            <p className="profile-email">{profile?.email}</p>
            <span className={`role-badge ${getRoleBadgeClass(profile?.role)}`}>
              {profile?.role}
            </span>
          </div>
        </div>

        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser /> Profile Details
          </button>
          <button 
            className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FiShield /> Security
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Personal Information</h2>
                {!isEditing ? (
                  <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                    <FiEdit2 /> Edit Profile
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="btn btn-secondary" onClick={handleCancelEdit}>
                      <FiX /> Cancel
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleSaveProfile}
                      disabled={editLoading}
                    >
                      <FiCheck /> {editLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              {editError && <div className="alert alert-error">{editError}</div>}
              {editSuccess && <div className="alert alert-success">{editSuccess}</div>}

              {!isEditing ? (
                <div className="profile-details">
                  <div className="detail-item">
                    <div className="detail-icon">
                      <FiUser />
                    </div>
                    <div className="detail-content">
                      <label>Full Name</label>
                      <p>{profile?.name}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">
                      <FiMail />
                    </div>
                    <div className="detail-content">
                      <label>Email Address</label>
                      <p>{profile?.email}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">
                      <FiPhone />
                    </div>
                    <div className="detail-content">
                      <label>Phone Number</label>
                      <p>{profile?.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">
                      <FiShield />
                    </div>
                    <div className="detail-content">
                      <label>Role</label>
                      <p style={{ textTransform: 'capitalize' }}>{profile?.role}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">
                      <FiCalendar />
                    </div>
                    <div className="detail-content">
                      <label>Member Since</label>
                      <p>{profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM d, yyyy') : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="edit-form" onSubmit={handleSaveProfile}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={editForm.name}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={editForm.email}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Change Password</h2>
              </div>

              {passwordError && <div className="alert alert-error">{passwordError}</div>}
              {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}

              <form className="password-form" onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    className="form-input"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    className="form-input"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-input"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm your new password"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={passwordLoading}
                  >
                    <FiLock /> {passwordLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>

              <div className="security-tips">
                <h3>Password Tips</h3>
                <ul>
                  <li>Use at least 6 characters</li>
                  <li>Include uppercase and lowercase letters</li>
                  <li>Add numbers and special characters for extra security</li>
                  <li>Don't use easily guessable information</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;

