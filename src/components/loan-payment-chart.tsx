
"use client"

import * as React from "react"
import { DayPicker, DropdownProps } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { getYear, setYear, setMonth, getMonth, lastDayOfMonth } from "date-fns";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);
const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];


function YearMonthForm({
  date,
  onChange,
}: {
  date: Date,
  onChange: (date: Date) => void,
}) {
  const handleYearChange = (year: string) => {
    const newDate = setYear(date, parseInt(year));
    // Prevent date from overflowing if the new month has fewer days
    const lastDay = lastDayOfMonth(newDate);
    if (newDate.getDate() > lastDay.getDate()) {
        onChange(lastDay);
    } else {
        onChange(newDate);
    }
  };

  const handleMonthChange = (month: string) => {
    const newDate = setMonth(date, parseInt(month));
    const lastDay = lastDayOfMonth(newDate);
    if (newDate.getDate() > lastDay.getDate()) {
        onChange(lastDay);
    } else {
        onChange(newDate);
    }
  };

  return (
    <div className="flex gap-2 mb-4">
        <Select value={getMonth(date).toString()} onValueChange={handleMonthChange}>
            <SelectTrigger>
                <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
                {months.map((month, i) => (
                    <SelectItem key={month} value={i.toString()}>
                        {month}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
         <Select value={getYear(date).toString()} onValueChange={handleYearChange}>
            <SelectTrigger>
                <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
                {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                        {year}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
  );
}


export function DashboardCalendar() {
  const [date, setDate] = React.useState<Date>(new Date());
  const [month, setMonth] = React.useState<Date>(new Date());

  const year = month.getFullYear();
  // Placeholder for holidays. In a real app, you'd fetch this data.
  const holidays = [
    // USA
    new Date(year, 0, 1), // New Year's Day
    new Date(year, 0, 15), // Martin Luther King, Jr. Day (example for 2024)
    new Date(year, 6, 4), // Independence Day
    new Date(year, 10, 28), // Thanksgiving (example for 2024)
    new Date(year, 11, 25), // Christmas

    // Canada
    new Date(year, 4, 20), // Victoria Day (example for 2024)
    new Date(year, 6, 1), // Canada Day
    new Date(year, 9, 14), // Thanksgiving (example for 2024)
    new Date(year, 10, 11), // Remembrance Day

    // Sri Lanka
    new Date(year, 0, 15), // Tamil Thai Pongal Day
    new Date(year, 1, 4), // National Day
    new Date(year, 3, 13), // Sinhala & Tamil New Year's Eve
    new Date(year, 3, 14), // Sinhala & Tamil New Year's Day
    new Date(year, 4, 1), // May Day
  ];

  const holidayStyle = { 
    border: '2px solid hsl(var(--primary))',
    borderRadius: '50%'
  };

  return (
    <>
      <Calendar
        mode="single"
        selected={date}
        onSelect={(newDate) => {
            if (newDate) {
                setDate(newDate);
                setMonth(newDate);
            }
        }}
        month={month}
        onMonthChange={setMonth}
        className="w-full"
        modifiers={{ holidays }}
        modifiersStyles={{ holidays: holidayStyle }}
        components={{
            Dropdown: (props) => (
              <YearMonthForm
                date={month}
                onChange={setMonth}
              />
            ),
          }}
          captionLayout="dropdown-buttons"
          fromYear={1990}
          toYear={currentYear}
      />
      <div className="flex items-center gap-2 text-sm mt-4 px-3">
        <span className="w-4 h-4 rounded-full border-2 border-primary" />
        <span>Public Holiday</span>
      </div>
    </>
  );
}

