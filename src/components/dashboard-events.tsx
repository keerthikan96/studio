
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cake, Gift } from "lucide-react";
import { isSameDay, format, isToday, isFuture, startOfToday } from 'date-fns';
import { useMemo } from "react";

type Event = {
    id: string;
    type: 'birthday' | 'anniversary';
    name: string;
    avatar: string;
    date: Date;
    yearsOfService?: number;
}

const allEvents: Event[] = [
  {
    id: "bday1",
    type: "birthday",
    name: "Jane Cooper",
    avatar: "https://i.pravatar.cc/40?u=bday1",
    date: new Date(),
  },
  {
    id: "anniv1",
    type: "anniversary",
    name: "Robert Fox",
    avatar: "https://i.pravatar.cc/40?u=anniv1",
    date: new Date(),
    yearsOfService: 5,
  },
  {
    id: "bday2",
    type: "birthday",
    name: "Wade Warren",
    avatar: "https://i.pravatar.cc/40?u=bday2",
    date: new Date(new Date().setDate(new Date().getDate() + 2)),
  },
  {
    id: "anniv2",
    type: "anniversary",
    name: "Esther Howard",
    avatar: "https://i.pravatar.cc/40?u=anniv2",
    date: new Date(new Date().setDate(new Date().getDate() + 5)),
    yearsOfService: 3,
  },
  {
    id: "bday3",
    type: "birthday",
    name: "Cameron Williamson",
    avatar: "https://i.pravatar.cc/40?u=bday3",
    date: new Date(new Date().setDate(new Date().getDate() + 7)),
  },
];


const EventItem = ({ event, showDate = false }: { event: Event, showDate?: boolean }) => {
    const description = event.type === 'anniversary'
        ? `${event.yearsOfService} year${event.yearsOfService !== 1 ? 's' : ''} work anniversary`
        : 'Birthday';
    
    return (
        <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
                <AvatarImage src={event.avatar} alt={event.name} />
                <AvatarFallback>{event.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <p className="font-medium text-sm">{event.name}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className="text-right">
                {showDate && <p className="text-sm font-medium">{format(event.date, 'd MMM')}</p>}
                 {event.type === 'birthday' ? 
                    <Cake className="h-5 w-5 text-pink-500 inline-block" /> : 
                    <Gift className="h-5 w-5 text-indigo-500 inline-block" />}
            </div>
        </div>
    );
};

type DashboardEventsProps = {
    selectedDate: Date;
}

export function DashboardEvents({ selectedDate }: DashboardEventsProps) {

    const eventsForDay = useMemo(() => {
        return allEvents.filter(event => isSameDay(event.date, selectedDate));
    }, [selectedDate]);

    const upcomingEvents = useMemo(() => {
        const today = startOfToday();
        return allEvents
            .filter(event => isFuture(event.date) || isToday(event.date))
            .sort((a,b) => a.date.getTime() - b.date.getTime());
    }, []);

    const dayTitle = isToday(selectedDate) 
        ? "Today's Events" 
        : `Events for ${format(selectedDate, 'MMMM d')}`;

    return (
        <Card>
            <Tabs defaultValue="onThisDay" className="w-full">
                <CardHeader>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="onThisDay">On this Day</TabsTrigger>
                        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    </TabsList>
                </CardHeader>

                <TabsContent value="onThisDay">
                    <CardHeader className="pt-0">
                         <CardTitle>{dayTitle}</CardTitle>
                         <CardDescription>
                            Birthdays and anniversaries for the selected day.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {eventsForDay.length > 0 ? (
                            eventsForDay.map(event => <EventItem key={event.id} event={event} />)
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No events on this day.
                            </p>
                        )}
                    </CardContent>
                </TabsContent>

                <TabsContent value="upcoming">
                     <CardHeader className="pt-0">
                         <CardTitle>Upcoming Events</CardTitle>
                         <CardDescription>
                            Upcoming birthdays and work anniversaries.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.map(event => <EventItem key={event.id} event={event} showDate={true} />)
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No upcoming events.
                            </p>
                        )}
                    </CardContent>
                </TabsContent>
            </Tabs>
        </Card>
    );
}
