import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { FiChevronLeft, FiChevronRight, FiVideo, FiCalendar } from 'react-icons/fi';
import './ClassCalendar.css';

const ClassCalendar = ({ classes = [], onClassClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get classes for a specific date
  const getClassesForDate = (date) => {
    return classes.filter(classItem => {
      const classDate = new Date(classItem.scheduledTime);
      return isSameDay(classDate, date);
    });
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get first day of month to determine offset
  const firstDayOfMonth = getDay(monthStart);
  const emptyDays = Array(firstDayOfMonth).fill(null);

  return (
    <div className="class-calendar">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={goToPreviousMonth}>
            <FiChevronLeft />
          </button>
          <h3 className="calendar-month-year">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <button className="calendar-nav-btn" onClick={goToNextMonth}>
            <FiChevronRight />
          </button>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={goToToday}>
          Today
        </button>
      </div>

      <div className="calendar-grid">
        {/* Day names header */}
        <div className="calendar-weekdays">
          {dayNames.map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="calendar-days">
          {/* Empty cells for days before month starts */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="calendar-day empty-day"></div>
          ))}

          {/* Days of the month */}
          {daysInMonth.map(day => {
            const dayClasses = getClassesForDate(day);
            const isToday = isSameDay(day, new Date());
            const isPast = day < new Date() && !isToday;

            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${dayClasses.length > 0 ? 'has-classes' : ''}`}
              >
                <div className="calendar-day-number">
                  {format(day, 'd')}
                </div>
                {dayClasses.length > 0 && (
                  <div className="calendar-day-classes">
                    {dayClasses.slice(0, 3).map((classItem, idx) => {
                      const classTime = format(new Date(classItem.scheduledTime), 'h:mm a');
                      return (
                        <div
                          key={classItem._id}
                          className={`calendar-class-dot ${classItem.status === 'ongoing' ? 'ongoing' : ''}`}
                          title={`${classItem.title} at ${classTime}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onClassClick) onClassClick(classItem);
                          }}
                        >
                          <span className="class-time">{classTime}</span>
                          <span className="class-title">{classItem.title}</span>
                        </div>
                      );
                    })}
                    {dayClasses.length > 3 && (
                      <div className="calendar-more-classes">
                        +{dayClasses.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot ongoing"></span>
          <span>Ongoing</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot scheduled"></span>
          <span>Scheduled</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot completed"></span>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
};

export default ClassCalendar;

