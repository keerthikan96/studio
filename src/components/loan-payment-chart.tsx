
"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"

type DashboardCalendarProps = {
    selectedDate: Date;
    onDateChange: (date: Date | undefined) => void;
}

export function DashboardCalendar({ selectedDate, onDateChange }: DashboardCalendarProps) {
  const [month, setMonth] = React.useState<Date>(selectedDate);

  React.useEffect(() => {
    setMonth(selectedDate);
  }, [selectedDate]);

  const year = month.getFullYear();
  
  // Example holidays for demonstration
  const holidays = [
    new Date(year, 0, 1),   // New Year's Day
    new Date(year, 6, 4),   // Independence Day
    new Date(year, 11, 25), // Christmas Day
    new Date(year, 9, 17),  // A random holiday to match the user's image
  ];

  const holidayStyle = { 
    color: 'hsl(var(--accent-foreground))',
    backgroundColor: 'hsl(var(--accent))',
    borderRadius: '100%',
  };
  
  const todayStyle = {
    color: 'hsl(var(--primary-foreground))',
    backgroundColor: 'hsl(var(--primary))',
    borderRadius: '100%',
  }

  return (
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateChange}
        month={month}
        onMonthChange={setMonth}
        className="w-full p-0"
        classNames={{
            caption_label: "text-lg font-bold",
            head_cell: "w-10 font-normal text-sm",
            cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100",
            day_selected: "bg-primary/10 text-primary-foreground",
            day_today: "font-bold",
        }}
        modifiers={{ 
            holidays: holidays,
            today: new Date(),
        }}
        modifiersStyles={{ 
            holidays: holidayStyle,
            today: todayStyle
        }}
      />
  );
}
