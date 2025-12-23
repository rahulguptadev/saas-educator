import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { adminService } from '../services/adminService';
import { userService } from '../services/userService';
import { classService } from '../services/classService';
import { FiUsers, FiBook, FiCalendar, FiTrendingUp, FiPlus } from 'react-icons/fi';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUserRole, setCreateUserRole] = useState('teacher');
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'teacher'
  });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, teachersRes, studentsRes, classesRes] = await Promise.all([
        adminService.getStats(),
        userService.getTeachers(),
        userService.getStudents(),
        classService.getClasses()
      ]);

      setStats(statsRes.stats);
      setTeachers(teachersRes.teachers);
      setStudents(studentsRes.students);
      setClasses(classesRes.classes);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await adminService.toggleUserStatus(userId, !currentStatus);
      await loadData(); // Reload data after status change
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      const userData = {
        ...createFormData,
        role: createUserRole
      };
      await adminService.createUser(userData);
      setShowCreateModal(false);
      setCreateFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'teacher'
      });
      setCreateUserRole('teacher');
      await loadData(); // Reload data after creating user
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateFormChange = (e) => {
    setCreateFormData({
      ...createFormData,
      [e.target.name]: e.target.value
    });
    setCreateError('');
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
      <div className="dashboard">
        <h1 className="dashboard-title">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-info">
              <h3>{stats?.totalUsers || 0}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiBook />
            </div>
            <div className="stat-info">
              <h3>{stats?.totalTeachers || 0}</h3>
              <p>Teachers</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-info">
              <h3>{stats?.totalStudents || 0}</h3>
              <p>Students</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiCalendar />
            </div>
            <div className="stat-info">
              <h3>{stats?.upcomingClasses || 0}</h3>
              <p>Upcoming Classes</p>
            </div>
          </div>
        </div>

        {/* Teachers Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Teachers</h2>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setCreateUserRole('teacher');
                setShowCreateModal(true);
              }}
            >
              <FiPlus /> Add Teacher
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher._id}>
                    <td>{teacher.name}</td>
                    <td>{teacher.email}</td>
                    <td>{teacher.phone}</td>
                    <td>
                      <span className={`badge ${teacher.isActive ? 'badge-scheduled' : 'badge-cancelled'}`}>
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleToggleUserStatus(teacher._id, teacher.isActive)}
                      >
                        {teacher.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Students Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Students</h2>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setCreateUserRole('student');
                setShowCreateModal(true);
              }}
            >
              <FiPlus /> Add Student
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.name}</td>
                    <td>
                      <span className={`badge ${student.isActive ? 'badge-scheduled' : 'badge-cancelled'}`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleToggleUserStatus(student._id, student.isActive)}
                      >
                        {student.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Classes Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All Classes</h2>
          </div>
          <div className="classes-grid">
            {classes.map((classItem) => (
              <div key={classItem._id} className="class-card">
                <h3>{classItem.title}</h3>
                <p className="class-teacher">Teacher: {classItem.teacher?.name}</p>
                <p className="class-time">
                  {new Date(classItem.scheduledTime).toLocaleString()}
                </p>
                <p className="class-students">
                  {classItem.students?.length || 0} students
                </p>
                <span className={`badge badge-${classItem.status}`}>
                  {classItem.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New {createUserRole === 'teacher' ? 'Teacher' : 'Student'}</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
              </div>
              
              {createError && <div className="alert alert-error">{createError}</div>}

              <form onSubmit={handleCreateUser}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={createFormData.name}
                    onChange={handleCreateFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    value={createFormData.email}
                    onChange={handleCreateFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    value={createFormData.phone}
                    onChange={handleCreateFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-input"
                    value={createFormData.password}
                    onChange={handleCreateFormChange}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={createLoading}
                  >
                    {createLoading ? 'Creating...' : `Create ${createUserRole === 'teacher' ? 'Teacher' : 'Student'}`}
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

export default AdminDashboard;

