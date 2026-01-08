'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getMembersAction } from '@/app/actions/staff';
import { Member } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';

const domains = ['All', 'Engineering', 'Design', 'Marketing', 'Sales', 'HR'];

export default function EmployeeDirectoryPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState('');
    const [domainFilter, setDomainFilter] = useState('All');

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        startTransition(() => {
            const storedUser = sessionStorage.getItem('loggedInUser');
            const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
            getMembersAction(currentUserId).then(result => {
                setMembers(Array.isArray(result) ? result : []);
            });
        });
    }, []);
    
    const filteredMembers = useMemo(() => {
        return members
            .filter(member => member.status === 'active') // Only show active members
            .filter(member => 
                member.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                member.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            )
            .filter(member => 
                domainFilter === 'All' || member.domain === domainFilter
            );
    }, [members, debouncedSearchTerm, domainFilter]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className='flex-1'>
                             <h1 className="text-2xl font-bold tracking-tight">Employee Directory</h1>
                             <p className="text-muted-foreground">Find and connect with your colleagues.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input 
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-64"
                            />
                             <Select value={domainFilter} onValueChange={setDomainFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by domain" />
                                </SelectTrigger>
                                <SelectContent>
                                    {domains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {isPending ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredMembers.map(member => (
                       <Link href={`/dashboard/members/${member.id}`} key={member.id}>
                            <Card className="hover:shadow-md hover:-translate-y-1 transition-transform duration-200 cursor-pointer text-center">
                                <CardContent className="p-6 flex flex-col items-center">
                                    <Avatar className="h-24 w-24 mb-4">
                                        <AvatarImage src={member.profile_picture_url || undefined} />
                                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-semibold">{member.name}</p>
                                    <p className="text-sm text-muted-foreground">{member.job_title || member.domain}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
             {!isPending && filteredMembers.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No members found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}
