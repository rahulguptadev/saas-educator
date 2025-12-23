import React, { useState, useEffect, useRef, useContext } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { FiSend, FiUsers, FiMessageCircle, FiX } from 'react-icons/fi';
import { format } from 'date-fns';
import './ChatPage.css';

const ChatPage = () => {
  const { user } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState('private');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    loadChats();
    loadAvailableUsers();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat._id);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages(selectedChat._id, true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const loadAvailableUsers = async () => {
    try {
      // Use the new available users endpoint that works for all roles
      const response = await userService.getAvailableUsers();
      setAvailableUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback: try to load students and teachers separately if available endpoint fails
      try {
        const [studentsRes, teachersRes] = await Promise.all([
          userService.getStudents().catch(() => ({ students: [] })),
          userService.getTeachers().catch(() => ({ teachers: [] }))
        ]);
        const allUsers = [...(studentsRes.students || []), ...(teachersRes.teachers || [])];
        const currentUserId = user?.id || user?._id;
        setAvailableUsers(allUsers.filter(u => u._id !== currentUserId && u.id !== currentUserId));
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setAvailableUsers([]);
      }
    }
  };

  const loadMessages = async (chatId, silent = false) => {
    try {
      const response = await chatService.getMessages(chatId);
      setMessages(response.messages);
      if (!silent) {
        await loadChats(); // Refresh chat list to update last message
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      await chatService.sendMessage(selectedChat._id, newMessage.trim());
      setNewMessage('');
      await loadMessages(selectedChat._id);
      await loadChats();
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCreateChat = async () => {
    if (newChatType === 'private' && selectedUsers.length !== 1) {
      alert('Please select exactly one user for private chat');
      return;
    }

    if (newChatType === 'group' && selectedUsers.length === 0) {
      alert('Please select at least one user for group chat');
      return;
    }

    if (newChatType === 'group' && !groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    try {
      const participantIds = selectedUsers.map(u => u._id);
      await chatService.createChat(newChatType, participantIds, groupName.trim() || undefined);
      setShowNewChatModal(false);
      setSelectedUsers([]);
      setGroupName('');
      await loadChats();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create chat');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.some(u => u._id === userId)) {
        return prev.filter(u => u._id !== userId);
      } else {
        const user = availableUsers.find(u => u._id === userId);
        return user ? [...prev, user] : prev;
      }
    });
  };

  const getChatName = (chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    }
    // Private chat - show other participant's name
    const currentUserId = user?.id || user?._id;
    const otherParticipant = chat.participants?.find(p => 
      p._id?.toString() !== currentUserId?.toString() && p.id?.toString() !== currentUserId?.toString()
    );
    return otherParticipant?.name || 'Private Chat';
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
      <div className="chat-page">
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2><FiMessageCircle /> Messages</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowNewChatModal(true)}
            >
              <FiUsers /> New Chat
            </button>
          </div>

          <div className="chat-list">
            {chats.length === 0 ? (
              <p className="empty-chat-list">No chats yet. Start a new conversation!</p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat._id}
                  className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="chat-item-header">
                    <h3>{getChatName(chat)}</h3>
                    {chat.unreadCount > 0 && (
                      <span className="unread-badge">{chat.unreadCount}</span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="chat-preview">
                      {chat.lastMessage.sender?.name}: {chat.lastMessage.content}
                    </p>
                  )}
                  <span className="chat-time">
                    {chat.lastMessage
                      ? format(new Date(chat.lastMessage.createdAt), 'MMM d, h:mm a')
                      : format(new Date(chat.updatedAt), 'MMM d, h:mm a')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chat-main">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <h2>{getChatName(selectedChat)}</h2>
                {selectedChat.type === 'group' && (
                  <div className="chat-participants">
                    {selectedChat.participants?.map(p => (
                      <span key={p._id} className="participant-tag">
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="messages-container">
                {messages.length === 0 ? (
                  <p className="empty-messages">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((message) => {
                    const currentUserId = user?.id || user?._id;
                    const isSent = message.sender._id?.toString() === currentUserId?.toString() || 
                                  message.sender.id?.toString() === currentUserId?.toString();
                    return (
                    <div
                      key={message._id}
                      className={`message ${isSent ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-sender">{message.sender.name}</span>
                          <span className="message-time">
                            {format(new Date(message.createdAt), 'h:mm a')}
                          </span>
                        </div>
                        <p>{message.content}</p>
                      </div>
                    </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="message-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="btn btn-primary send-button"
                  disabled={!newMessage.trim() || sending}
                >
                  <FiSend /> {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <FiMessageCircle size={64} />
              <h2>Select a chat to start messaging</h2>
              <p>Or create a new chat to get started</p>
            </div>
          )}
        </div>

        {/* New Chat Modal */}
        {showNewChatModal && (
          <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
            <div className="modal-content chat-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Chat</h2>
                <button className="modal-close" onClick={() => setShowNewChatModal(false)}>×</button>
              </div>

              <div className="form-group">
                <label className="form-label">Chat Type</label>
                <select
                  className="form-select"
                  value={newChatType}
                  onChange={(e) => {
                    setNewChatType(e.target.value);
                    setSelectedUsers([]);
                    setGroupName('');
                  }}
                >
                  <option value="private">Private Chat</option>
                  {user?.role === 'admin' && <option value="group">Group Chat</option>}
                </select>
              </div>

              {newChatType === 'group' && (
                <div className="form-group">
                  <label className="form-label">Group Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Select {newChatType === 'private' ? 'User' : 'Users'}
                </label>
                <div className="user-select-list">
                  {availableUsers.map((userItem) => (
                    <label key={userItem._id} className="user-select-item">
                      <input
                        type="checkbox"
                        checked={selectedUsers.some(u => u._id === userItem._id)}
                        onChange={() => toggleUserSelection(userItem._id)}
                        disabled={newChatType === 'private' && selectedUsers.length === 1 && !selectedUsers.some(u => u._id === userItem._id)}
                      />
                      <span>{userItem.name} ({userItem.role})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowNewChatModal(false);
                    setSelectedUsers([]);
                    setGroupName('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateChat}
                >
                  Create Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChatPage;

