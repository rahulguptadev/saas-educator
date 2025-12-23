import api from './api';

export const chatService = {
  getChats: async () => {
    const response = await api.get('/chats');
    return response.data;
  },

  getChat: async (chatId) => {
    const response = await api.get(`/chats/${chatId}`);
    return response.data;
  },

  getMessages: async (chatId, page = 1, limit = 50) => {
    const response = await api.get(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },

  sendMessage: async (chatId, content) => {
    const response = await api.post(`/chats/${chatId}/messages`, { content });
    return response.data;
  },

  createChat: async (type, participantIds, name) => {
    const response = await api.post('/chats', {
      type,
      participantIds,
      name
    });
    return response.data;
  },

  deleteChat: async (chatId) => {
    const response = await api.delete(`/chats/${chatId}`);
    return response.data;
  },
};

