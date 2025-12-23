import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { FiMessageCircle, FiArrowRight } from 'react-icons/fi';
import { format } from 'date-fns';
import './ChatWidget.css';

const ChatWidget = ({ limit = 3 }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadRecentChats();
    // Refresh every 10 seconds
    const interval = setInterval(loadRecentChats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRecentChats = async () => {
    try {
      const response = await chatService.getChats();
      const sortedChats = response.chats.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.updatedAt;
        const bTime = b.lastMessage?.createdAt || b.updatedAt;
        return new Date(bTime) - new Date(aTime);
      });
      setChats(sortedChats.slice(0, limit));
      
      // Calculate total unread count
      const totalUnread = response.chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
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
    // For private chats, show the other participant's name
    const participants = chat.participants || [];
    const currentUserId = user?.id || user?._id;
    const otherParticipant = participants.find(p => 
      p._id?.toString() !== currentUserId?.toString() && p.id?.toString() !== currentUserId?.toString()
    );
    return otherParticipant?.name || 'Private Chat';
  };

  if (loading) {
    return (
      <div className="chat-widget">
        <div className="spinner-small"></div>
      </div>
    );
  }

  return (
    <div className="chat-widget">
      <div className="chat-widget-header">
        <h3>
          <FiMessageCircle /> Recent Chats
          {unreadCount > 0 && (
            <span className="unread-badge-header">{unreadCount}</span>
          )}
        </h3>
        <button 
          className="btn-view-all"
          onClick={() => navigate('/chat')}
        >
          View All <FiArrowRight />
        </button>
      </div>

      <div className="chat-widget-list">
        {chats.length === 0 ? (
          <div className="empty-chat-widget">
            <p>No chats yet</p>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/chat')}
            >
              Start a Chat
            </button>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat._id}
              className="chat-widget-item"
              onClick={() => navigate('/chat')}
            >
              <div className="chat-widget-item-header">
                <span className="chat-widget-name">
                  {getChatName(chat)}
                  {chat.type === 'group' && (
                    <span className="chat-type-indicator">Group</span>
                  )}
                </span>
                {chat.unreadCount > 0 && (
                  <span className="unread-badge-small">{chat.unreadCount}</span>
                )}
              </div>
              {chat.lastMessage && (
                <p className="chat-widget-preview">
                  {chat.lastMessage.sender?.name}: {chat.lastMessage.content}
                </p>
              )}
              <span className="chat-widget-time">
                {chat.lastMessage
                  ? format(new Date(chat.lastMessage.createdAt), 'MMM d, h:mm a')
                  : format(new Date(chat.updatedAt), 'MMM d, h:mm a')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatWidget;

