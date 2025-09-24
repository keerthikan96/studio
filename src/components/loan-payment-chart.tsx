
"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { getYear } from "date-fns";

const currentYear = new Date().getFullYear();

type DashboardCalendarProps = {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

export function DashboardCalendar({ selectedDate, onDateChange }: DashboardCalendarProps) {
  const [month, setMonth] = React.useState<Date>(selectedDate);

  // When the selectedDate prop changes from the outside, update the month being displayed
  React.useEffect(() => {
    setMonth(selectedDate);
  }, [selectedDate]);

  const year = month.getFullYear();
  // Placeholder for holidays. In a real app, you'd fetch this data.
  const holidays = [
    // USA
    new Date(year, 0, 1), // New Year's Day
    new Date(year, 0, 15), // Martin Luther King, Jr. Day (example for 2024)
    new Date(year, 6, 4), // Independence Day
    new Date(year, 11, 25), // Christmas

    // Canada
    new Date(year, 4, 20), // Victoria Day (example for 2024)
    new Date(year, 6, 1), // Canada Day
    new Date(year, 10, 11), // Remembrance Day

    // Sri Lanka
    new Date(year, 0, 15), // Tamil Thai Pongal Day
    new Date(year, 1, 4), // National Day
    new Date(year, 3, 13), // Sinhala & Tamil New Year's Eve
    new Date(year, 3, 14), // Sinhala & Tamil New Year's Day
    new Date(year, 4, 1), // May Day
  ];

  const holidayStyle = { 
    backgroundColor: 'hsl(var(--accent) / 0.1)',
    color: 'hsl(var(--accent-foreground))',
  };

  return (
    <>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(newDate) => newDate && onDateChange(newDate)}
        month={month}
        onMonthChange={setMonth}
        className="w-full"
        modifiers={{ holidays }}
        modifiersStyles={{ holidays: holidayStyle }}
        captionLayout="dropdown-buttons"
        fromYear={1990}
        toYear={currentYear + 5}
      />
      <div className="flex items-center gap-2 text-sm mt-4 px-3">
        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(var(--accent) / 0.1)' }} />
        <span>Public Holiday</span>
      </div>
    </>
  );
}
