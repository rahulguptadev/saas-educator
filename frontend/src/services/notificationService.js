// Notification service to generate notifications from various sources
import { chatService } from './chatService';
import { classService } from './classService';

export const notificationService = {
  // Generate notifications from chats (unread messages)
  getChatNotifications: async () => {
    try {
      const response = await chatService.getChats();
      const notifications = [];
      
      response.chats.forEach(chat => {
        if (chat.unreadCount > 0 && chat.lastMessage) {
          notifications.push({
            id: `chat-${chat._id}`,
            type: 'message',
            title: 'New Message',
            message: `${chat.lastMessage.sender?.name}: ${chat.lastMessage.content}`,
            chatId: chat._id,
            createdAt: chat.lastMessage.createdAt,
            read: false
          });
        }
      });
      
      return notifications;
    } catch (error) {
      console.error('Error getting chat notifications:', error);
      return [];
    }
  },

  // Generate notifications from upcoming classes
  getClassNotifications: async () => {
    try {
      const response = await classService.getClasses();
      const notifications = [];
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      response.classes.forEach(classItem => {
        const scheduledTime = new Date(classItem.scheduledTime);
        const fiveMinutesBefore = new Date(scheduledTime.getTime() - 5 * 60 * 1000);
        
        // Notify if class starts within 1 hour and hasn't started yet
        if (scheduledTime <= oneHourFromNow && scheduledTime > now) {
          const minutesUntil = Math.floor((scheduledTime - now) / 60000);
          notifications.push({
            id: `class-${classItem._id}`,
            type: 'class',
            title: 'Upcoming Class',
            message: `Class "${classItem.title}" starts in ${minutesUntil} minutes`,
            classId: classItem._id,
            createdAt: now.toISOString(),
            read: false
          });
        }
      });
      
      return notifications;
    } catch (error) {
      console.error('Error getting class notifications:', error);
      return [];
    }
  },

  // Get all notifications
  getAllNotifications: async () => {
    try {
      const [chatNotifications, classNotifications] = await Promise.all([
        notificationService.getChatNotifications(),
        notificationService.getClassNotifications()
      ]);
      
      // Combine and sort by date
      const allNotifications = [...chatNotifications, ...classNotifications]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Store in localStorage
      const existing = JSON.parse(localStorage.getItem('notifications') || '[]');
      const existingIds = new Set(existing.map(n => n.id));
      
      // Add new notifications
      allNotifications.forEach(notif => {
        if (!existingIds.has(notif.id)) {
          existing.push(notif);
        }
      });
      
      // Remove old notifications (older than 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const filtered = existing.filter(n => new Date(n.createdAt) > sevenDaysAgo);
      
      localStorage.setItem('notifications', JSON.stringify(filtered));
      return filtered;
    } catch (error) {
      console.error('Error getting all notifications:', error);
      return [];
    }
  }
};

