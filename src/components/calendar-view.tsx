
'use client';

import { cn } from '@/lib/utils';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

const events = [
  { date: new Date(2023, 7, 2), time: '01:00pm', title: 'Go to...', color: 'bg-red-500' },
  { date: new Date(2023, 7, 3), time: '01:00pm', title: 'Design C...', color: 'bg-blue-500' },
  { date: new Date(2023, 7, 3), time: '03:30pm', title: 'Weekly...', color: 'bg-yellow-500' },
  { date: new Date(2023, 7, 5), time: '07:30am', title: 'Lunch', color: 'bg-green-500' },
  { date: new Date(2023, 7, 5), time: '10:30am', title: 'Meeti...', color: 'bg-blue-500' },
  { date: new Date(2023, 7, 8), time: '07:30am', title: 'Weekly...', color: 'bg-yellow-500' },
  { date: new Date(2023, 7, 9), time: '09:00am', title: 'Desig...', color: 'bg-blue-500' },
  { date: new Date(2023, 7, 10), time: '07:45am', title: 'Standup...', color: 'bg-blue-500' },
  { date: new Date(2023, 7, 11), time: '07:30am', title: 'Breakfast', color: 'bg-green-500' },
  { date: new Date(2023, 7, 12), time: '08:45am', title: 'Prototyp...', color: 'bg-blue-500' },
  { date: new Date(2023, 7, 15), time: '01:00pm', title: 'P2P Zoom', color: 'bg-red-500' },
  { date: new Date(2023, 7, 16), time: '07:30am', title: 'Lunch', color: 'bg-green-500' },
  { date: new Date(2023, 7, 17), time: '07:30am', title: 'Group-...', color: 'bg-yellow-500' },
  { date: new Date(2023, 7, 22), time: '01:00pm', title: 'Group-W...', color: 'bg-yellow-500' },
  { date: new Date(2023, 7, 25), time: '07:30am', title: 'Reuni...', color: 'bg-red-500' },
  { date: new Date(2023, 7, 25), time: '10:30am', title: 'Design Cl...', color: 'bg-blue-500' },
  { date: new Date(2023, 7, 30), time: '07:30am', title: 'Breakfast', color: 'bg-green-500' },
];

const getEventsForDate = (date: Date) => {
    // For this example, we'll use the hardcoded 2023 events and just match the day and month.
    return events.filter(e => 
        e.date.getMonth() === date.getMonth() &&
        e.date.getDate() === date.getDate()
    );
}

type CalendarViewProps = {
  currentDate: Date;
};

export function CalendarView({ currentDate }: CalendarViewProps) {
  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDay),
    end: endOfWeek(lastDay),
  });
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b">
        {weekdays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-5 flex-1">
        {daysInMonth.map((day, i) => (
          <div
            key={i}
            className={cn('border-b border-r p-2 flex flex-col', {
              'bg-muted/30': !isSameMonth(day, currentDate),
            })}
          >
            <span
              className={cn('font-medium', {
                'text-muted-foreground': !isSameMonth(day, currentDate),
                'text-primary font-bold': isToday(day),
              })}
            >
              {format(day, 'd')}
            </span>
            <div className="mt-1 space-y-1 overflow-y-auto">
              {getEventsForDate(day).map((event, eventIdx) => (
                <div key={eventIdx} className="flex items-center gap-1.5 text-xs rounded p-1" style={{ backgroundColor: `${event.color.replace('bg-', 'var(--tw-color-')}/0.1`}}>
                   <div className={cn('w-1 h-full rounded-full', event.color)} />
                   <span className="font-medium text-gray-600">{event.time}</span>
                   <span className="truncate">{event.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
