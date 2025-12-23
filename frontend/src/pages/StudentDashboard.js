import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { classService } from '../services/classService';
import { FiVideo, FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import './Dashboard.css';

const StudentDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
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
        <h1 className="dashboard-title">My Classes</h1>

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
                  {classItem.description && (
                    <p className="class-description">{classItem.description}</p>
                  )}
                  <p className="class-teacher">
                    <FiUser /> Teacher: {classItem.teacher?.name}
                  </p>
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
                  <p className="class-duration">Duration: {classItem.duration} minutes</p>
                  <div className="class-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleJoinClass(classItem._id)}
                    >
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
            <h2 className="card-title">Past Classes</h2>
          </div>
          <div className="classes-grid">
            {pastClasses.length === 0 ? (
              <p className="empty-state">No past classes</p>
            ) : (
              pastClasses.map((classItem) => (
                <div key={classItem._id} className="class-card">
                  <h3>{classItem.title}</h3>
                  <p className="class-teacher">
                    Teacher: {classItem.teacher?.name}
                  </p>
                  <p className="class-time">
                    {format(new Date(classItem.scheduledTime), 'PPpp')}
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
    </Layout>
  );
};

export default StudentDashboard;

