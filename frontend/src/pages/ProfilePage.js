import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { userService } from '../services/userService';
import { 
  FiUser, FiMail, FiPhone, FiLock, FiEdit2, FiCheck, FiX, FiShield, 
  FiCalendar, FiBook, FiHome, FiUsers, FiPlus, FiTrash2, FiAward
} from 'react-icons/fi';
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
    phone: '',
    // Student fields
    grade: '',
    school: '',
    fatherName: '',
    fatherContact: '',
    motherName: '',
    motherContact: '',
    enrolledSubjects: [],
    // Teacher fields
    specialization: '',
    qualification: ''
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

  // Grade options
  const gradeOptions = [
    '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th',
    '1st (Other)', '2nd (Other)', '3rd (Other)', '4th (Other)', '5th (Other)'
  ];

  // Subject options
  const subjectOptions = [
    'Maths', 'Science', 'English', 'Hindi', 'Social Studies', 'Physics', 
    'Chemistry', 'Biology', 'Computer Science', 'Economics', 'Accountancy'
  ];

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
        phone: response.user.phone || '',
        grade: response.user.grade || '',
        school: response.user.school || '',
        fatherName: response.user.fatherName || '',
        fatherContact: response.user.fatherContact || '',
        motherName: response.user.motherName || '',
        motherContact: response.user.motherContact || '',
        enrolledSubjects: response.user.enrolledSubjects || [],
        specialization: response.user.specialization || '',
        qualification: response.user.qualification || ''
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

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...editForm.enrolledSubjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setEditForm({ ...editForm, enrolledSubjects: updatedSubjects });
  };

  const addSubject = () => {
    setEditForm({
      ...editForm,
      enrolledSubjects: [...editForm.enrolledSubjects, { subject: '', classes: 0, fees: 0 }]
    });
  };

  const removeSubject = (index) => {
    const updatedSubjects = editForm.enrolledSubjects.filter((_, i) => i !== index);
    setEditForm({ ...editForm, enrolledSubjects: updatedSubjects });
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
      phone: profile?.phone || '',
      grade: profile?.grade || '',
      school: profile?.school || '',
      fatherName: profile?.fatherName || '',
      fatherContact: profile?.fatherContact || '',
      motherName: profile?.motherName || '',
      motherContact: profile?.motherContact || '',
      enrolledSubjects: profile?.enrolledSubjects || [],
      specialization: profile?.specialization || '',
      qualification: profile?.qualification || ''
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
                <h2>{isEditing ? 'Edit Profile' : 'Personal Information'}</h2>
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
                // View Mode
                <div className="profile-view">
                  {/* Basic Information */}
                  <div className="info-section">
                    <h3 className="info-section-title">
                      {profile?.role === 'student' ? 'Student Information' : 
                       profile?.role === 'teacher' ? 'Teacher Information' : 'Basic Information'}
                    </h3>
                    <div className="profile-details">
                      <div className="detail-item">
                        <div className="detail-icon"><FiUser /></div>
                        <div className="detail-content">
                          <label>Full Name</label>
                          <p>{profile?.name}</p>
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-icon"><FiMail /></div>
                        <div className="detail-content">
                          <label>Email Address</label>
                          <p>{profile?.email}</p>
                        </div>
                      </div>

                      {profile?.role === 'student' && (
                        <>
                          <div className="detail-row">
                            <div className="detail-item">
                              <div className="detail-icon"><FiBook /></div>
                              <div className="detail-content">
                                <label>Grade</label>
                                <p>{profile?.grade || 'Not specified'}</p>
                              </div>
                            </div>
                            <div className="detail-item">
                              <div className="detail-icon"><FiHome /></div>
                              <div className="detail-content">
                                <label>School</label>
                                <p>{profile?.school || 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {profile?.role === 'teacher' && (
                        <>
                          <div className="detail-item">
                            <div className="detail-icon"><FiBook /></div>
                            <div className="detail-content">
                              <label>Specialization</label>
                              <p>{profile?.specialization || 'Not specified'}</p>
                            </div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-icon"><FiAward /></div>
                            <div className="detail-content">
                              <label>Qualification</label>
                              <p>{profile?.qualification || 'Not specified'}</p>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="detail-item">
                        <div className="detail-icon"><FiPhone /></div>
                        <div className="detail-content">
                          <label>Mobile Number</label>
                          <p>{profile?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parent Information (Students only) */}
                  {profile?.role === 'student' && (
                    <div className="info-section">
                      <h3 className="info-section-title">Parent Information</h3>
                      <div className="profile-details">
                        <div className="detail-row">
                          <div className="detail-item">
                            <div className="detail-icon"><FiUsers /></div>
                            <div className="detail-content">
                              <label>Father's Name</label>
                              <p>{profile?.fatherName || 'Not provided'}</p>
                            </div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-icon"><FiPhone /></div>
                            <div className="detail-content">
                              <label>Father's Contact</label>
                              <p>{profile?.fatherContact || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="detail-row">
                          <div className="detail-item">
                            <div className="detail-icon"><FiUsers /></div>
                            <div className="detail-content">
                              <label>Mother's Name</label>
                              <p>{profile?.motherName || 'Not provided'}</p>
                            </div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-icon"><FiPhone /></div>
                            <div className="detail-content">
                              <label>Mother's Contact</label>
                              <p>{profile?.motherContact || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enrolled Subjects (Students only) */}
                  {profile?.role === 'student' && (
                    <div className="info-section">
                      <h3 className="info-section-title">Enrolled Subjects</h3>
                      {profile?.enrolledSubjects?.length > 0 ? (
                        <div className="subjects-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Subject</th>
                                <th>Classes</th>
                                <th>Fees</th>
                              </tr>
                            </thead>
                            <tbody>
                              {profile.enrolledSubjects.map((subj, idx) => (
                                <tr key={idx}>
                                  <td>{subj.subject}</td>
                                  <td>{subj.classes}</td>
                                  <td>₹{subj.fees?.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="no-data">No subjects enrolled yet</p>
                      )}
                    </div>
                  )}

                  {/* Account Info */}
                  <div className="info-section">
                    <h3 className="info-section-title">Account Information</h3>
                    <div className="profile-details">
                      <div className="detail-item">
                        <div className="detail-icon"><FiShield /></div>
                        <div className="detail-content">
                          <label>Role</label>
                          <p style={{ textTransform: 'capitalize' }}>{profile?.role}</p>
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-icon"><FiCalendar /></div>
                        <div className="detail-content">
                          <label>Member Since</label>
                          <p>{profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM d, yyyy') : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form className="edit-form" onSubmit={handleSaveProfile}>
                  {/* Student Information Section */}
                  <div className="form-section">
                    <h3 className="form-section-title">
                      {profile?.role === 'student' ? 'Student Information' : 
                       profile?.role === 'teacher' ? 'Teacher Information' : 'Basic Information'}
                    </h3>
                    
                    <div className="form-group">
                      <label className="form-label">Name</label>
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
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        className="form-input"
                        value={editForm.email}
                        onChange={handleEditChange}
                        required
                      />
                    </div>

                    {profile?.role === 'student' && (
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Grade</label>
                          <select
                            name="grade"
                            className="form-input"
                            value={editForm.grade}
                            onChange={handleEditChange}
                          >
                            <option value="">Select Grade</option>
                            {gradeOptions.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">School</label>
                          <input
                            type="text"
                            name="school"
                            className="form-input"
                            placeholder="School name"
                            value={editForm.school}
                            onChange={handleEditChange}
                          />
                        </div>
                      </div>
                    )}

                    {profile?.role === 'teacher' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Specialization</label>
                          <input
                            type="text"
                            name="specialization"
                            className="form-input"
                            placeholder="e.g. Mathematics, Science"
                            value={editForm.specialization}
                            onChange={handleEditChange}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Qualification</label>
                          <input
                            type="text"
                            name="qualification"
                            className="form-input"
                            placeholder="e.g. M.Sc, B.Ed"
                            value={editForm.qualification}
                            onChange={handleEditChange}
                          />
                        </div>
                      </>
                    )}

                    <div className="form-group">
                      <label className="form-label">Mobile Number</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-input"
                        placeholder="+1(480)5696714"
                        value={editForm.phone}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  {/* Parent Information (Students only) */}
                  {profile?.role === 'student' && (
                    <div className="form-section">
                      <h3 className="form-section-title">Parent Information</h3>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Father's Name</label>
                          <input
                            type="text"
                            name="fatherName"
                            className="form-input"
                            placeholder="Father's full name"
                            value={editForm.fatherName}
                            onChange={handleEditChange}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Father's Contact</label>
                          <input
                            type="tel"
                            name="fatherContact"
                            className="form-input"
                            placeholder="+1(480)569-6714"
                            value={editForm.fatherContact}
                            onChange={handleEditChange}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Mother's Name</label>
                          <input
                            type="text"
                            name="motherName"
                            className="form-input"
                            placeholder="Mother's full name"
                            value={editForm.motherName}
                            onChange={handleEditChange}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Mother's Contact</label>
                          <input
                            type="tel"
                            name="motherContact"
                            className="form-input"
                            placeholder="+1234567890"
                            value={editForm.motherContact}
                            onChange={handleEditChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enrolled Subjects (Students only) */}
                  {profile?.role === 'student' && (
                    <div className="form-section">
                      <h3 className="form-section-title">
                        Enrolled Subjects
                        <button type="button" className="btn btn-sm btn-secondary" onClick={addSubject}>
                          <FiPlus /> Add Subject
                        </button>
                      </h3>
                      
                      {editForm.enrolledSubjects.length > 0 ? (
                        <div className="subjects-edit-list">
                          {editForm.enrolledSubjects.map((subj, idx) => (
                            <div key={idx} className="subject-edit-row">
                              <div className="form-group">
                                <label className="form-label">Subject</label>
                                <select
                                  className="form-input"
                                  value={subj.subject}
                                  onChange={(e) => handleSubjectChange(idx, 'subject', e.target.value)}
                                >
                                  <option value="">Select Subject</option>
                                  {subjectOptions.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-group">
                                <label className="form-label">Classes</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={subj.classes}
                                  onChange={(e) => handleSubjectChange(idx, 'classes', parseInt(e.target.value) || 0)}
                                  min="0"
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Fees (₹)</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={subj.fees}
                                  onChange={(e) => handleSubjectChange(idx, 'fees', parseInt(e.target.value) || 0)}
                                  min="0"
                                />
                              </div>
                              <button 
                                type="button" 
                                className="btn-remove-subject"
                                onClick={() => removeSubject(idx)}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">No subjects added. Click "Add Subject" to add one.</p>
                      )}
                    </div>
                  )}
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
