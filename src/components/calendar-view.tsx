
'use client';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, dateFnsLocalizer, EventProps } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const placeholderEvents = [
  { start: new Date(2023, 7, 3, 13, 30), end: new Date(2023, 7, 3, 14, 30), title: 'Design C...', resource: 'work' },
  { start: new Date(2023, 7, 3, 15, 30), end: new Date(2023, 7, 3, 16, 30), title: 'Weekly...', resource: 'meeting' },
  { start: new Date(2023, 7, 5, 7, 30), end: new Date(2023, 7, 5, 8, 30), title: 'Lunch', resource: 'personal' },
  { start: new Date(2023, 7, 5, 10, 30), end: new Date(2023, 7, 5, 11, 30), title: 'Meeti...', resource: 'work' },
  { start: new Date(2023, 7, 10, 9, 0), end: new Date(2023, 7, 10, 10, 0), title: 'Birthday Party', resource: 'birthday' },
];

const eventColorMap: { [key: string]: string } = {
  work: 'bg-blue-500',
  meeting: 'bg-yellow-500',
  personal: 'bg-green-500',
  birthday: 'bg-purple-500',
  default: 'bg-gray-500',
}

const CustomEvent = ({ event }: EventProps) => {
    const colorClass = event.resource ? eventColorMap[event.resource] ?? eventColorMap.default : eventColorMap.default;
    return (
        <div className={cn('p-1 text-white rounded-md text-xs', colorClass)}>
            {event.title}
        </div>
    );
};


type CalendarViewProps = {
  currentDate: Date;
  onNavigate: (newDate: Date) => void;
  view: any;
  onView: (newView: any) => void;
};

export function CalendarView({ currentDate, onNavigate, view, onView }: CalendarViewProps) {
  
  // To make the demo work, we'll map the 2023 events to the current year and month.
  const events = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    return placeholderEvents.map(event => {
        const start = new Date(event.start);
        const newStart = new Date(
            currentYear,
            currentMonth,
            start.getDate(),
            start.getHours(),
            start.getMinutes()
        );
        
        const end = new Date(event.end);
        const newEnd = new Date(
            currentYear,
            currentMonth,
            end.getDate(),
            end.getHours(),
            end.getMinutes()
        );

        return { ...event, start: newStart, end: newEnd };
    });
  }, [currentDate]);

  return (
    <div className="flex-1 p-4">
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            onNavigate={onNavigate}
            view={view}
            onView={onView}
            components={{
                event: CustomEvent
            }}
            eventPropGetter={(event) => ({
                 className: cn(
                    'p-1 text-white rounded-md text-xs',
                    event.resource ? eventColorMap[event.resource] ?? eventColorMap.default : eventColorMap.default
                )
            })}
        />
    </div>
  );
}
