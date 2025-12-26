import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChatWidget from '../components/ChatWidget';
import { classService } from '../services/classService';
import { FiVideo, FiCalendar, FiUser, FiClock, FiUsers } from 'react-icons/fi';
import { format } from 'date-fns';
import './Dashboard.css';

const StudentDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPastClassesModal, setShowPastClassesModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await classService.getClasses();
      setClasses(response.classes);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = (classId) => {
    navigate(`/classroom/${classId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="spinner"></div>
      </Layout>
    );
  }

  const isClassActive = (classItem) => {
    if (classItem.status === 'completed' || classItem.status === 'cancelled') {
      return false;
    }
    const scheduledTime = new Date(classItem.scheduledTime);
    const duration = classItem.duration || 60;
    const startTime = new Date(scheduledTime.getTime() - 5 * 60000);
    const endTime = new Date(scheduledTime.getTime() + duration * 60000);
    const now = new Date();
    return now >= startTime && now < endTime;
  };

  const getClassStatus = (classItem) => {
    const scheduledTime = new Date(classItem.scheduledTime);
    const duration = classItem.duration || 60;
    const endTime = new Date(scheduledTime.getTime() + duration * 60000);
    const now = new Date();
    
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
          <h1 className="dashboard-title">My Classes</h1>
        </div>

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
                      {classItem.description && (
                        <p className="class-description">{classItem.description}</p>
                      )}
                      <div className="class-meta">
                        <p className="class-teacher">
                          <FiUser /> {classItem.teacher?.name}
                        </p>
                        <p className="class-time">
                          <FiCalendar /> {format(new Date(classItem.scheduledTime), 'MMM d, yyyy • h:mm a')}
                        </p>
                        <p className="class-time">
                          <FiClock /> {classItem.duration} minutes
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
                        <p className="class-teacher">
                          <FiUser /> {classItem.teacher?.name}
                        </p>
                        <p className="class-time">
                          <FiCalendar /> {format(new Date(classItem.scheduledTime), 'MMM d, yyyy • h:mm a')}
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
                            <span><FiUser /> {classItem.teacher?.name}</span>
                            <span><FiCalendar /> {format(new Date(classItem.scheduledTime), 'MMM d, yyyy • h:mm a')}</span>
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

export default StudentDashboard;
