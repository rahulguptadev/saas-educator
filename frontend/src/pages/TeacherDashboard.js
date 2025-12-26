import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChatWidget from '../components/ChatWidget';
import { classService } from '../services/classService';
import { groupService } from '../services/groupService';
import { FiPlus, FiVideo, FiCalendar, FiUsers, FiLayers } from 'react-icons/fi';
import { format } from 'date-fns';
import './Dashboard.css';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPastClassesModal, setShowPastClassesModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState('group'); // 'group' or 'students'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    duration: 60,
    studentIds: [],
    groupId: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesRes, studentsRes, groupsRes] = await Promise.all([
        classService.getClasses(),
        groupService.getMyStudents(),
        groupService.getGroups()
      ]);
      setClasses(classesRes.classes);
      setStudents(studentsRes.students || []);
      setGroups(groupsRes.groups || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleStudentSelect = (studentId) => {
    setFormData(prev => {
      const studentIds = prev.studentIds || [];
      if (studentIds.includes(studentId)) {
        return { ...prev, studentIds: studentIds.filter(id => id !== studentId) };
      } else {
        return { ...prev, studentIds: [...studentIds, studentId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert datetime-local string to ISO string
      // datetime-local format: "YYYY-MM-DDTHH:mm" (local time, no timezone)
      // new Date() interprets it as local time, toISOString() converts to UTC
      const classData = {
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        scheduledTime: formData.scheduledTime 
          ? new Date(formData.scheduledTime).toISOString()
          : formData.scheduledTime
      };

      // Add either groupId or studentIds based on selection mode
      if (selectionMode === 'group' && formData.groupId) {
        classData.groupId = formData.groupId;
      } else if (selectionMode === 'students') {
        classData.studentIds = formData.studentIds;
      }

      await classService.createClass(classData);
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        scheduledTime: '',
        duration: 60,
        studentIds: [],
        groupId: ''
      });
      setSelectionMode('group');
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create class');
    }
  };

  const handleJoinClass = (classId) => {
    navigate(`/classroom/${classId}`);
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await classService.deleteClass(classId);
        loadData();
      } catch (error) {
        alert('Failed to delete class');
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="spinner"></div>
      </Layout>
    );
  }

  // Calculate if class is still active (considering duration)
  // Allow joining 5 minutes before scheduled time and until end time
  const isClassActive = (classItem) => {
    if (classItem.status === 'completed' || classItem.status === 'cancelled') {
      return false;
    }
    const scheduledTime = new Date(classItem.scheduledTime);
    const duration = classItem.duration || 60; // duration in minutes
    const startTime = new Date(scheduledTime.getTime() - 5 * 60000); // 5 minutes before
    const endTime = new Date(scheduledTime.getTime() + duration * 60000); // Add duration in milliseconds
    const now = new Date();
    return now >= startTime && now < endTime;
  };

  // Helper to get class status and end time
  const getClassStatus = (classItem) => {
    const scheduledTime = new Date(classItem.scheduledTime);
    const duration = classItem.duration || 60;
    const endTime = new Date(scheduledTime.getTime() + duration * 60000);
    const now = new Date();
    const startTime = new Date(scheduledTime.getTime() - 5 * 60000);
    
    if (now < scheduledTime) {
      return { status: 'Starting soon', endTime };
    } else if (now >= scheduledTime && now < endTime) {
      return { status: 'In progress', endTime };
    }
    return { status: 'Ended', endTime };
  };

  const upcomingClasses = classes.filter(c => isClassActive(c));
  const pastClasses = classes.filter(c => !isClassActive(c));

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Teacher Dashboard</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus /> Create New Class
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          <div className="dashboard-main">
            {/* Active Classes */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <FiCalendar /> Active Classes ({upcomingClasses.length})
                </h2>
              </div>
              <div className="classes-grid">
                {upcomingClasses.length === 0 ? (
                  <p className="empty-state">No active classes at the moment</p>
                ) : (
                  upcomingClasses.map((classItem) => (
                    <div key={classItem._id} className="class-card">
                      <h3>{classItem.title}</h3>
                      {classItem.description && <p className="class-description">{classItem.description}</p>}
                      <div className="class-meta">
                        <p className="class-time">
                          <FiCalendar /> {format(new Date(classItem.scheduledTime), 'MMM d, yyyy • h:mm a')}
                        </p>
                        <p className="class-students">
                          <FiUsers /> {classItem.students?.length || 0} students enrolled
                        </p>
                      </div>
                      <div className="class-status">
                        <span className={`badge ${getClassStatus(classItem).status === 'In progress' ? 'badge-ongoing' : 'badge-scheduled'}`}>
                          {getClassStatus(classItem).status}
                        </span>
                      </div>
                      <div className="class-actions">
                        <button className="btn btn-primary" onClick={() => handleJoinClass(classItem._id)}>
                          <FiVideo /> Join Class
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDeleteClass(classItem._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Past Classes */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Past Classes ({pastClasses.length})</h2>
              </div>
              <div className="classes-grid">
                {pastClasses.length === 0 ? (
                  <p className="empty-state">No past classes</p>
                ) : (
                  pastClasses.slice(0, 6).map((classItem) => (
                    <div key={classItem._id} className="class-card class-card-past">
                      <h3>{classItem.title}</h3>
                      <div className="class-meta">
                        <p className="class-time">
                          <FiCalendar /> {format(new Date(classItem.scheduledTime), 'MMM d, yyyy • h:mm a')}
                        </p>
                        <p className="class-students">
                          <FiUsers /> {classItem.students?.length || 0} students attended
                        </p>
                        <p className="class-duration">
                          Duration: {classItem.duration || 60} mins
                        </p>
                      </div>
                      <div className="class-status">
                        <span className="badge badge-completed">
                          COMPLETED
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {pastClasses.length > 6 && (
                <div className="view-more">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowPastClassesModal(true)}>
                    View All Past Classes ({pastClasses.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="dashboard-sidebar">
            <ChatWidget limit={5} />
          </div>
        </div>

        {/* Create Class Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Class</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Class Title</label>
                    <input
                      type="text"
                      name="title"
                      className="form-input"
                      placeholder="Enter class title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-textarea"
                      placeholder="Enter class description (optional)"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Scheduled Time</label>
                    <input
                      type="datetime-local"
                      name="scheduledTime"
                      className="form-input"
                      value={formData.scheduledTime}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration (minutes)</label>
                    <input
                      type="number"
                      name="duration"
                      className="form-input"
                      placeholder="60"
                      value={formData.duration}
                      onChange={handleChange}
                      min="15"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Add Participants</label>
                    <div className="selection-mode-toggle">
                      <button 
                        type="button"
                        className={`toggle-btn ${selectionMode === 'group' ? 'active' : ''}`}
                        onClick={() => setSelectionMode('group')}
                      >
                        <FiLayers /> Select Group
                      </button>
                      <button 
                        type="button"
                        className={`toggle-btn ${selectionMode === 'students' ? 'active' : ''}`}
                        onClick={() => setSelectionMode('students')}
                      >
                        <FiUsers /> Select Students
                      </button>
                    </div>
                  </div>

                  {selectionMode === 'group' ? (
                    <div className="form-group">
                      <label className="form-label">Select Group</label>
                      <select
                        name="groupId"
                        className="form-input"
                        value={formData.groupId}
                        onChange={handleChange}
                      >
                        <option value="">-- Select a Group --</option>
                        {groups.filter(g => g.isActive).map((group) => (
                          <option key={group._id} value={group._id}>
                            {group.name} ({group.students?.length || 0} students)
                          </option>
                        ))}
                      </select>
                      {groups.length === 0 && (
                        <small className="form-hint">
                          No groups assigned to you. Contact admin to create groups.
                        </small>
                      )}
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Select Students</label>
                      <div className="student-select">
                        {students.length === 0 ? (
                          <p style={{ padding: '16px', color: 'var(--gray-500)', textAlign: 'center' }}>
                            No students in your groups. Contact admin to add students to your groups.
                          </p>
                        ) : (
                          students.map((student) => (
                            <label key={student._id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={formData.studentIds?.includes(student._id)}
                                onChange={() => handleStudentSelect(student._id)}
                              />
                              <span>{student.name}</span>
                              {student.grade && <small className="student-grade">{student.grade}</small>}
                            </label>
                          ))
                        )}
                      </div>
                      <small className="form-hint">
                        Selected: {formData.studentIds?.length || 0} students
                      </small>
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Past Classes Modal */}
        {showPastClassesModal && (
          <div className="modal-overlay" onClick={() => setShowPastClassesModal(false)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Past Classes ({pastClasses.length})</h2>
                <button className="modal-close" onClick={() => setShowPastClassesModal(false)}>×</button>
              </div>
              <div className="modal-body modal-body-scroll">
                {pastClasses.length === 0 ? (
                  <p className="empty-state">No past classes</p>
                ) : (
                  <div className="past-classes-list">
                    {pastClasses.map((classItem) => (
                      <div key={classItem._id} className="past-class-item">
                        <div className="past-class-info">
                          <h4>{classItem.title}</h4>
                          <div className="past-class-meta">
                            <span><FiCalendar /> {format(new Date(classItem.scheduledTime), 'MMM d, yyyy • h:mm a')}</span>
                            <span><FiUsers /> {classItem.students?.length || 0} students</span>
                            <span>Duration: {classItem.duration || 60} mins</span>
                          </div>
                        </div>
                        <span className="badge badge-completed">COMPLETED</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowPastClassesModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherDashboard;

