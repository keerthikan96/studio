'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Cake, Gift, MapPin, Clock, Calendar } from "lucide-react";
import { useMemo } from "react";

// Mock date-fns functions
const isSameDay = (date1, date2) => {
  return date1.toDateString() === date2.toDateString();
};

const format = (date, formatStr) => {
  const options = {
    'MMMM d': { month: 'long', day: 'numeric' },
    'd MMM': { day: 'numeric', month: 'short' }
  };
  return date.toLocaleDateString('en-US', options[formatStr] || {});
};

const isToday = (date) => {
  return isSameDay(date, new Date());
};

const isFuture = (date) => {
  return date > new Date();
};

const startOfToday = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

export type Event = {
  id: string;
  type: 'birthday' | 'anniversary';
  name: string;
  avatar: string;
  date: Date;
  yearsOfService?: number;
  department?: string;
}

const EventItem = ({ event, showDate = false }) => {
  const description = event.type === 'anniversary'
    ? `${event.yearsOfService} year${event.yearsOfService !== 1 ? 's' : ''} work anniversary`
    : 'Birthday celebration';
  
  const eventIcon = event.type === 'birthday' ? 
    <Cake className="h-4 w-4 text-pink-500" /> : 
    <Gift className="h-4 w-4 text-blue-500" />;

  const eventColor = event.type === 'birthday' ? 'bg-pink-50 border-pink-200 hover:bg-pink-100' : 'bg-blue-50 border-blue-200 hover:bg-blue-100';
  
  return (
    <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${eventColor}`}>
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
            <AvatarImage src={event.avatar} alt={event.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold text-sm">
              {event.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
            {eventIcon}
          </div>
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-grow">
              <h4 className="font-semibold text-gray-900 truncate text-sm">{event.name}</h4>
              <p className="text-xs text-gray-600 mt-0.5">{description}</p>
              {event.department && (
                <div className="flex items-center gap-1 mt-1.5">
                  <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{event.department}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              {showDate && (
                <Badge variant="outline" className="text-xs font-medium px-2 py-0.5">
                  {format(event.date, 'd MMM')}
                </Badge>
              )}
              <Badge 
                variant="secondary" 
                className={`text-xs px-2 py-0.5 ${event.type === 'birthday' ? 'bg-pink-100 text-pink-700 hover:bg-pink-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
              >
                {event.type === 'birthday' ? 'Birthday' : 'Anniversary'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type DashboardEventsProps = {
  selectedDate: Date;
  allEvents: Event[];
}

export function DashboardEvents({ selectedDate, allEvents }: DashboardEventsProps) {
  const eventsForDay = useMemo(() => {
    return allEvents.filter(event => isSameDay(event.date, selectedDate));
  }, [selectedDate, allEvents]);

  const upcomingEvents = useMemo(() => {
    const today = startOfToday();
    return allEvents
      .filter(event => isFuture(event.date) || isToday(event.date))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 6); // Limit to 6 upcoming events for better fit
  }, [allEvents]);

  const dayTitle = isToday(selectedDate) 
    ? "Today's Events" 
    : `Events for ${format(selectedDate, 'MMMM d')}`;

  return (
    <Card className="h-full border border-gray-200 shadow-sm bg-white">
      <Tabs defaultValue="onThisDay" className="w-full h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <CardTitle className="text-lg text-gray-900">Events</CardTitle>
          </div>
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1 h-9">
            <TabsTrigger value="onThisDay" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
              This Day
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
              Upcoming
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <div className="flex-grow overflow-hidden">
          <TabsContent value="onThisDay" className="mt-0 h-full">
            <CardContent className="pt-0 h-full flex flex-col">
              <div className="mb-3 flex-shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                  <CardTitle className="text-base">{dayTitle}</CardTitle>
                </div>
                <CardDescription className="text-gray-600 text-sm">
                  Birthdays and anniversaries for the selected day
                </CardDescription>
              </div>
              
              <div className="flex-grow overflow-hidden">
                {eventsForDay.length > 0 ? (
                  <div className="space-y-2.5 h-full overflow-y-auto pr-1">
                    {eventsForDay.map(event => (
                      <EventItem key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium text-sm">No events on this day</p>
                    <p className="text-xs text-gray-400 mt-1">Check upcoming tab for future events</p>
                  </div>
                )}
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-0 h-full">
            <CardContent className="pt-0 h-full flex flex-col">
              <div className="mb-3 flex-shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-3.5 w-3.5 text-gray-500" />
                  <CardTitle className="text-base">Upcoming Events</CardTitle>
                </div>
                <CardDescription className="text-gray-600 text-sm">
                  Next birthdays and work anniversaries
                </CardDescription>
              </div>
              
              <div className="flex-grow overflow-hidden">
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-2.5 h-full overflow-y-auto pr-1">
                    {upcomingEvents.map(event => (
                      <EventItem key={event.id} event={event} showDate={true} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <Gift className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium text-sm">No upcoming events</p>
                    <p className="text-xs text-gray-400 mt-1">All caught up for now!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </TabsContent>
        </div>
      </Tabs>

      <style jsx>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </Card>
  );
}