import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import "./CalendarView.css";

const CalendarView = ({ schedules }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get calendar data
  const { year, month, daysInMonth, firstDayOfMonth } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    return { year, month, daysInMonth, firstDayOfMonth };
  }, [currentDate]);

  // Map schedules to dates
  const schedulesByDate = useMemo(() => {
    const map = {};
    
    schedules.forEach((schedule) => {
      let dateKey = null;
      
      // Try to parse date from tanggal field
      if (schedule.tanggal) {
        const date = new Date(schedule.tanggal);
        if (!isNaN(date.getTime())) {
          dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
      }
      
      // Fallback to hari field for recurring schedules
      if (!dateKey && schedule.hari) {
        const dayMap = {
          'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 
          'Jumat': 5, 'Sabtu': 6, 'Minggu': 0
        };
        const targetDay = dayMap[schedule.hari];
        
        // Find all occurrences of this day in current month
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          if (date.getDay() === targetDay) {
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (!map[key]) map[key] = [];
            map[key].push({ ...schedule, isRecurring: true });
          }
        }
        return;
      }
      
      if (dateKey) {
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(schedule);
      }
    });
    
    return map;
  }, [schedules, year, month, daysInMonth]);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const getDateKey = (day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const day = i - firstDayOfMonth + 1;
      const isCurrentMonth = day > 0 && day <= daysInMonth;
      const dateKey = isCurrentMonth ? getDateKey(day) : null;
      const daySchedules = dateKey ? schedulesByDate[dateKey] : null;
      const hasSchedule = daySchedules && daySchedules.length > 0;

      days.push(
        <div
          key={i}
          className={`calendar-day ${!isCurrentMonth ? "other-month" : ""} ${
            isToday(day) && isCurrentMonth ? "today" : ""
          } ${hasSchedule ? "has-schedule" : ""}`}
        >
          {isCurrentMonth && (
            <>
              <div className="day-number">{day}</div>
              {hasSchedule && (
                <div className="day-schedules">
                  {daySchedules.slice(0, 2).map((schedule, idx) => (
                    <div
                      key={idx}
                      className={`schedule-dot ${schedule.status?.toLowerCase() || "pending"}`}
                      title={`${schedule.hari || ""} - ${schedule.status || "Pending"}`}
                    >
                      <span className="schedule-label">
                        {schedule.jam || schedule.waktu_mulai?.substring(0, 5) || ""}
                      </span>
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <div className="more-indicator">+{daySchedules.length - 2}</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-view-container">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <button onClick={handlePrevMonth} className="nav-btn">
            <ChevronLeft size={20} />
          </button>
          <h2 className="calendar-title">
            {monthNames[month]} {year}
          </h2>
          <button onClick={handleNextMonth} className="nav-btn">
            <ChevronRight size={20} />
          </button>
        </div>
        <button onClick={handleToday} className="today-btn">
          <Calendar size={16} />
          Hari Ini
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Day Names */}
        {dayNames.map((day) => (
          <div key={day} className="calendar-day-name">
            {day}
          </div>
        ))}
        {/* Calendar Days */}
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <h3>Status:</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-dot pending"></div>
            <span>Pending</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot dijadwalkan"></div>
            <span>Dijadwalkan</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot selesai"></div>
            <span>Selesai</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot dibatalkan"></div>
            <span>Dibatalkan</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
