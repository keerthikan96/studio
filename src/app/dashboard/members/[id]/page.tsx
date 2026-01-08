'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Member } from '@/lib/mock-data';
import { useParams } from 'next/navigation';
import { getMemberByIdAction } from '@/app/actions/staff';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Building, Briefcase, GraduationCap, Award, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCoursesAndCertificatesAction } from '@/app/actions/staff';
import { CourseOrCertificate } from '@/lib/mock-data';
import { format } from 'date-fns';

const GeneralInfoTab = ({ member }: { member: Member }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Public profile details for {member.name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold text-muted-foreground">Full Name:</span> {member.name}</div>
                    <div><span className="font-semibold text-muted-foreground">Email:</span> {member.email}</div>
                    <div><span className="font-semibold text-muted-foreground">Job Title:</span> {member.job_title || 'N/A'}</div>
                    <div><span className="font-semibold text-muted-foreground">Department:</span> {member.domain || 'N/A'}</div>
                    <div><span className="font-semibold text-muted-foreground">Location:</span> {member.branch}, {member.country}</div>
                    <div><span className="font-semibold text-muted-foreground">Joined:</span> {member.start_date ? format(new Date(member.start_date), 'PPP') : 'N/A'}</div>
                </div>
            </CardContent>
        </Card>
    )
}

const JobInfoTab = ({ member }: { member: Member }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Work Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {member.experience && member.experience.length > 0 ? member.experience.map((exp, index) => (
                    <div key={index} className="flex gap-4">
                        <div className="mt-1">
                           <Building className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h4 className="font-semibold">{exp.role}</h4>
                            <p className="text-muted-foreground">{exp.companyName} &middot; {exp.years}</p>
                            <p className="text-sm mt-1">{exp.keyResponsibilities}</p>
                        </div>
                    </div>
                )) : <p className="text-muted-foreground">No work experience listed.</p>}
            </CardContent>
        </Card>
    );
};

const EducationTab = ({ member }: { member: Member }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {member.education && member.education.length > 0 ? member.education.map((edu, index) => (
                     <div key={index} className="flex gap-4">
                        <div className="mt-1">
                           <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h4 className="font-semibold">{edu.institution}</h4>
                            <p className="text-muted-foreground">{edu.degree} &middot; {edu.years}</p>
                        </div>
                    </div>
                )) : <p className="text-muted-foreground">No education history listed.</p>}
            </CardContent>
        </Card>
    );
};

const SkillsTab = ({ member }: { member: Member }) => {
    return (
         <Card>
            <CardHeader>
                <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {member.skills && member.skills.length > 0 ? member.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                    )) : <p className="text-muted-foreground">No skills listed.</p>}
                </div>
            </CardContent>
        </Card>
    )
}

const CoursesAndCertificatesTab = ({ memberId }: { memberId: string }) => {
    const [records, setRecords] = useState<CourseOrCertificate[]>([]);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(() => {
            getCoursesAndCertificatesAction(memberId).then(setRecords);
        });
    }, [memberId]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Certificates & Courses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 {isPending ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> : (
                    records.length > 0 ? records.map((record, index) => (
                        <div key={index} className="flex gap-4">
                            <div className="mt-1">
                                {record.type === 'Certificate' ? <Award className="h-5 w-5 text-muted-foreground" /> : <Briefcase className="h-5 w-5 text-muted-foreground" />}
                            </div>
                            <div>
                                <h4 className="font-semibold">{record.name}</h4>
                                <p className="text-muted-foreground text-sm">{record.provider || 'Self-study'}</p>
                                {record.status && <Badge variant={record.status === 'Completed' ? 'default' : 'secondary'} className='mt-1'>{record.status}</Badge>}
                            </div>
                        </div>
                    )) : <p className="text-muted-foreground">No courses or certificates listed.</p>
                 )}
            </CardContent>
        </Card>
    );
};


export default function PublicMemberProfilePage() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const params = useParams();
    const memberId = params.id as string;
    const [member, setMember] = useState<Member | null>(null);

    const fetchMember = useCallback(() => {
        startTransition(() => {
            const storedUser = sessionStorage.getItem('loggedInUser');
            const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
            getMemberByIdAction(memberId, currentUserId).then(result => {
                const currentMember = result && 'error' in result ? null : result;
                if (currentMember) {
                    setMember(currentMember);
                } else {
                    toast({ title: "Member not found", variant:"destructive" });
                }
            });
        });
    }, [memberId, toast]);

    useEffect(() => {
        if (memberId) {
            fetchMember();
        }
    }, [memberId, fetchMember]);

    if (isPending || !member) {
      return <div className='flex justify-center items-center h-full'><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const tabs = ["General Info", "Work Experience", "Education", "Skills", "Certificates & Courses"];

    return (
        <div className='space-y-6'>
            <Button variant="outline" asChild>
                <Link href="/dashboard/members">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Directory
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Image
                            src={member.profile_picture_url || `https://i.pravatar.cc/150?u=${member.id}`}
                            alt={member.name}
                            width={100}
                            height={100}
                            className="rounded-full"
                        />
                        <div>
                            <h1 className="text-2xl font-bold">{member.name}</h1>
                            <p className="text-muted-foreground">{member.job_title || member.domain}</p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="General Info" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                    {tabs.map(tab => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}
                </TabsList>
                <TabsContent value="General Info" className="mt-4">
                    <GeneralInfoTab member={member} />
                </TabsContent>
                <TabsContent value="Work Experience" className="mt-4">
                    <JobInfoTab member={member} />
                </TabsContent>
                <TabsContent value="Education" className="mt-4">
                    <EducationTab member={member} />
                </TabsContent>
                 <TabsContent value="Skills" className="mt-4">
                    <SkillsTab member={member} />
                </TabsContent>
                <TabsContent value="Certificates & Courses" className="mt-4">
                    <CoursesAndCertificatesTab memberId={memberId}/>
                </TabsContent>
            </Tabs>
        </div>
    );
}
