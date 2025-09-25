"use client"

import React, { useState } from "react";

// Mock date-fns functions for this demo
const format = (date, formatStr) => {
  const options = {
    'MMM yyyy': { month: 'short', year: 'numeric' }
  };
  return date.toLocaleDateString('en-US', options[formatStr] || {});
};

const isSameDay = (date1, date2) => {
  return date1.toDateString() === date2.toDateString();
};

const isToday = (date) => {
  return isSameDay(date, new Date());
};

type DashboardCalendarProps = {
  selectedDate: Date;
  onDateChange: (date: Date | undefined) => void;
}

export function DashboardCalendar({ selectedDate, onDateChange }: DashboardCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const today = new Date();
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  }
  
  const isSelectedDate = (date) => {
    return date && selectedDate && isSameDay(date, selectedDate);
  };
  
  const isTodayDate = (date) => {
    return date && isSameDay(date, today);
  };
  
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };
  
  // Example holidays
  const year = currentDate.getFullYear();
  const holidays = [
    new Date(year, 0, 1),   // New Year's Day
    new Date(year, 6, 4),   // Independence Day
    new Date(year, 11, 25), // Christmas Day
  ];
  
  const isHoliday = (date) => {
    return date && holidays.some(holiday => isSameDay(date, holiday));
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="font-semibold text-lg">
            {format(currentDate, 'MMM yyyy')}
          </h3>
          <button 
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Days of the week */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7">
        {days.map((date, index) => (
          <button
            key={index}
            onClick={() => date && onDateChange(date)}
            className={`
              aspect-square p-2 text-sm font-medium transition-all duration-150 relative border-r border-b border-gray-100 last:border-r-0
              ${!date ? 'cursor-default' : 'hover:bg-gray-50 active:bg-gray-100'}
              ${isSelectedDate(date) ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
              ${isTodayDate(date) && !isSelectedDate(date) ? 'bg-blue-50 text-blue-600 font-bold ring-2 ring-blue-200 ring-inset' : ''}
              ${isHoliday(date) && !isSelectedDate(date) && !isTodayDate(date) ? 'bg-red-50 text-red-600' : ''}
              ${date && !isTodayDate(date) && !isSelectedDate(date) && !isHoliday(date) ? 'text-gray-700 hover:text-gray-900' : ''}
              ${!date ? 'text-gray-300' : ''}
            `}
            disabled={!date}
          >
            <span className="relative z-10">
              {date ? date.getDate() : ''}
            </span>
            {isTodayDate(date) && !isSelectedDate(date) && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            )}
            {isHoliday(date) && !isSelectedDate(date) && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}