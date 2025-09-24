
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarView } from '@/components/calendar-view';
import { CalendarSidebar } from '@/components/calendar-sidebar';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };
  
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.12))]">
      <CalendarSidebar selectedDate={currentDate} onDateChange={handleDateChange} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={goToToday}>Today</Button>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
                 <Button variant="default">
                    + Add Event
                </Button>
            </div>
        </header>
        <CalendarView currentDate={currentDate} />
      </div>
    </div>
  );
}
