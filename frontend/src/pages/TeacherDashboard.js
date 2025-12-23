import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChatWidget from '../components/ChatWidget';
import { classService } from '../services/classService';
import { userService } from '../services/userService';
import { FiPlus, FiVideo, FiCalendar, FiUsers } from 'react-icons/fi';
import { format } from 'date-fns';
import './Dashboard.css';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    duration: 60,
    studentIds: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        classService.getClasses(),
        userService.getStudents()
      ]);
      setClasses(classesRes.classes);
      setStudents(studentsRes.students);
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
      await classService.createClass(formData);
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        scheduledTime: '',
        duration: 60,
        studentIds: []
      });
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
              <p className="empty-state">No active classes</p>
            ) : (
              upcomingClasses.map((classItem) => (
                <div key={classItem._id} className="class-card">
                  <h3>{classItem.title}</h3>
                  {classItem.description && <p className="class-description">{classItem.description}</p>}
                  <p className="class-time">
                    <FiCalendar /> Starts: {format(new Date(classItem.scheduledTime), 'PPpp')}
                  </p>
                  <p className="class-time">
                    Ends: {format(getClassStatus(classItem).endTime, 'PPpp')}
                  </p>
                  <p className="class-status">
                    <span className={`badge ${getClassStatus(classItem).status === 'In progress' ? 'badge-ongoing' : 'badge-scheduled'}`}>
                      {getClassStatus(classItem).status}
                    </span>
                  </p>
                  <p className="class-students">
                    <FiUsers /> {classItem.students?.length || 0} students
                  </p>
                  <div className="class-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleJoinClass(classItem._id)}
                    >
                      <FiVideo /> Join Class
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteClass(classItem._id)}
                    >
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
            <h2 className="card-title">Past Classes</h2>
          </div>
          <div className="classes-grid">
            {pastClasses.length === 0 ? (
              <p className="empty-state">No past classes</p>
            ) : (
              pastClasses.map((classItem) => (
                <div key={classItem._id} className="class-card">
                  <h3>{classItem.title}</h3>
                  <p className="class-time">
                    {format(new Date(classItem.scheduledTime), 'PPpp')}
                  </p>
                  <p className="class-students">
                    {classItem.students?.length || 0} students
                  </p>
                  <span className={`badge badge-${classItem.status}`}>
                    {classItem.status}
                  </span>
                </div>
              ))
            )}
          </div>
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
                <div className="form-group">
                  <label className="form-label">Class Title</label>
                  <input
                    type="text"
                    name="title"
                    className="form-input"
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
                    value={formData.duration}
                    onChange={handleChange}
                    min="15"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Students</label>
                  <div className="student-select">
                    {students.map((student) => (
                      <label key={student._id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.studentIds?.includes(student._id)}
                          onChange={() => handleStudentSelect(student._id)}
                        />
                        <span>{student.name}</span>
                      </label>
                    ))}
                  </div>
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
      </div>
    </Layout>
  );
};

export default TeacherDashboard;

