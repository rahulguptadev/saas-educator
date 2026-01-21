import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { adminService } from '../services/adminService';
import { userService } from '../services/userService';
import { classService } from '../services/classService';
import { groupService } from '../services/groupService';
import { 
  FiUsers, FiBook, FiCalendar, FiPlus, FiVideo, FiMessageCircle,
  FiSearch, FiFilter, FiDownload, FiUpload, FiX, FiCheck, FiAlertCircle,
  FiUserCheck, FiBookOpen, FiEdit2, FiTrash2, FiEye, FiFileText, FiGrid, FiUser
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
  const [groups, setGroups] = useState([]);
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
    role: 'teacher',
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
    qualification: '',
    education: '',
    bio: '',
    subjects: ''
  });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  
  // Group management states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    memberIds: []
  });
  
  // Create class states
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [classFormData, setClassFormData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    duration: 60,
    studentIds: [],
    groupId: '',
    teacherId: ''
  });
  const [classSelectionMode, setClassSelectionMode] = useState('students'); // 'students' or 'group'
  const [classModalTab, setClassModalTab] = useState('details'); // 'details', 'teacher', 'students'
  const [classTeacherSearch, setClassTeacherSearch] = useState('');
  const [classStudentSearch, setClassStudentSearch] = useState('');
  
  // View/Edit user states
  const [showUserModal, setShowUserModal] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
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
    qualification: '',
    education: '',
    bio: '',
    subjects: ''
  });
  const [userError, setUserError] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  
  // Grade and Subject options
  const gradeOptions = [
    '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th',
    '1st (Other)', '2nd (Other)', '3rd (Other)', '4th (Other)', '5th (Other)'
  ];
  const subjectOptions = [
    'Maths', 'Science', 'English', 'Hindi', 'Social Studies', 'Physics', 
    'Chemistry', 'Biology', 'Computer Science', 'Economics', 'Accountancy'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load data with individual error handling so one failure doesn't block others
      const results = await Promise.allSettled([
        adminService.getStats(),
        userService.getTeachers(),
        userService.getStudents(),
        classService.getClasses(),
        groupService.getGroups()
      ]);

      // Handle stats
      if (results[0].status === 'fulfilled') {
        setStats(results[0].value.stats);
      } else {
        console.error('Error loading stats:', results[0].reason);
      }

      // Handle teachers
      if (results[1].status === 'fulfilled') {
        setTeachers(results[1].value.teachers || []);
      } else {
        console.error('Error loading teachers:', results[1].reason);
        setTeachers([]);
      }

      // Handle students
      if (results[2].status === 'fulfilled') {
        setStudents(results[2].value.students || []);
      } else {
        console.error('Error loading students:', results[2].reason);
        setStudents([]);
      }

      // Handle classes
      if (results[3].status === 'fulfilled') {
        setClasses(results[3].value.classes || []);
      } else {
        console.error('Error loading classes:', results[3].reason);
        setClasses([]);
      }

      // Handle groups
      if (results[4].status === 'fulfilled') {
        setGroups(results[4].value.groups || []);
      } else {
        console.error('Error loading groups:', results[4].reason);
        setGroups([]);
      }

      console.log('Data loaded:', {
        teachers: results[1].status === 'fulfilled' ? (results[1].value.teachers?.length || 0) : 'failed',
        students: results[2].status === 'fulfilled' ? (results[2].value.students?.length || 0) : 'failed',
        classes: results[3].status === 'fulfilled' ? (results[3].value.classes?.length || 0) : 'failed',
        groups: results[4].status === 'fulfilled' ? (results[4].value.groups?.length || 0) : 'failed'
      });

    } catch (error) {
      console.error('Unexpected error loading data:', error);
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
                          (student.grade && student.grade.toLowerCase().includes(studentSearch.toLowerCase())) ||
                          (student.school && student.school.toLowerCase().includes(studentSearch.toLowerCase())) ||
                          (student.enrolledSubjects && student.enrolledSubjects.some(s => 
                            s.subject && s.subject.toLowerCase().includes(studentSearch.toLowerCase())
                          ));
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
    
    if (type === 'teachers') {
      csvContent = 'Name,Email,Phone,Specialization,Qualification,Education,Bio,Subjects,Status\n';
      data.forEach(user => {
        csvContent += `"${user.name}","${user.email || ''}","${user.phone || ''}","${user.specialization || ''}","${user.qualification || ''}","${user.education || ''}","${user.bio || ''}","${user.subjects || ''}","${user.isActive ? 'Active' : 'Inactive'}"\n`;
      });
    } else if (type === 'students') {
      csvContent = 'Name,Email,Phone,Grade,School,Father Name,Father Contact,Mother Name,Mother Contact,Status\n';
      data.forEach(user => {
        csvContent += `"${user.name}","${user.email || ''}","${user.phone || ''}","${user.grade || ''}","${user.school || ''}","${user.fatherName || ''}","${user.fatherContact || ''}","${user.motherName || ''}","${user.motherContact || ''}","${user.isActive ? 'Active' : 'Inactive'}"\n`;
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
    
    // Parse CSV line properly handling quoted fields with commas
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // Field separator
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      // Add last field
      result.push(current.trim());
      return result;
    };
    
    // Parse headers
    const headerLine = parseCSVLine(lines[0]);
    const headers = headerLine.map(h => h.replace(/"/g, '').trim().toLowerCase().replace(/\s+/g, ''));
    
    const data = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        continue;
      }
      
      const row = {};
      values.forEach((val, idx) => {
        const cleanVal = val.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
        row[headers[idx]] = cleanVal;
      });
      
      if (importType === 'teachers') {
        if (!row.name || !row.email) {
          errors.push(`Row ${i}: Missing required fields (name, email)`);
        } else {
          // Handle different column name variations
          const phoneValue = row.phone || row.phonenumber || row['phonenumber'] || '';
          const statusValue = row.status || row.isactive || '';
          const isActive = statusValue.toLowerCase() === 'active' || statusValue === '' || statusValue === undefined;
          
          data.push({
            name: row.name,
            email: row.email,
            phone: phoneValue,
            password: row.password || 'password123',
            role: 'teacher',
            specialization: row.specialization || row.subjects || '',
            qualification: row.qualification || '',
            education: row.education || '',
            bio: row.bio || '',
            subjects: row.subjects || '',
            isActive: isActive
          });
        }
      } else if (importType === 'students') {
        if (!row.name || !row.email) {
          errors.push(`Row ${i + 1}: Missing required fields (name, email)`);
        } else {
          // Handle different column name variations
          const phoneValue = row.phone || row.phonenumber || row['phonenumber'] || '';
          const statusValue = row.status || row.isactive || '';
          const isActive = statusValue.toLowerCase() === 'active' || statusValue === '' || statusValue === undefined;
          
          // Parse enrolledSubjects from semicolon/comma separated string
          let enrolledSubjects = [];
          const subjectsStr = row.enrolledsubjects || row['enrolledsubjects'] || row.subjects || '';
          if (subjectsStr && subjectsStr.trim() !== '' && subjectsStr !== '-') {
            try {
              // Try parsing as JSON first (for backward compatibility)
              enrolledSubjects = JSON.parse(subjectsStr);
            } catch (e) {
              // If not JSON, parse as semicolon/comma separated string
              const subjects = subjectsStr.split(/[;,]/).map(s => s.trim()).filter(s => s && s !== '-');
              enrolledSubjects = subjects.map(subject => ({
                subject: subject.trim(),
                classes: 0,
                fees: 0
              }));
            }
          }
          
          data.push({
            name: row.name,
            email: row.email,
            phone: phoneValue,
            password: row.password || 'password123',
            role: 'student',
            grade: row.grade || '',
            school: row.school || '',
            fatherName: row.fathername || row['fathername'] || '',
            fatherContact: row.fathercontact || row['fathercontact'] || '',
            motherName: row.mothername || row['mothername'] || '',
            motherContact: row.mothercontact || row['mothercontact'] || '',
            enrolledSubjects: enrolledSubjects,
            isActive: isActive
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

  const handleViewUser = async (userId) => {
    try {
      const response = await adminService.getUser(userId);
      const user = response.user;
      setViewingUser(user);
      setUserFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        grade: user.grade || '',
        school: user.school || '',
        fatherName: user.fatherName || '',
        fatherContact: user.fatherContact || '',
        motherName: user.motherName || '',
        motherContact: user.motherContact || '',
        enrolledSubjects: user.enrolledSubjects || [],
        specialization: user.specialization || '',
        qualification: user.qualification || '',
        education: user.education || '',
        bio: user.bio || '',
        subjects: user.subjects || ''
      });
      setIsEditMode(false);
      setShowUserModal(true);
      setUserError('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load user details');
    }
  };

  const handleEditUser = () => {
    setIsEditMode(true);
    setUserError('');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserLoading(true);

    try {
      const updateData = {
        name: userFormData.name,
        email: userFormData.email,
        phone: userFormData.phone,
        ...(userFormData.password && { password: userFormData.password })
      };

      if (viewingUser.role === 'student') {
        updateData.grade = userFormData.grade;
        updateData.school = userFormData.school;
        updateData.fatherName = userFormData.fatherName;
        updateData.fatherContact = userFormData.fatherContact;
        updateData.motherName = userFormData.motherName;
        updateData.motherContact = userFormData.motherContact;
        updateData.enrolledSubjects = userFormData.enrolledSubjects;
      } else if (viewingUser.role === 'teacher') {
        updateData.specialization = userFormData.specialization;
        updateData.qualification = userFormData.qualification;
        updateData.education = userFormData.education;
        updateData.bio = userFormData.bio;
        updateData.subjects = userFormData.subjects;
      }

      await adminService.updateUser(viewingUser._id, updateData);
      setShowUserModal(false);
      setIsEditMode(false);
      setViewingUser(null);
      await loadData();
    } catch (error) {
      setUserError(error.response?.data?.message || 'Failed to update user');
    } finally {
      setUserLoading(false);
    }
  };

  const handleUserFormChange = (e) => {
    setUserFormData({
      ...userFormData,
      [e.target.name]: e.target.value
    });
    setUserError('');
  };

  const addSubjectToEdit = () => {
    setUserFormData({
      ...userFormData,
      enrolledSubjects: [...userFormData.enrolledSubjects, { subject: '', classes: 0, fees: 0 }]
    });
  };

  const removeSubjectFromEdit = (index) => {
    const updated = userFormData.enrolledSubjects.filter((_, i) => i !== index);
    setUserFormData({ ...userFormData, enrolledSubjects: updated });
  };

  const handleSubjectFieldChangeEdit = (index, field, value) => {
    const updated = [...userFormData.enrolledSubjects];
    updated[index] = { ...updated[index], [field]: value };
    setUserFormData({ ...userFormData, enrolledSubjects: updated });
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
      resetCreateForm();
      await loadData();
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'teacher',
      grade: '',
      school: '',
      fatherName: '',
      fatherContact: '',
      motherName: '',
      motherContact: '',
      enrolledSubjects: [],
      specialization: '',
      qualification: ''
    });
    setCreateUserRole('teacher');
  };

  const addSubjectToCreate = () => {
    setCreateFormData({
      ...createFormData,
      enrolledSubjects: [...createFormData.enrolledSubjects, { subject: '', classes: 0, fees: 0 }]
    });
  };

  const removeSubjectFromCreate = (index) => {
    const updated = createFormData.enrolledSubjects.filter((_, i) => i !== index);
    setCreateFormData({ ...createFormData, enrolledSubjects: updated });
  };

  const handleSubjectFieldChange = (index, field, value) => {
    const updated = [...createFormData.enrolledSubjects];
    updated[index] = { ...updated[index], [field]: value };
    setCreateFormData({ ...createFormData, enrolledSubjects: updated });
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

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        await classService.deleteClass(classId);
        loadData();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete class');
      }
    }
  };

  const handleClassFormChange = (e) => {
    const { name, value } = e.target;
    setClassFormData({ ...classFormData, [name]: value });
  };

  const handleStudentSelectForClass = (studentId) => {
    setClassFormData(prev => {
      const studentIds = prev.studentIds || [];
      if (studentIds.includes(studentId)) {
        return { ...prev, studentIds: studentIds.filter(id => id !== studentId) };
      } else {
        return { ...prev, studentIds: [...studentIds, studentId] };
      }
    });
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      // Validate that either group or students are selected
      if (classSelectionMode === 'group' && !classFormData.groupId) {
        alert('Please select a group');
        return;
      }
      if (classSelectionMode === 'students' && (!classFormData.studentIds || classFormData.studentIds.length === 0)) {
        alert('Please select at least one student');
        return;
      }
      if (!classFormData.teacherId) {
        alert('Please select a teacher');
        return;
      }

      // Convert datetime-local string to ISO string
      const classData = {
        title: classFormData.title,
        description: classFormData.description,
        scheduledTime: classFormData.scheduledTime 
          ? new Date(classFormData.scheduledTime).toISOString()
          : classFormData.scheduledTime,
        duration: classFormData.duration,
        teacherId: classFormData.teacherId,
        ...(classSelectionMode === 'group' 
          ? { groupId: classFormData.groupId, studentIds: [] }
          : { groupId: '', studentIds: classFormData.studentIds })
      };

      await classService.createClass(classData);
      setShowCreateClassModal(false);
      setClassFormData({
        title: '',
        description: '',
        scheduledTime: '',
        duration: 60,
        studentIds: [],
        groupId: '',
        teacherId: ''
      });
      setClassSelectionMode('students');
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create class');
    }
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
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/admin/chats')}
          >
            <FiMessageCircle /> Chats
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
            <button 
              className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => setActiveTab('groups')}
            >
              <FiUsers />
              <span>Groups</span>
              <span className="tab-count">{groups.length}</span>
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
                              <div className="table-actions">
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleViewUser(teacher._id)}
                                  title="View Details"
                                >
                                  <FiEye />
                                </button>
                                <button
                                  className={`btn btn-sm ${teacher.isActive ? 'btn-danger' : 'btn-success'}`}
                                  onClick={() => handleToggleUserStatus(teacher._id, teacher.isActive)}
                                >
                                  {teacher.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              </div>
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
                      placeholder="Search by name, grade, school, or subjects..."
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
                        <th>Grade</th>
                        <th>School</th>
                        <th>Subjects</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="empty-table">
                            <FiUsers className="empty-icon" />
                            <p>No students found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => {
                          // Format enrolled subjects for display
                          const subjectsDisplay = student.enrolledSubjects && student.enrolledSubjects.length > 0
                            ? student.enrolledSubjects.map(s => s.subject).join(', ')
                            : '-';
                          
                          return (
                          <tr key={student._id}>
                            <td className="td-name">{student.name}</td>
                            <td>{student.grade || '-'}</td>
                            <td>{student.school || '-'}</td>
                            <td className="subjects-cell" title={subjectsDisplay}>
                              {subjectsDisplay.length > 50 ? `${subjectsDisplay.substring(0, 50)}...` : subjectsDisplay}
                            </td>
                            <td>{student.phone || '-'}</td>
                            <td>
                              <span className={`badge ${student.isActive ? 'badge-ongoing' : 'badge-cancelled'}`}>
                                {student.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleViewUser(student._id)}
                                  title="View Details"
                                >
                                  <FiEye />
                                </button>
                                <button
                                  className={`btn btn-sm ${student.isActive ? 'btn-danger' : 'btn-success'}`}
                                  onClick={() => handleToggleUserStatus(student._id, student.isActive)}
                                >
                                  {student.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })
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
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        setClassFormData({
                          title: '',
                          description: '',
                          scheduledTime: '',
                          duration: 60,
                          studentIds: [],
                          groupId: '',
                          teacherId: ''
                        });
                        setClassSelectionMode('students');
                        setClassModalTab('details');
                        setClassTeacherSearch('');
                        setClassStudentSearch('');
                        setShowCreateClassModal(true);
                      }}
                    >
                      <FiPlus /> Create Class
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
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDeleteClass(classItem._id)}
                              title="Delete Class"
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Groups Tab */}
            {activeTab === 'groups' && (
              <div className="tab-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <h2>Groups Management</h2>
                    <p>Create and manage groups of students and teachers</p>
                  </div>
                  <div className="panel-actions">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        setEditingGroup(null);
                        setGroupFormData({ name: '', description: '', memberIds: [] });
                        setShowGroupModal(true);
                      }}
                    >
                      <FiPlus /> Create Group
                    </button>
                  </div>
                </div>
                
                <div className="classes-grid-container">
                  {groups.length === 0 ? (
                    <div className="empty-classes">
                      <FiUsers className="empty-icon" />
                      <p>No groups created yet</p>
                    </div>
                  ) : (
                    <div className="classes-grid">
                      {groups.map((group) => (
                        <div key={group._id} className="class-card">
                          <h3>{group.name}</h3>
                          {group.description && <p className="class-description">{group.description}</p>}
                          <div className="class-meta">
                            <p className="class-students">
                              <FiUsers /> {group.members?.length || 0} members
                            </p>
                          </div>
                          <div className="class-actions">
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => {
                                setEditingGroup(group);
                                setGroupFormData({
                                  name: group.name,
                                  description: group.description || '',
                                  memberIds: group.members?.map(m => m._id) || []
                                });
                                setShowGroupModal(true);
                              }}
                            >
                              <FiEdit2 /> Edit
                            </button>
                            <button 
                              className="btn btn-danger" 
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this group?')) {
                                  try {
                                    await groupService.deleteGroup(group._id);
                                    loadData();
                                  } catch (error) {
                                    alert('Failed to delete group');
                                  }
                                }
                              }}
                            >
                              <FiTrash2 /> Delete
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

        {/* Group Management Modal */}
        {showGroupModal && (
          <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingGroup ? 'Edit Group' : 'Create New Group'}</h2>
                <button className="modal-close" onClick={() => setShowGroupModal(false)}>×</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (!groupFormData.name.trim()) {
                    alert('Group name is required');
                    return;
                  }
                  if (!groupFormData.memberIds || groupFormData.memberIds.length === 0) {
                    alert('Please select at least one member');
                    return;
                  }

                  if (editingGroup) {
                    await groupService.updateGroup(editingGroup._id, groupFormData);
                  } else {
                    await groupService.createGroup(groupFormData);
                  }
                  
                  setShowGroupModal(false);
                  setEditingGroup(null);
                  setGroupFormData({ name: '', description: '', memberIds: [] });
                  loadData();
                } catch (error) {
                  alert(error.response?.data?.message || 'Failed to save group');
                }
              }}>
                <div className="modal-body modal-body-scroll">
                  <div className="form-group">
                    <label className="form-label">Group Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={groupFormData.name}
                      onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                      placeholder="Enter group name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      value={groupFormData.description}
                      onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                      placeholder="Enter group description (optional)"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select Members (Students & Teachers) *</label>
                    <div className="student-select" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {/* Teachers */}
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Teachers</h4>
                        {teachers.filter(t => t.isActive).map((teacher) => (
                          <label key={teacher._id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={groupFormData.memberIds?.includes(teacher._id)}
                              onChange={(e) => {
                                const memberIds = groupFormData.memberIds || [];
                                if (e.target.checked) {
                                  setGroupFormData({ ...groupFormData, memberIds: [...memberIds, teacher._id] });
                                } else {
                                  setGroupFormData({ ...groupFormData, memberIds: memberIds.filter(id => id !== teacher._id) });
                                }
                              }}
                            />
                            <span>{teacher.name}</span>
                          </label>
                        ))}
                      </div>
                      {/* Students */}
                      <div>
                        <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Students</h4>
                        {students.filter(s => s.isActive).map((student) => (
                          <label key={student._id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={groupFormData.memberIds?.includes(student._id)}
                              onChange={(e) => {
                                const memberIds = groupFormData.memberIds || [];
                                if (e.target.checked) {
                                  setGroupFormData({ ...groupFormData, memberIds: [...memberIds, student._id] });
                                } else {
                                  setGroupFormData({ ...groupFormData, memberIds: memberIds.filter(id => id !== student._id) });
                                }
                              }}
                            />
                            <span>{student.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowGroupModal(false);
                    setEditingGroup(null);
                    setGroupFormData({ name: '', description: '', memberIds: [] });
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingGroup ? 'Update' : 'Create'} Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New {createUserRole === 'teacher' ? 'Teacher' : 'Student'}</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
              </div>
              
              <form onSubmit={handleCreateUser}>
                <div className="modal-body modal-body-scroll">
                  {createError && <div className="alert alert-error">{createError}</div>}

                  {/* Basic Information Section */}
                  <div className="form-section">
                    <h3 className="form-section-title">
                      {createUserRole === 'student' ? 'Student Information' : 'Teacher Information'}
                    </h3>
                    
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

                    {createUserRole === 'student' && (
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Grade</label>
                          <select
                            name="grade"
                            className="form-input"
                            value={createFormData.grade}
                            onChange={handleCreateFormChange}
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
                            value={createFormData.school}
                            onChange={handleCreateFormChange}
                          />
                        </div>
                      </div>
                    )}

      {createUserRole === 'teacher' && (
                        <>
                          <div className="form-group">
                            <label className="form-label">Specialization</label>
                            <input
                              type="text"
                              name="specialization"
                              className="form-input"
                              placeholder="e.g. Mathematics, Science"
                              value={createFormData.specialization}
                              onChange={handleCreateFormChange}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Qualification</label>
                            <input
                              type="text"
                              name="qualification"
                              className="form-input"
                              placeholder="e.g. M.Sc, B.Ed"
                              value={createFormData.qualification}
                              onChange={handleCreateFormChange}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Education</label>
                            <input
                              type="text"
                              name="education"
                              className="form-input"
                              placeholder="Educational background"
                              value={createFormData.education}
                              onChange={handleCreateFormChange}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Subjects</label>
                            <input
                              type="text"
                              name="subjects"
                              className="form-input"
                              placeholder="e.g. Maths, Science, English"
                              value={createFormData.subjects}
                              onChange={handleCreateFormChange}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Bio</label>
                            <textarea
                              name="bio"
                              className="form-textarea"
                              placeholder="Teacher biography and experience"
                              value={createFormData.bio}
                              onChange={handleCreateFormChange}
                              rows="4"
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
                        value={createFormData.phone}
                        onChange={handleCreateFormChange}
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

                  {/* Parent Information (Students only) */}
                  {createUserRole === 'student' && (
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
                            value={createFormData.fatherName}
                            onChange={handleCreateFormChange}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Father's Contact</label>
                          <input
                            type="tel"
                            name="fatherContact"
                            className="form-input"
                            placeholder="+1(480)569-6714"
                            value={createFormData.fatherContact}
                            onChange={handleCreateFormChange}
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
                            value={createFormData.motherName}
                            onChange={handleCreateFormChange}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Mother's Contact</label>
                          <input
                            type="tel"
                            name="motherContact"
                            className="form-input"
                            placeholder="+1234567890"
                            value={createFormData.motherContact}
                            onChange={handleCreateFormChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enrolled Subjects (Students only) */}
                  {createUserRole === 'student' && (
                    <div className="form-section">
                      <h3 className="form-section-title">
                        Enrolled Subjects
                        <button type="button" className="btn btn-sm btn-secondary" onClick={addSubjectToCreate}>
                          <FiPlus /> Add Subject
                        </button>
                      </h3>
                      
                      {createFormData.enrolledSubjects.length > 0 ? (
                        <div className="subjects-edit-list">
                          {createFormData.enrolledSubjects.map((subj, idx) => (
                            <div key={idx} className="subject-edit-row">
                              <div className="form-group">
                                <label className="form-label">Subject</label>
                                <select
                                  className="form-input"
                                  value={subj.subject}
                                  onChange={(e) => handleSubjectFieldChange(idx, 'subject', e.target.value)}
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
                                  onChange={(e) => handleSubjectFieldChange(idx, 'classes', parseInt(e.target.value) || 0)}
                                  min="0"
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Fees (₹)</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={subj.fees}
                                  onChange={(e) => handleSubjectFieldChange(idx, 'fees', parseInt(e.target.value) || 0)}
                                  min="0"
                                />
                              </div>
                              <button 
                                type="button" 
                                className="btn-remove-subject"
                                onClick={() => removeSubjectFromCreate(idx)}
                              >
                                <FiX />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-subjects-text">No subjects added. Click "Add Subject" to add one.</p>
                      )}
                    </div>
                  )}
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

        {/* View/Edit User Modal */}
        {showUserModal && viewingUser && (
          <div className="modal-overlay" onClick={() => {
            if (!isEditMode) {
              setShowUserModal(false);
              setViewingUser(null);
              setIsEditMode(false);
            }
          }}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {isEditMode ? `Edit ${viewingUser.role === 'teacher' ? 'Teacher' : 'Student'}` : `View ${viewingUser.role === 'teacher' ? 'Teacher' : 'Student'} Details`}
                </h2>
                <button 
                  className="modal-close" 
                  onClick={() => {
                    setShowUserModal(false);
                    setViewingUser(null);
                    setIsEditMode(false);
                  }}
                >
                  ×
                </button>
              </div>
              
              {isEditMode ? (
                <form onSubmit={handleUpdateUser}>
                  <div className="modal-body modal-body-scroll">
                    {userError && <div className="alert alert-error">{userError}</div>}

                    {/* Basic Information Section */}
                    <div className="form-section">
                      <h3 className="form-section-title">
                        {viewingUser.role === 'student' ? 'Student Information' : 'Teacher Information'}
                      </h3>
                      
                      <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          name="name"
                          className="form-input"
                          placeholder="Enter full name"
                          value={userFormData.name}
                          onChange={handleUserFormChange}
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
                          value={userFormData.email}
                          onChange={handleUserFormChange}
                          required
                        />
                      </div>

                      {viewingUser.role === 'student' && (
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Grade</label>
                            <select
                              name="grade"
                              className="form-input"
                              value={userFormData.grade}
                              onChange={handleUserFormChange}
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
                              value={userFormData.school}
                              onChange={handleUserFormChange}
                            />
                          </div>
                        </div>
                      )}

                      {viewingUser.role === 'teacher' && (
                        <>
                          <div className="form-group">
                            <label className="form-label">Specialization</label>
                            <input
                              type="text"
                              name="specialization"
                              className="form-input"
                              placeholder="e.g. Mathematics, Science"
                              value={userFormData.specialization}
                              onChange={handleUserFormChange}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Qualification</label>
                            <input
                              type="text"
                              name="qualification"
                              className="form-input"
                              placeholder="e.g. M.Sc, B.Ed"
                              value={userFormData.qualification}
                              onChange={handleUserFormChange}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Education</label>
                            <input
                              type="text"
                              name="education"
                              className="form-input"
                              placeholder="Educational background"
                              value={userFormData.education}
                              onChange={handleUserFormChange}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Subjects</label>
                            <input
                              type="text"
                              name="subjects"
                              className="form-input"
                              placeholder="e.g. Maths, Science, English"
                              value={userFormData.subjects}
                              onChange={handleUserFormChange}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Bio</label>
                            <textarea
                              name="bio"
                              className="form-textarea"
                              placeholder="Teacher biography and experience"
                              value={userFormData.bio}
                              onChange={handleUserFormChange}
                              rows="4"
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
                          value={userFormData.phone}
                          onChange={handleUserFormChange}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Password (Leave blank to keep current password)</label>
                        <input
                          type="password"
                          name="password"
                          className="form-input"
                          value={userFormData.password}
                          onChange={handleUserFormChange}
                          minLength={6}
                          placeholder="Enter new password (optional)"
                        />
                      </div>
                    </div>

                    {/* Parent Information (Students only) */}
                    {viewingUser.role === 'student' && (
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
                              value={userFormData.fatherName}
                              onChange={handleUserFormChange}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Father's Contact</label>
                            <input
                              type="tel"
                              name="fatherContact"
                              className="form-input"
                              placeholder="+1(480)569-6714"
                              value={userFormData.fatherContact}
                              onChange={handleUserFormChange}
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
                              value={userFormData.motherName}
                              onChange={handleUserFormChange}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Mother's Contact</label>
                            <input
                              type="tel"
                              name="motherContact"
                              className="form-input"
                              placeholder="+1234567890"
                              value={userFormData.motherContact}
                              onChange={handleUserFormChange}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enrolled Subjects (Students only) */}
                    {viewingUser.role === 'student' && (
                      <div className="form-section">
                        <h3 className="form-section-title">
                          Enrolled Subjects
                          <button type="button" className="btn btn-sm btn-secondary" onClick={addSubjectToEdit}>
                            <FiPlus /> Add Subject
                          </button>
                        </h3>
                        
                        {userFormData.enrolledSubjects.length > 0 ? (
                          <div className="subjects-edit-list">
                            {userFormData.enrolledSubjects.map((subj, idx) => (
                              <div key={idx} className="subject-edit-row">
                                <div className="form-group">
                                  <label className="form-label">Subject</label>
                                  <select
                                    className="form-input"
                                    value={subj.subject}
                                    onChange={(e) => handleSubjectFieldChangeEdit(idx, 'subject', e.target.value)}
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
                                    onChange={(e) => handleSubjectFieldChangeEdit(idx, 'classes', parseInt(e.target.value) || 0)}
                                    min="0"
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Fees (₹)</label>
                                  <input
                                    type="number"
                                    className="form-input"
                                    value={subj.fees}
                                    onChange={(e) => handleSubjectFieldChangeEdit(idx, 'fees', parseInt(e.target.value) || 0)}
                                    min="0"
                                  />
                                </div>
                                <button 
                                  type="button" 
                                  className="btn-remove-subject"
                                  onClick={() => removeSubjectFromEdit(idx)}
                                >
                                  <FiX />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-subjects-text">No subjects added. Click "Add Subject" to add one.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setIsEditMode(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={userLoading}
                    >
                      {userLoading ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="modal-body modal-body-scroll">
                    {/* Basic Information Section */}
                    <div className="form-section">
                      <h3 className="form-section-title">
                        {viewingUser.role === 'student' ? 'Student Information' : 'Teacher Information'}
                      </h3>
                      
                      <div className="view-details-grid">
                        <div className="view-detail-item">
                          <label>Name</label>
                          <p>{viewingUser.name || '-'}</p>
                        </div>
                        <div className="view-detail-item">
                          <label>Email</label>
                          <p>{viewingUser.email || '-'}</p>
                        </div>
                        <div className="view-detail-item">
                          <label>Phone</label>
                          <p>{viewingUser.phone || '-'}</p>
                        </div>
                        <div className="view-detail-item">
                          <label>Status</label>
                          <p>
                            <span className={`badge ${viewingUser.isActive ? 'badge-ongoing' : 'badge-cancelled'}`}>
                              {viewingUser.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </p>
                        </div>
                        {viewingUser.role === 'student' && (
                          <>
                            <div className="view-detail-item">
                              <label>Grade</label>
                              <p>{viewingUser.grade || '-'}</p>
                            </div>
                            <div className="view-detail-item">
                              <label>School</label>
                              <p>{viewingUser.school || '-'}</p>
                            </div>
                          </>
                        )}
                        {viewingUser.role === 'teacher' && (
                          <>
                            <div className="view-detail-item">
                              <label>Specialization</label>
                              <p>{viewingUser.specialization || '-'}</p>
                            </div>
                            <div className="view-detail-item">
                              <label>Qualification</label>
                              <p>{viewingUser.qualification || '-'}</p>
                            </div>
                            <div className="view-detail-item">
                              <label>Education</label>
                              <p>{viewingUser.education || '-'}</p>
                            </div>
                            <div className="view-detail-item">
                              <label>Subjects</label>
                              <p>{viewingUser.subjects || '-'}</p>
                            </div>
                            {viewingUser.bio && (
                              <div className="view-detail-item" style={{ gridColumn: '1 / -1' }}>
                                <label>Bio</label>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{viewingUser.bio}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Parent Information (Students only) */}
                    {viewingUser.role === 'student' && (
                      <div className="form-section">
                        <h3 className="form-section-title">Parent Information</h3>
                        <div className="view-details-grid">
                          <div className="view-detail-item">
                            <label>Father's Name</label>
                            <p>{viewingUser.fatherName || '-'}</p>
                          </div>
                          <div className="view-detail-item">
                            <label>Father's Contact</label>
                            <p>{viewingUser.fatherContact || '-'}</p>
                          </div>
                          <div className="view-detail-item">
                            <label>Mother's Name</label>
                            <p>{viewingUser.motherName || '-'}</p>
                          </div>
                          <div className="view-detail-item">
                            <label>Mother's Contact</label>
                            <p>{viewingUser.motherContact || '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enrolled Subjects (Students only) */}
                    {viewingUser.role === 'student' && viewingUser.enrolledSubjects && viewingUser.enrolledSubjects.length > 0 && (
                      <div className="form-section">
                        <h3 className="form-section-title">Enrolled Subjects</h3>
                        <div className="subjects-view-list">
                          {viewingUser.enrolledSubjects.map((subj, idx) => (
                            <div key={idx} className="subject-view-row">
                              <div>
                                <strong>{subj.subject}</strong>
                              </div>
                              <div>Classes: {subj.classes || 0}</div>
                              <div>Fees: ₹{subj.fees || 0}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setShowUserModal(false);
                        setViewingUser(null);
                        setIsEditMode(false);
                      }}
                    >
                      Close
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={handleEditUser}
                    >
                      <FiEdit2 /> Edit
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Create Class Modal */}
        {showCreateClassModal && (
          <div className="modal-overlay" onClick={() => setShowCreateClassModal(false)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Class</h2>
                <button className="modal-close" onClick={() => setShowCreateClassModal(false)}>×</button>
              </div>
              
              {/* Modal Tabs */}
              <div className="modal-tabs" style={{ 
                display: 'flex', 
                borderBottom: '2px solid var(--gray-200)',
                padding: '0 24px',
                gap: '0'
              }}>
                <button
                  type="button"
                  className={`modal-tab ${classModalTab === 'details' ? 'active' : ''}`}
                  onClick={() => setClassModalTab('details')}
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: classModalTab === 'details' ? 'var(--primary-color)' : 'var(--gray-500)',
                    borderBottom: classModalTab === 'details' ? '2px solid var(--primary-color)' : '2px solid transparent',
                    marginBottom: '-2px',
                    transition: 'all 0.2s'
                  }}
                >
                  <FiFileText style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Class Details
                </button>
                <button
                  type="button"
                  className={`modal-tab ${classModalTab === 'teacher' ? 'active' : ''}`}
                  onClick={() => setClassModalTab('teacher')}
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: classModalTab === 'teacher' ? 'var(--primary-color)' : 'var(--gray-500)',
                    borderBottom: classModalTab === 'teacher' ? '2px solid var(--primary-color)' : '2px solid transparent',
                    marginBottom: '-2px',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FiUser style={{ verticalAlign: 'middle' }} />
                  Teacher
                  {classFormData.teacherId && (
                    <span style={{
                      background: 'var(--success-color)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px'
                    }}>✓</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`modal-tab ${classModalTab === 'students' ? 'active' : ''}`}
                  onClick={() => setClassModalTab('students')}
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: classModalTab === 'students' ? 'var(--primary-color)' : 'var(--gray-500)',
                    borderBottom: classModalTab === 'students' ? '2px solid var(--primary-color)' : '2px solid transparent',
                    marginBottom: '-2px',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FiUsers style={{ verticalAlign: 'middle' }} />
                  Students
                  {(classFormData.studentIds?.length > 0 || classFormData.groupId) && (
                    <span style={{
                      background: 'var(--primary-color)',
                      color: 'white',
                      borderRadius: '10px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {classFormData.groupId ? '1 group' : classFormData.studentIds.length}
                    </span>
                  )}
                </button>
              </div>

              <form onSubmit={handleCreateClass}>
                <div className="modal-body modal-body-scroll" style={{ minHeight: '400px' }}>
                  
                  {/* Class Details Tab */}
                  {classModalTab === 'details' && (
                    <div className="tab-content">
                      <div className="form-group">
                        <label className="form-label">Class Title *</label>
                        <input
                          type="text"
                          name="title"
                          className="form-input"
                          placeholder="Enter class title"
                          value={classFormData.title}
                          onChange={handleClassFormChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          name="description"
                          className="form-textarea"
                          placeholder="Enter class description (optional)"
                          value={classFormData.description}
                          onChange={handleClassFormChange}
                          rows={3}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">Scheduled Time *</label>
                          <input
                            type="datetime-local"
                            name="scheduledTime"
                            className="form-input"
                            value={classFormData.scheduledTime}
                            onChange={handleClassFormChange}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Duration (minutes) *</label>
                          <input
                            type="number"
                            name="duration"
                            className="form-input"
                            placeholder="60"
                            value={classFormData.duration}
                            onChange={handleClassFormChange}
                            min="15"
                            required
                          />
                        </div>
                      </div>

                      <div style={{ 
                        marginTop: '24px', 
                        padding: '16px', 
                        background: 'var(--gray-50)', 
                        borderRadius: '8px',
                        border: '1px solid var(--gray-200)'
                      }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--gray-700)' }}>Selection Summary</h4>
                        <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
                          <div>
                            <span style={{ color: 'var(--gray-500)' }}>Teacher: </span>
                            <span style={{ fontWeight: '500', color: classFormData.teacherId ? 'var(--success-color)' : 'var(--danger-color)' }}>
                              {classFormData.teacherId 
                                ? teachers.find(t => t._id === classFormData.teacherId)?.name || 'Selected'
                                : 'Not selected'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--gray-500)' }}>Students: </span>
                            <span style={{ fontWeight: '500', color: (classFormData.studentIds?.length > 0 || classFormData.groupId) ? 'var(--success-color)' : 'var(--danger-color)' }}>
                              {classFormData.groupId 
                                ? `Group: ${groups.find(g => g._id === classFormData.groupId)?.name || 'Selected'}`
                                : classFormData.studentIds?.length > 0 
                                  ? `${classFormData.studentIds.length} student(s)`
                                  : 'Not selected'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Teacher Selection Tab */}
                  {classModalTab === 'teacher' && (
                    <div className="tab-content">
                      <div className="form-group">
                        <div style={{ position: 'relative' }}>
                          <FiSearch style={{ 
                            position: 'absolute', 
                            left: '12px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            color: 'var(--gray-400)'
                          }} />
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Search teachers by name or email..."
                            value={classTeacherSearch}
                            onChange={(e) => setClassTeacherSearch(e.target.value)}
                            style={{ paddingLeft: '38px' }}
                          />
                        </div>
                      </div>

                      <div style={{ 
                        maxHeight: '320px', 
                        overflowY: 'auto',
                        border: '1px solid var(--gray-200)',
                        borderRadius: '8px'
                      }}>
                        {teachers.filter(t => t.isActive).length === 0 ? (
                          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-500)' }}>
                            <FiUser style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }} />
                            <p>No active teachers available</p>
                            <p style={{ fontSize: '12px' }}>Please create a teacher first.</p>
                          </div>
                        ) : (
                          teachers
                            .filter(t => t.isActive)
                            .filter(t => 
                              t.name.toLowerCase().includes(classTeacherSearch.toLowerCase()) ||
                              t.email.toLowerCase().includes(classTeacherSearch.toLowerCase())
                            )
                            .map((teacher) => (
                              <label 
                                key={teacher._id} 
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid var(--gray-100)',
                                  background: classFormData.teacherId === teacher._id ? 'var(--primary-light)' : 'transparent',
                                  transition: 'background 0.2s'
                                }}
                              >
                                <input
                                  type="radio"
                                  name="teacherSelection"
                                  checked={classFormData.teacherId === teacher._id}
                                  onChange={() => setClassFormData({ ...classFormData, teacherId: teacher._id })}
                                  style={{ marginRight: '12px' }}
                                />
                                <div style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  borderRadius: '50%', 
                                  background: 'var(--primary-color)',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '600',
                                  marginRight: '12px',
                                  fontSize: '14px'
                                }}>
                                  {teacher.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '500', color: 'var(--gray-800)' }}>{teacher.name}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{teacher.email}</div>
                                  {teacher.specialization && (
                                    <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>
                                      {teacher.specialization}
                                    </div>
                                  )}
                                </div>
                                {classFormData.teacherId === teacher._id && (
                                  <FiCheck style={{ color: 'var(--success-color)', fontSize: '20px' }} />
                                )}
                              </label>
                            ))
                        )}
                        {teachers.filter(t => t.isActive).length > 0 && 
                         teachers.filter(t => t.isActive).filter(t => 
                           t.name.toLowerCase().includes(classTeacherSearch.toLowerCase()) ||
                           t.email.toLowerCase().includes(classTeacherSearch.toLowerCase())
                         ).length === 0 && (
                          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-500)' }}>
                            <p>No teachers match your search</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Students Selection Tab */}
                  {classModalTab === 'students' && (
                    <div className="tab-content">
                      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${classSelectionMode === 'students' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => {
                            setClassSelectionMode('students');
                            setClassFormData({ ...classFormData, groupId: '' });
                          }}
                        >
                          <FiUsers style={{ marginRight: '4px' }} />
                          Individual Students
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${classSelectionMode === 'group' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => {
                            setClassSelectionMode('group');
                            setClassFormData({ ...classFormData, studentIds: [] });
                          }}
                        >
                          <FiGrid style={{ marginRight: '4px' }} />
                          Select Group
                        </button>
                      </div>

                      {classSelectionMode === 'group' ? (
                        <div>
                          <div style={{ 
                            maxHeight: '320px', 
                            overflowY: 'auto',
                            border: '1px solid var(--gray-200)',
                            borderRadius: '8px'
                          }}>
                            {groups.length === 0 ? (
                              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-500)' }}>
                                <FiGrid style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }} />
                                <p>No groups available</p>
                                <p style={{ fontSize: '12px' }}>Create a group first from the Groups tab.</p>
                              </div>
                            ) : (
                              groups.map((group) => (
                                <label 
                                  key={group._id} 
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--gray-100)',
                                    background: classFormData.groupId === group._id ? 'var(--primary-light)' : 'transparent',
                                    transition: 'background 0.2s'
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name="groupSelection"
                                    checked={classFormData.groupId === group._id}
                                    onChange={() => setClassFormData({ ...classFormData, groupId: group._id })}
                                    style={{ marginRight: '12px' }}
                                  />
                                  <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '8px', 
                                    background: 'var(--secondary-color)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '12px'
                                  }}>
                                    <FiGrid />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500', color: 'var(--gray-800)' }}>{group.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                                      {group.members?.filter(m => m.role === 'student').length || 0} students
                                    </div>
                                  </div>
                                  {classFormData.groupId === group._id && (
                                    <FiCheck style={{ color: 'var(--success-color)', fontSize: '20px' }} />
                                  )}
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="form-group">
                            <div style={{ position: 'relative' }}>
                              <FiSearch style={{ 
                                position: 'absolute', 
                                left: '12px', 
                                top: '50%', 
                                transform: 'translateY(-50%)',
                                color: 'var(--gray-400)'
                              }} />
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Search students by name or grade..."
                                value={classStudentSearch}
                                onChange={(e) => setClassStudentSearch(e.target.value)}
                                style={{ paddingLeft: '38px' }}
                              />
                            </div>
                          </div>

                          {classFormData.studentIds?.length > 0 && (
                            <div style={{ 
                              marginBottom: '12px', 
                              padding: '8px 12px', 
                              background: 'var(--primary-light)', 
                              borderRadius: '6px',
                              fontSize: '13px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span><strong>{classFormData.studentIds.length}</strong> student(s) selected</span>
                              <button
                                type="button"
                                onClick={() => setClassFormData({ ...classFormData, studentIds: [] })}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--danger-color)',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Clear all
                              </button>
                            </div>
                          )}

                          <div style={{ 
                            maxHeight: '280px', 
                            overflowY: 'auto',
                            border: '1px solid var(--gray-200)',
                            borderRadius: '8px'
                          }}>
                            {students.filter(s => s.isActive).length === 0 ? (
                              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-500)' }}>
                                <FiUsers style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }} />
                                <p>No active students available</p>
                              </div>
                            ) : (
                              students
                                .filter(s => s.isActive)
                                .filter(s => 
                                  s.name.toLowerCase().includes(classStudentSearch.toLowerCase()) ||
                                  (s.grade && s.grade.toLowerCase().includes(classStudentSearch.toLowerCase()))
                                )
                                .map((student) => (
                                  <label 
                                    key={student._id} 
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      padding: '10px 16px',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid var(--gray-100)',
                                      background: classFormData.studentIds?.includes(student._id) ? 'var(--primary-light)' : 'transparent',
                                      transition: 'background 0.2s'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={classFormData.studentIds?.includes(student._id)}
                                      onChange={() => handleStudentSelectForClass(student._id)}
                                      style={{ marginRight: '12px' }}
                                    />
                                    <div style={{ 
                                      width: '36px', 
                                      height: '36px', 
                                      borderRadius: '50%', 
                                      background: 'var(--info-color)',
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: '600',
                                      marginRight: '12px',
                                      fontSize: '13px'
                                    }}>
                                      {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: '500', color: 'var(--gray-800)', fontSize: '14px' }}>{student.name}</div>
                                      {student.grade && (
                                        <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{student.grade}</div>
                                      )}
                                    </div>
                                    {classFormData.studentIds?.includes(student._id) && (
                                      <FiCheck style={{ color: 'var(--success-color)', fontSize: '18px' }} />
                                    )}
                                  </label>
                                ))
                            )}
                            {students.filter(s => s.isActive).length > 0 && 
                             students.filter(s => s.isActive).filter(s => 
                               s.name.toLowerCase().includes(classStudentSearch.toLowerCase()) ||
                               (s.grade && s.grade.toLowerCase().includes(classStudentSearch.toLowerCase()))
                             ).length === 0 && (
                              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-500)' }}>
                                <p>No students match your search</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-actions" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--gray-200)',
                  padding: '16px 24px'
                }}>
                  <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                    {classModalTab !== 'students' && (
                      <button 
                        type="button" 
                        className="btn btn-link"
                        onClick={() => setClassModalTab(classModalTab === 'details' ? 'teacher' : 'students')}
                        style={{ padding: 0 }}
                      >
                        Next: {classModalTab === 'details' ? 'Select Teacher' : 'Select Students'} →
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateClassModal(false)}>
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={!classFormData.title || !classFormData.scheduledTime || !classFormData.teacherId || (!classFormData.groupId && classFormData.studentIds?.length === 0)}
                    >
                      Create Class
                    </button>
                  </div>
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
                      {importType === 'teachers' ? (
                        <code>Name, Email, Phone, Password (optional), Specialization, Qualification, Education, Bio, Subjects, Status</code>
                      ) : (
                        <code>Name, Email, Phone, Password (optional), Grade, School, FatherName, FatherContact, MotherName, MotherContact, Enrolled Subjects (JSON array), Status</code>
                      )}
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
