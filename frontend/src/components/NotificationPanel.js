import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiX, FiCheck, FiMessageCircle, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import { notificationService } from '../services/notificationService';
import './NotificationPanel.css';

const NotificationPanel = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    // Refresh every 5 seconds
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const allNotifications = await notificationService.getAllNotifications();
      const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      
      // Merge with stored notifications (preserve read status)
      const merged = allNotifications.map(notif => {
        const stored = storedNotifications.find(n => n.id === notif.id);
        return stored ? { ...notif, read: stored.read } : notif;
      });
      
      // Add any stored notifications that are no longer active but not read
      storedNotifications.forEach(stored => {
        if (!merged.find(n => n.id === stored.id) && !stored.read) {
          merged.push(stored);
        }
      });
      
      const sorted = merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const unread = sorted.filter(n => !n.read).length;
      
      setNotifications(sorted);
      setUnreadCount(unread);
      localStorage.setItem('notifications', JSON.stringify(sorted));
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback to stored notifications
      const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const unread = storedNotifications.filter(n => !n.read).length;
      setNotifications(storedNotifications);
      setUnreadCount(unread);
    }
  };

  const markAsRead = (notificationId) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
    setUnreadCount(0);
  };

  const clearNotification = (notificationId) => {
    const updated = notifications.filter(n => n.id !== notificationId);
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
    if (!notifications.find(n => n.id === notificationId)?.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="notification-panel-container" ref={panelRef}>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button
                  className="btn-mark-all-read"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <FiCheck /> Mark all read
                </button>
              )}
              <button
                className="btn-close-notifications"
                onClick={() => setIsOpen(false)}
              >
                <FiX />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">
                <FiBell size={32} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => {
                      if (notification.type === 'message' && notification.chatId) {
                        navigate('/chat');
                        markAsRead(notification.id);
                        setIsOpen(false);
                      } else if (notification.type === 'class' && notification.classId) {
                        navigate(`/classroom/${notification.classId}`);
                        markAsRead(notification.id);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="notification-icon">
                      {notification.type === 'message' ? <FiMessageCircle /> : <FiCalendar />}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.title}
                        {!notification.read && <span className="unread-dot"></span>}
                      </div>
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">
                        {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div className="notification-actions-item">
                      {!notification.read && (
                        <button
                          className="btn-mark-read"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          title="Mark as read"
                        >
                          <FiCheck />
                        </button>
                      )}
                      <button
                        className="btn-remove-notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                        title="Remove"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;

