import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { adminService } from '../services/adminService';
import { userService } from '../services/userService';
import { classService } from '../services/classService';
import { 
  FiUsers, FiBook, FiCalendar, FiPlus, FiVideo, FiMessageCircle,
  FiSearch, FiFilter, FiDownload, FiUpload, FiX, FiCheck, FiAlertCircle,
  FiUserCheck, FiBookOpen
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import './Dashboard.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('teachers');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');
  
  // Filter states
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  
  // Import/Export states
  const [importType, setImportType] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // Create user states
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

  // Filter functions
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
                          teacher.email.toLowerCase().includes(teacherSearch.toLowerCase());
    const matchesFilter = teacherFilter === 'all' || 
                          (teacherFilter === 'active' && teacher.isActive) ||
                          (teacherFilter === 'inactive' && !teacher.isActive);
    return matchesSearch && matchesFilter;
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          (student.email && student.email.toLowerCase().includes(studentSearch.toLowerCase()));
    const matchesFilter = studentFilter === 'all' || 
                          (studentFilter === 'active' && student.isActive) ||
                          (studentFilter === 'inactive' && !student.isActive);
    return matchesSearch && matchesFilter;
  });

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.title.toLowerCase().includes(classSearch.toLowerCase()) ||
                          classItem.teacher?.name.toLowerCase().includes(classSearch.toLowerCase());
    const matchesFilter = classFilter === 'all' || classItem.status === classFilter;
    return matchesSearch && matchesFilter;
  });

  // Export functions
  const exportToCSV = (data, filename, type) => {
    let csvContent = '';
    
    if (type === 'teachers' || type === 'students') {
      csvContent = 'Name,Email,Phone,Status\n';
      data.forEach(user => {
        csvContent += `"${user.name}","${user.email || ''}","${user.phone || ''}","${user.isActive ? 'Active' : 'Inactive'}"\n`;
      });
    } else if (type === 'classes') {
      csvContent = 'Title,Teacher,Scheduled Time,Duration,Students,Status\n';
      data.forEach(classItem => {
        csvContent += `"${classItem.title}","${classItem.teacher?.name || ''}","${format(new Date(classItem.scheduledTime), 'yyyy-MM-dd HH:mm')}","${classItem.duration}","${classItem.students?.length || 0}","${classItem.status}"\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Import functions
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    const data = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      if (!values) continue;
      
      const row = {};
      values.forEach((val, idx) => {
        row[headers[idx]] = val.replace(/"/g, '').trim();
      });
      
      if (importType === 'teachers' || importType === 'students') {
        if (!row.name || !row.email) {
          errors.push(`Row ${i}: Missing required fields (name, email)`);
        } else {
          data.push({
            name: row.name,
            email: row.email,
            phone: row.phone || '',
            password: row.password || 'password123',
            role: importType === 'teachers' ? 'teacher' : 'student'
          });
        }
      }
    }
    
    setImportData(data);
    setImportErrors(errors);
  };

  const handleImport = async () => {
    if (importData.length === 0) return;
    
    setImportLoading(true);
    const results = { success: 0, failed: 0, errors: [] };
    
    for (const user of importData) {
      try {
        await adminService.createUser(user);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${user.email}: ${error.response?.data?.message || 'Failed'}`);
      }
    }
    
    setImportLoading(false);
    setImportSuccess(true);
    setImportErrors(results.errors);
    
    if (results.success > 0) {
      await loadData();
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await adminService.toggleUserStatus(userId, !currentStatus);
      await loadData();
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
      await loadData();
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

  const handleJoinClass = (classId) => {
    navigate(`/classroom/${classId}`);
  };

  const openImportModal = (type) => {
    setImportType(type);
    setShowImportModal(true);
    setImportData([]);
    setImportErrors([]);
    setImportSuccess(false);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportType('');
    setImportData([]);
    setImportErrors([]);
    setImportSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      <div className="dashboard admin-dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/chats')}
          >
            <FiMessageCircle /> View All Chats
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card" onClick={() => setActiveTab('teachers')}>
            <div className="stat-icon">
              <FiUserCheck />
            </div>
            <div className="stat-info">
              <h3>{stats?.totalTeachers || 0}</h3>
              <p>Teachers</p>
            </div>
          </div>

          <div className="stat-card" onClick={() => setActiveTab('students')}>
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-info">
              <h3>{stats?.totalStudents || 0}</h3>
              <p>Students</p>
            </div>
          </div>

          <div className="stat-card" onClick={() => setActiveTab('classes')}>
            <div className="stat-icon">
              <FiBookOpen />
            </div>
            <div className="stat-info">
              <h3>{classes.length}</h3>
              <p>Total Classes</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiCalendar />
            </div>
            <div className="stat-info">
              <h3>{stats?.upcomingClasses || 0}</h3>
              <p>Upcoming</p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="tabs-container">
          <div className="tabs-nav">
            <button 
              className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              <FiUserCheck />
              <span>Teachers</span>
              <span className="tab-count">{teachers.length}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <FiUsers />
              <span>Students</span>
              <span className="tab-count">{students.length}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('classes')}
            >
              <FiBookOpen />
              <span>Classes</span>
              <span className="tab-count">{classes.length}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Teachers Tab */}
            {activeTab === 'teachers' && (
              <div className="tab-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <h2>Teachers Management</h2>
                    <p>Manage all teachers in the system</p>
                  </div>
                  <div className="panel-actions">
                    <button className="btn btn-secondary" onClick={() => openImportModal('teachers')}>
                      <FiUpload /> Import
                    </button>
                    <button className="btn btn-secondary" onClick={() => exportToCSV(filteredTeachers, 'teachers', 'teachers')}>
                      <FiDownload /> Export
                    </button>
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
                </div>
                
                <div className="table-toolbar">
                  <div className="search-box">
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                    />
                    {teacherSearch && (
                      <button className="clear-search" onClick={() => setTeacherSearch('')}>
                        <FiX />
                      </button>
                    )}
                  </div>
                  <div className="filter-box">
                    <FiFilter />
                    <select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="results-count">
                    Showing {filteredTeachers.length} of {teachers.length}
                  </div>
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
                      {filteredTeachers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-table">
                            <FiUsers className="empty-icon" />
                            <p>No teachers found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredTeachers.map((teacher) => (
                          <tr key={teacher._id}>
                            <td className="td-name">{teacher.name}</td>
                            <td>{teacher.email}</td>
                            <td>{teacher.phone || '-'}</td>
                            <td>
                              <span className={`badge ${teacher.isActive ? 'badge-ongoing' : 'badge-cancelled'}`}>
                                {teacher.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <button
                                className={`btn btn-sm ${teacher.isActive ? 'btn-danger' : 'btn-success'}`}
                                onClick={() => handleToggleUserStatus(teacher._id, teacher.isActive)}
                              >
                                {teacher.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="tab-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <h2>Students Management</h2>
                    <p>Manage all students in the system</p>
                  </div>
                  <div className="panel-actions">
                    <button className="btn btn-secondary" onClick={() => openImportModal('students')}>
                      <FiUpload /> Import
                    </button>
                    <button className="btn btn-secondary" onClick={() => exportToCSV(filteredStudents, 'students', 'students')}>
                      <FiDownload /> Export
                    </button>
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
                </div>
                
                <div className="table-toolbar">
                  <div className="search-box">
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                    {studentSearch && (
                      <button className="clear-search" onClick={() => setStudentSearch('')}>
                        <FiX />
                      </button>
                    )}
                  </div>
                  <div className="filter-box">
                    <FiFilter />
                    <select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="results-count">
                    Showing {filteredStudents.length} of {students.length}
                  </div>
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
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-table">
                            <FiUsers className="empty-icon" />
                            <p>No students found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student._id}>
                            <td className="td-name">{student.name}</td>
                            <td>{student.email || '-'}</td>
                            <td>{student.phone || '-'}</td>
                            <td>
                              <span className={`badge ${student.isActive ? 'badge-ongoing' : 'badge-cancelled'}`}>
                                {student.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <button
                                className={`btn btn-sm ${student.isActive ? 'btn-danger' : 'btn-success'}`}
                                onClick={() => handleToggleUserStatus(student._id, student.isActive)}
                              >
                                {student.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
              <div className="tab-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <h2>Classes Management</h2>
                    <p>View and manage all scheduled classes</p>
                  </div>
                  <div className="panel-actions">
                    <button className="btn btn-secondary" onClick={() => exportToCSV(filteredClasses, 'classes', 'classes')}>
                      <FiDownload /> Export
                    </button>
                  </div>
                </div>
                
                <div className="table-toolbar">
                  <div className="search-box">
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search by title or teacher..."
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                    />
                    {classSearch && (
                      <button className="clear-search" onClick={() => setClassSearch('')}>
                        <FiX />
                      </button>
                    )}
                  </div>
                  <div className="filter-box">
                    <FiFilter />
                    <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="results-count">
                    Showing {filteredClasses.length} of {classes.length}
                  </div>
                </div>
                
                <div className="classes-grid-container">
                  {filteredClasses.length === 0 ? (
                    <div className="empty-classes">
                      <FiBookOpen className="empty-icon" />
                      <p>No classes found</p>
                    </div>
                  ) : (
                    <div className="classes-grid">
                      {filteredClasses.map((classItem) => (
                        <div key={classItem._id} className="class-card">
                          <h3>{classItem.title}</h3>
                          {classItem.description && (
                            <p className="class-description">{classItem.description}</p>
                          )}
                          <div className="class-meta">
                            <p className="class-teacher">
                              <FiUserCheck /> {classItem.teacher?.name}
                            </p>
                            <p className="class-time">
                              <FiCalendar /> {format(new Date(classItem.scheduledTime), 'MMM d, yyyy • h:mm a')}
                            </p>
                            <p className="class-students">
                              <FiUsers /> {classItem.students?.length || 0} students
                            </p>
                          </div>
                          <div className="class-status">
                            <span className={`badge badge-${classItem.status}`}>
                              {classItem.status}
                            </span>
                          </div>
                          <div className="class-actions">
                            <button
                              className="btn btn-primary"
                              onClick={() => handleJoinClass(classItem._id)}
                            >
                              <FiVideo /> Join Class
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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
              
              <form onSubmit={handleCreateUser}>
                <div className="modal-body">
                  {createError && <div className="alert alert-error">{createError}</div>}

                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      placeholder="Enter full name"
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
                      placeholder="Enter email address"
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
                      placeholder="Enter phone number"
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

        {/* Import Modal */}
        {showImportModal && (
          <div className="modal-overlay" onClick={closeImportModal}>
            <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Import {importType === 'teachers' ? 'Teachers' : 'Students'}</h2>
                <button className="modal-close" onClick={closeImportModal}>×</button>
              </div>
              
              <div className="modal-body">
                {!importSuccess ? (
                  <>
                    <div className="import-instructions">
                      <h4>CSV Format Requirements:</h4>
                      <p>Upload a CSV file with the following columns:</p>
                      <code>Name, Email, Phone, Password (optional)</code>
                      <p className="import-note">
                        <FiAlertCircle /> If password is not provided, default password "password123" will be used.
                      </p>
                    </div>

                    <div className="import-upload">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="upload-label">
                        <FiUpload />
                        <span>Choose CSV File</span>
                      </label>
                    </div>

                    {importData.length > 0 && (
                      <div className="import-preview">
                        <h4>Preview ({importData.length} records)</h4>
                        <div className="preview-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importData.slice(0, 5).map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.name}</td>
                                  <td>{item.email}</td>
                                  <td>{item.phone || '-'}</td>
                                </tr>
                              ))}
                              {importData.length > 5 && (
                                <tr>
                                  <td colSpan="3" className="more-rows">
                                    ... and {importData.length - 5} more
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {importErrors.length > 0 && (
                      <div className="import-errors">
                        <h4>Errors:</h4>
                        <ul>
                          {importErrors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="import-success">
                    <FiCheck className="success-icon" />
                    <h3>Import Complete!</h3>
                    <p>Successfully imported {importData.length - importErrors.length} records.</p>
                    {importErrors.length > 0 && (
                      <div className="import-errors">
                        <p>{importErrors.length} records failed:</p>
                        <ul>
                          {importErrors.slice(0, 5).map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={closeImportModal}>
                  {importSuccess ? 'Close' : 'Cancel'}
                </button>
                {!importSuccess && (
                  <button 
                    className="btn btn-primary"
                    onClick={handleImport}
                    disabled={importData.length === 0 || importLoading}
                  >
                    {importLoading ? 'Importing...' : `Import ${importData.length} Records`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
