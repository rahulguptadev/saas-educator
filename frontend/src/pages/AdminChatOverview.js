import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { chatService } from '../services/chatService';
import { FiMessageCircle, FiUsers, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import './AdminChatOverview.css';

const AdminChatOverview = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, private, group

  useEffect(() => {
    loadChats();
    // Refresh every 5 seconds
    const interval = setInterval(loadChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadChats = async () => {
    try {
      const response = await chatService.getChats();
      setChats(response.chats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChatName = (chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    }
    // Private chat - show participant names
    const participants = chat.participants || [];
    return participants.map(p => p.name).join(' & ') || 'Private Chat';
  };

  const getChatTypeIcon = (chat) => {
    return chat.type === 'group' ? <FiUsers /> : <FiUser />;
  };

  const filteredChats = chats.filter(chat => {
    if (filter === 'all') return true;
    return chat.type === filter;
  });

  if (loading) {
    return (
      <Layout>
        <div className="spinner"></div>
      </Layout>
    );
  }

  const privateChats = chats.filter(c => c.type === 'private').length;
  const groupChats = chats.filter(c => c.type === 'group').length;

  return (
    <Layout>
      <div className="admin-chat-overview">
        <div className="overview-header">
          <h1>Chat Overview</h1>
          <div className="chat-stats">
            <div className="stat-item">
              <span className="stat-label">Total Chats:</span>
              <span className="stat-value">{chats.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Private:</span>
              <span className="stat-value">{privateChats}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Groups:</span>
              <span className="stat-value">{groupChats}</span>
            </div>
          </div>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Chats ({chats.length})
          </button>
          <button
            className={`filter-tab ${filter === 'private' ? 'active' : ''}`}
            onClick={() => setFilter('private')}
          >
            Private ({privateChats})
          </button>
          <button
            className={`filter-tab ${filter === 'group' ? 'active' : ''}`}
            onClick={() => setFilter('group')}
          >
            Groups ({groupChats})
          </button>
        </div>

        <div className="chats-grid">
          {filteredChats.length === 0 ? (
            <div className="empty-state">
              <FiMessageCircle size={64} />
              <p>No {filter === 'all' ? '' : filter} chats found</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat._id}
                className="chat-overview-card"
                onClick={() => navigate('/chat')}
              >
                <div className="chat-card-header">
                  <div className="chat-type-icon">
                    {getChatTypeIcon(chat)}
                  </div>
                  <div className="chat-info">
                    <h3>{getChatName(chat)}</h3>
                    <span className={`chat-type-badge ${chat.type}`}>
                      {chat.type === 'group' ? 'Group' : 'Private'}
                    </span>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">{chat.unreadCount}</span>
                  )}
                </div>

                <div className="chat-participants-list">
                  <strong>Participants:</strong>
                  <div className="participants">
                    {chat.participants?.map((p, idx) => (
                      <span key={p._id} className="participant-name">
                        {p.name} ({p.role})
                        {idx < chat.participants.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>

                {chat.lastMessage && (
                  <div className="last-message-preview">
                    <strong>{chat.lastMessage.sender?.name}:</strong>
                    <span> {chat.lastMessage.content}</span>
                  </div>
                )}

                <div className="chat-meta">
                  <span className="chat-time">
                    {chat.lastMessage
                      ? format(new Date(chat.lastMessage.createdAt), 'MMM d, yyyy h:mm a')
                      : format(new Date(chat.updatedAt), 'MMM d, yyyy h:mm a')}
                  </span>
                  {chat.createdBy && (
                    <span className="created-by">
                      Created by: {chat.createdBy.name}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminChatOverview;

