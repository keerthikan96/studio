
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cake, Gift } from "lucide-react";

const todayEvents = [
  {
    id: "bday1",
    type: "birthday",
    name: "Jane Cooper",
    avatar: "https://i.pravatar.cc/40?u=bday1",
    date: "Today",
  },
  {
    id: "anniv1",
    type: "anniversary",
    name: "Robert Fox",
    avatar: "https://i.pravatar.cc/40?u=anniv1",
    date: "Today (5 years)",
  },
];

const upcomingEvents = [
  {
    id: "bday2",
    type: "birthday",
    name: "Wade Warren",
    avatar: "https://i.pravatar.cc/40?u=bday2",
    date: "In 2 days",
  },
  {
    id: "anniv2",
    type: "anniversary",
    name: "Esther Howard",
    avatar: "https://i.pravatar.cc/40?u=anniv2",
    date: "In 5 days (3 years)",
  },
  {
    id: "bday3",
    type: "birthday",
    name: "Cameron Williamson",
    avatar: "https://i.pravatar.cc/40?u=bday3",
    date: "In 1 week",
  },
];

const EventItem = ({ event }: { event: (typeof todayEvents)[0] }) => (
    <div className="flex items-center gap-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={event.avatar} alt={event.name} />
        <AvatarFallback>{event.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <p className="font-medium text-sm">{event.name}</p>
        <p className="text-xs text-muted-foreground">{event.date}</p>
      </div>
      {event.type === 'birthday' ? 
        <Cake className="h-5 w-5 text-pink-500" /> : 
        <Gift className="h-5 w-5 text-indigo-500" />}
    </div>
);


export function DashboardEvents() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Events</CardTitle>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="today">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="today">Today</TabsTrigger>
                        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    </TabsList>
                    <TabsContent value="today" className="mt-4 space-y-4">
                        {todayEvents.map(event => <EventItem key={event.id} event={event} />)}
                    </TabsContent>
                    <TabsContent value="upcoming" className="mt-4 space-y-4">
                        {upcomingEvents.map(event => <EventItem key={event.id} event={event as any} />)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
