
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Member } from '@/lib/mock-data';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { format, differenceInDays } from 'date-fns';

type EventListItem = {
    member: Member;
    date: Date;
    isToday: boolean;
    daysUntil: number;
    description: string;
};

const EventItem = ({ item }: { item: EventListItem }) => (
    <div className="flex items-center gap-4 py-2">
        <Avatar>
            <AvatarImage src={item.member.profile_picture_url || undefined} alt={item.member.name} />
            <AvatarFallback>{item.member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
            <p className="font-semibold">{item.member.name}</p>
            <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
        <div className="text-right">
            <p className="font-medium">{format(item.date, 'MMM d')}</p>
            <p className="text-xs text-muted-foreground">
                {item.isToday ? 'Today!' : `in ${item.daysUntil} days`}
            </p>
        </div>
    </div>
);


export default function AutomatedPostRecipientList({ members }: { members: Member[] }) {

    const upcomingBirthdays = useMemo(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        
        return members
            .filter(member => member.date_of_birth)
            .map(member => {
                const dob = new Date(member.date_of_birth!);
                let nextBirthday = new Date(currentYear, dob.getMonth(), dob.getDate());
                if (nextBirthday < today) {
                    nextBirthday.setFullYear(currentYear + 1);
                }
                const daysUntil = differenceInDays(nextBirthday, today);
                const isToday = daysUntil === 0;
                
                return {
                    member,
                    date: nextBirthday,
                    isToday,
                    daysUntil,
                    description: `Turns ${currentYear - dob.getFullYear() + (nextBirthday.getFullYear() > currentYear ? 1 : 0)}`
                };
            })
            .sort((a, b) => a.daysUntil - b.daysUntil);
    }, [members]);

    const upcomingAnniversaries = useMemo(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        
        return members
            .filter(member => member.start_date)
            .map(member => {
                const startDate = new Date(member.start_date!);
                let nextAnniversary = new Date(currentYear, startDate.getMonth(), startDate.getDate());
                if (nextAnniversary < today) {
                    nextAnniversary.setFullYear(currentYear + 1);
                }

                const yearsOfService = nextAnniversary.getFullYear() - startDate.getFullYear();

                if (yearsOfService === 0) return null;

                const daysUntil = differenceInDays(nextAnniversary, today);
                const isToday = daysUntil === 0;

                return {
                    member,
                    date: nextAnniversary,
                    isToday,
                    daysUntil,
                    description: `${yearsOfService}-year anniversary`
                };
            })
            .filter(item => item !== null)
            .sort((a, b) => a!.daysUntil - b!.daysUntil) as EventListItem[];
    }, [members]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Upcoming Automated Posts</CardTitle>
                <CardDescription>
                    Here is a list of members with upcoming birthdays and work anniversaries.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="birthdays">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="birthdays">Birthdays</TabsTrigger>
                        <TabsTrigger value="anniversaries">Anniversaries</TabsTrigger>
                    </TabsList>
                    <TabsContent value="birthdays" className="max-h-96 overflow-y-auto">
                        <div className="space-y-2 pr-4">
                            {upcomingBirthdays.length > 0 ? (
                                upcomingBirthdays.map(item => <EventItem key={`${item.member.id}-bday`} item={item} />)
                            ) : (
                                <p className="text-muted-foreground text-center py-8">No upcoming birthdays.</p>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="anniversaries" className="max-h-96 overflow-y-auto">
                         <div className="space-y-2 pr-4">
                            {upcomingAnniversaries.length > 0 ? (
                                upcomingAnniversaries.map(item => <EventItem key={`${item.member.id}-anniv`} item={item} />)
                            ) : (
                                <p className="text-muted-foreground text-center py-8">No upcoming anniversaries.</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}


    