import api from './api';

export const userService = {
  getStudents: async () => {
    const response = await api.get('/users/students');
    return response.data;
  },

  getTeachers: async () => {
    const response = await api.get('/users/teachers');
    return response.data;
  },

  getAvailableUsers: async () => {
    const response = await api.get('/users/available');
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Profile methods
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/users/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};

