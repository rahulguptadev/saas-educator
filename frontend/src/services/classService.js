import api from './api';

export const classService = {
  getClasses: async () => {
    const response = await api.get('/classes');
    return response.data;
  },

  getClass: async (id) => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  createClass: async (classData) => {
    const response = await api.post('/classes', classData);
    return response.data;
  },

  updateClass: async (id, classData) => {
    const response = await api.put(`/classes/${id}`, classData);
    return response.data;
  },

  deleteClass: async (id) => {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },

  joinClass: async (id) => {
    const response = await api.post(`/classes/${id}/join`);
    return response.data;
  },
};

