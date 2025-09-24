
"use client"

import * as React from "react"
import { DayPicker, DropdownProps } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { format, getYear, setYear, setMonth, getMonth } from "date-fns";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);
const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];


function YearMonthForm({
  date,
  locale,
  onChange,
}: DropdownProps & { onChange: (date: Date) => void }) {
  
  const handleYearChange = (year: string) => {
    onChange(setYear(date, parseInt(year)));
  };

  const handleMonthChange = (month: string) => {
    onChange(setMonth(date, parseInt(month)));
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
  const [date, setDate] = React.useState<Date>(new Date())

  // Placeholder for holidays. In a real app, you'd fetch this data.
  const holidays = [
    new Date(date.getFullYear(), 0, 1), // New Year's Day
    new Date(date.getFullYear(), 6, 4), // Independence Day
    new Date(date.getFullYear(), 11, 25), // Christmas
  ];

  const holidayStyle = { 
    border: '2px solid hsl(var(--primary))',
    borderRadius: '50%'
  };

  return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={(newDate) => newDate && setDate(newDate)}
        className="w-full"
        modifiers={{ holidays }}
        modifiersStyles={{ holidays: holidayStyle }}
        components={{
            Dropdown: (props) => (
              <YearMonthForm
                {...props}
                onChange={(newDate) => {
                  setDate(newDate);
                  props.onChange?.(newDate);
                }}
              />
            ),
          }}
          captionLayout="dropdown-buttons"
          fromYear={1990}
          toYear={currentYear}
      />
  );
}
