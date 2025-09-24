
'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarView } from '@/components/calendar-view';
import { CalendarSidebar } from '@/components/calendar-sidebar';
import { Filter } from 'lucide-react';
import { Views } from 'react-big-calendar';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<any>(Views.MONTH);

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleViewChange = (newView: any) => {
    setView(newView);
  }

  const goToToday = () => {
    setCurrentDate(new Date());
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.12))]">
      <CalendarSidebar selectedDate={currentDate} onDateChange={handleDateChange} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
                <Button variant={view === Views.MONTH ? 'default' : 'outline'} onClick={() => handleViewChange(Views.MONTH)}>Month</Button>
                <Button variant={view === Views.WEEK ? 'default' : 'outline'} onClick={() => handleViewChange(Views.WEEK)}>Week</Button>
                <Button variant={view === Views.DAY ? 'default' : 'outline'} onClick={() => handleViewChange(Views.DAY)}>Day</Button>
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
        <CalendarView 
            currentDate={currentDate} 
            onNavigate={useCallback((newDate: Date) => setCurrentDate(newDate), [])}
            view={view}
            onView={useCallback((newView: any) => setView(newView), [])}
        />
      </div>
    </div>
  );
}
