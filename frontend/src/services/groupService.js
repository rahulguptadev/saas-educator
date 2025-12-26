import api from './api';

export const groupService = {
  // Get all groups (admin sees all, others see their own)
  getGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  // Get single group by ID
  getGroup: async (id) => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  // Create new group (admin only)
  createGroup: async (groupData) => {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  // Update group (admin only)
  updateGroup: async (id, groupData) => {
    const response = await api.put(`/groups/${id}`, groupData);
    return response.data;
  },

  // Delete group (admin only)
  deleteGroup: async (id) => {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  },

  // Get students from teacher's groups (for teachers)
  getMyStudents: async () => {
    const response = await api.get('/groups/teacher/my-students');
    return response.data;
  },

  // Get teachers from student's groups (for students)
  getMyTeachers: async () => {
    const response = await api.get('/groups/student/my-teachers');
    return response.data;
  }
};

