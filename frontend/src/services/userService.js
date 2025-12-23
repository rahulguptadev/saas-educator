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
};

