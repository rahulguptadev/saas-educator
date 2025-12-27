const Class = require('../models/Class');

/**
 * Generate recurring class instances based on recurrence pattern
 * @param {Object} baseClassData - The base class data
 * @param {Object} recurrenceOptions - Recurrence configuration
 * @returns {Array} Array of class instances to create
 */
function generateRecurringClasses(baseClassData, recurrenceOptions) {
  const {
    recurrencePattern,
    recurrenceDays = [],
    recurrenceEndDate,
    recurrenceDuration,
    startTime
  } = recurrenceOptions;

  const classes = [];
  const startDate = new Date(startTime);
  let currentDate = new Date(startDate);
  
  // Calculate end date
  let endDate;
  if (recurrenceEndDate) {
    endDate = new Date(recurrenceEndDate);
  } else if (recurrenceDuration) {
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + recurrenceDuration);
  } else {
    // Default: 1 month if no end date specified
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
  }

  // Extract time from start date
  const startHour = startDate.getHours();
  const startMinute = startDate.getMinutes();

  // Safety limit to prevent infinite loops
  const MAX_CLASSES = 1000;
  let iterations = 0;

  if (recurrencePattern === 'daily') {
    // Daily recurrence
    while (currentDate <= endDate && iterations < MAX_CLASSES) {
      const classTime = new Date(currentDate);
      classTime.setHours(startHour, startMinute, 0, 0);
      
      if (classTime >= startDate && classTime <= endDate) {
        classes.push({
          ...baseClassData,
          scheduledTime: classTime
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
      iterations++;
    }
  } else if (recurrencePattern === 'weekly') {
    // Weekly recurrence - same day of week
    const dayOfWeek = startDate.getDay();
    // Start from the first occurrence
    currentDate = new Date(startDate);
    
    while (currentDate <= endDate && iterations < MAX_CLASSES) {
      const classTime = new Date(currentDate);
      classTime.setHours(startHour, startMinute, 0, 0);
      
      if (classTime >= startDate && classTime <= endDate) {
        classes.push({
          ...baseClassData,
          scheduledTime: classTime
        });
      }
      // Move to next week (same day)
      currentDate.setDate(currentDate.getDate() + 7);
      iterations++;
    }
  } else if (recurrencePattern === 'monthly') {
    // Monthly recurrence - same day of month
    const dayOfMonth = startDate.getDate();
    currentDate = new Date(startDate);
    
    while (currentDate <= endDate && iterations < MAX_CLASSES) {
      // Handle months with fewer days (e.g., Feb 30 -> Feb 28/29)
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const targetDay = Math.min(dayOfMonth, lastDayOfMonth);
      
      const classTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), targetDay);
      classTime.setHours(startHour, startMinute, 0, 0);
      
      if (classTime >= startDate && classTime <= endDate) {
        classes.push({
          ...baseClassData,
          scheduledTime: classTime
        });
      }
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      iterations++;
    }
  } else if (recurrencePattern === 'custom' && recurrenceDays.length > 0) {
    // Custom recurrence - specific days of week (e.g., MWF)
    // recurrenceDays: [1, 3, 5] for Monday, Wednesday, Friday
    currentDate = new Date(startDate);
    
    while (currentDate <= endDate && iterations < MAX_CLASSES) {
      const dayOfWeek = currentDate.getDay();
      
      if (recurrenceDays.includes(dayOfWeek)) {
        const classTime = new Date(currentDate);
        classTime.setHours(startHour, startMinute, 0, 0);
        
        if (classTime >= startDate && classTime <= endDate) {
          classes.push({
            ...baseClassData,
            scheduledTime: classTime
          });
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
      iterations++;
    }
  }

  return classes;
}

/**
 * Generate unique Jitsi room name and meeting link
 */
function generateJitsiRoom() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const jitsiRoomName = `class-${timestamp}-${random}`;
  const meetingLink = `https://meet.jit.si/${jitsiRoomName}`;
  return { jitsiRoomName, meetingLink };
}

module.exports = {
  generateRecurringClasses,
  generateJitsiRoom
};

