
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useTransition, KeyboardEvent, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Save, Trash, X as XIcon, ArrowLeft, Edit, Ban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Member } from '@/lib/mock-data';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMemberByIdAction, updateMemberAction, deleteMemberAction } from '@/app/actions/staff';
import ProfilePictureUploader from '@/components/profile-picture-uploader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

const domains = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'];
const countries = ['Canada', 'USA', 'Sri Lanka'];
const sriLankanBranches = ['Nothern', 'Central', 'Eastern'];

const workExperienceSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  role: z.string().min(1, 'Role is required.'),
  years: z.string().min(1, 'Years are required.'),
  keyResponsibilities: z.string().optional(),
});

const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required.'),
  degree: z.string().min(1, 'Degree is required.'),
  years: z.string().min(1, 'Years are required.'),
});

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().optional(),
  domain: z.enum(domains as [string, ...string[]], { required_error: 'Domain is required' }),
  country: z.enum(countries as [string, ...string[]], { required_error: 'Country is required' }),
  branch: z.string().min(1, 'Branch is required.'),
  experience: z.array(workExperienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  skills: z.array(z.string()).optional(),
  status: z.enum(['active', 'pending', 'inactive']),
  profile_picture_url: z.string().url().optional().nullable(),
}).refine(data => {
    if (data.country === 'Sri Lanka') {
        return sriLankanBranches.includes(data.branch);
    }
    return true;
}, {
    message: 'Invalid branch for the selected country.',
    path: ['branch'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;


const GeneralInfoView = ({ member }: { member: Member }) => (
    <Card>
        <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Read-only view of the member's personal and professional information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col">
                    <span className="font-semibold">Full Name</span>
                    <span>{member.name}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold">Email Address</span>
                    <span>{member.email}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold">Phone Number</span>
                    <span>{member.phone || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold">Domain</span>
                    <span>{member.domain}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold">Country</span>
                    <span>{member.country}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold">Branch / State</span>
                    <span>{member.branch}</span>
                </div>
            </div>
             <div className="space-y-2">
                <h4 className="font-semibold">Skills</h4>
                {member.skills && member.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {member.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                        ))}
                    </div>
                ) : <p className="text-muted-foreground text-sm">No skills listed.</p>}
            </div>
            <div className="space-y-4">
                <h4 className="font-semibold">Work Experience</h4>
                {member.experience && member.experience.length > 0 ? (
                    member.experience.map((exp, index) => (
                        <div key={index} className="p-4 border rounded-md text-sm">
                            <h5 className="font-bold">{exp.role}</h5>
                            <p className="text-muted-foreground">{exp.companyName} | {exp.years}</p>
                            <p className="mt-2">{exp.keyResponsibilities}</p>
                        </div>
                    ))
                ) : <p className="text-muted-foreground text-sm">No work experience listed.</p>}
            </div>
            <div className="space-y-4">
                <h4 className="font-semibold">Education</h4>
                {member.education && member.education.length > 0 ? (
                    member.education.map((edu, index) => (
                        <div key={index} className="p-4 border rounded-md text-sm">
                            <h5 className="font-bold">{edu.degree}</h5>
                            <p className="text-muted-foreground">{edu.institution} | {edu.years}</p>
                        </div>
                    ))
                ) : <p className="text-muted-foreground text-sm">No education history listed.</p>}
            </div>
        </CardContent>
    </Card>
);

const GeneralInfoEdit = ({ form, member, onCancel, isPending }: { form: any, member: Member, onCancel: () => void, isPending: boolean }) => {
  const [skillInput, setSkillInput] = useState('');
  
  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control: form.control,
    name: "experience",
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control: form.control,
    name: "education",
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  const watchedCountry = form.watch('country');

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (newSkill && !form.getValues('skills')?.includes(newSkill)) {
        appendSkill(newSkill);
        setSkillInput('');
      }
    }
  };

  const handleUploadSuccess = (newUrl: string) => {
    form.setValue('profile_picture_url', newUrl, { shouldDirty: true });
  };
  
    return (
        <Card>
            <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Update member's personal and professional information.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form className="space-y-8">
                    <div className="flex flex-col items-center gap-4 text-center mb-8">
                        <ProfilePictureUploader
                            memberId={member.id}
                            currentImageUrl={member.profile_picture_url}
                            onUploadSuccess={handleUploadSuccess}
                            userName={member.name}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. Alex Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. alex.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. (123) 456-7890" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="domain"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Domain</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a domain" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {domains.map(domain => <SelectItem key={domain} value={domain}>{domain}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('branch', ''); // Reset branch on country change
                            }} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a country" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {countries.map(country => <SelectItem key={country} value={country}>{country}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {watchedCountry === 'Sri Lanka' ? (
                        <FormField
                            control={form.control}
                            name="branch"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Branch</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a branch in Sri Lanka" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {sriLankanBranches.map(branch => <SelectItem key={branch} value={branch}>{branch}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    ) : (
                        <FormField
                            control={form.control}
                            name="branch"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Branch / State</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. New York, California" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}
                    <div className="md:col-span-2">
                        <FormItem>
                        <FormLabel>Skills</FormLabel>
                        <FormControl>
                            <div>
                            <Input 
                                placeholder="Type a skill and press Enter"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={handleSkillKeyDown}
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {skillFields.map((field, index) => (
                                <Badge key={field.id} variant="secondary" className="flex items-center gap-1">
                                    {form.getValues('skills')?.[index]}
                                    <button type="button" onClick={() => removeSkill(index)}>
                                    <XIcon className="h-3 w-3" />
                                    </button>
                                </Badge>
                                ))}
                            </div>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    </div>
                    </div>
                    
                    <div>
                    <h3 className="text-lg font-medium mb-4">Work Experience</h3>
                    <div className="space-y-4">
                        {expFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name={`experience.${index}.companyName`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl>
                                    <Input {...field} placeholder="e.g. TechCorp" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`experience.${index}.role`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <FormControl>
                                    <Input {...field} placeholder="e.g. Senior Developer" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`experience.${index}.years`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duration</FormLabel>
                                    <FormControl>
                                    <Input {...field} placeholder="e.g. 2020 - Present" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            </div>
                            <FormField
                                control={form.control}
                                name={`experience.${index}.keyResponsibilities`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Key Responsibilities</FormLabel>
                                    <FormControl>
                                    <Textarea {...field} placeholder="Describe key responsibilities..."/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeExp(index)} className="absolute top-2 right-2 h-7 w-7">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                        ))}
                        <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendExp({ companyName: '', role: '', years: '', keyResponsibilities: '' })}
                        >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Work Experience
                        </Button>
                    </div>
                    </div>

                    <div>
                    <h3 className="text-lg font-medium mb-4">Education</h3>
                    <div className="space-y-4">
                        {eduFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name={`education.${index}.institution`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Institution</FormLabel>
                                    <FormControl>
                                    <Input {...field} placeholder="e.g. University of Technology" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`education.${index}.degree`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Degree</FormLabel>
                                    <FormControl>
                                    <Input {...field} placeholder="e.g. B.S. in Computer Science" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`education.${index}.years`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duration</FormLabel>
                                    <FormControl>
                                    <Input {...field} placeholder="e.g. 2014 - 2018" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            </div>
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeEdu(index)} className="absolute top-2 right-2 h-7 w-7">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                        ))}
                        <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendEdu({ institution: '', degree: '', years: '' })}
                        >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Education
                        </Button>
                    </div>
                    </div>
                </form>
                </Form>
            </CardContent>
        </Card>
    );
}

const PlaceholderContent = ({ title, onEdit, isEditing }: { title: string, onEdit: () => void, isEditing: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Details for {title.toLowerCase()} will be displayed here.</CardDescription>
            </div>
            {!isEditing && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Button>
            )}
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">No {title.toLowerCase()} information available yet.</p>
        </CardContent>
    </Card>
);

export default function MemberProfilePage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;
  const [member, setMember] = useState<Member | null>(null);
  const [editModes, setEditModes] = useState<Record<string, boolean>>({});

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        name: '',
        email: '',
        phone: '',
        experience: [],
        education: [],
        skills: [],
        profile_picture_url: null,
    },
  });

  const fetchMember = (resetForm = true) => {
    startTransition(() => {
        getMemberByIdAction(memberId).then(currentMember => {
            if (currentMember) {
                setMember(currentMember);
                if (resetForm) {
                   form.reset({
                        ...currentMember,
                        experience: currentMember.experience || [],
                        education: currentMember.education || [],
                        skills: currentMember.skills || [],
                    });
                }
            } else {
                toast({ title: "Member not found", variant: "destructive" });
                router.push('/admin/members');
            }
        });
    });
  }

  useEffect(() => {
    if (memberId) {
        fetchMember();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const toggleEditMode = (tab: string) => {
    setEditModes(prev => ({ ...prev, [tab]: !prev[tab] }));
     // When entering edit mode, reset form to latest member data
    if (!editModes[tab] && member) {
        form.reset({
            ...member,
            experience: member.experience || [],
            education: member.education || [],
            skills: member.skills || [],
        });
    }
  };

  function onSubmit(data: ProfileFormValues) {
    startTransition(async () => {
        const dirtyFields = form.formState.dirtyFields;
        
        if (Object.keys(dirtyFields).length === 0) {
            toast({
                title: 'No Changes Detected',
                description: 'You haven\'t made any changes to save.',
            });
            toggleEditMode("General Info"); // Exit edit mode even if no changes
            return;
        }

        const dataToUpdate: Partial<ProfileFormValues> = {};
        for (const field in dirtyFields) {
            // @ts-ignore
            dataToUpdate[field] = data[field];
        }
        
        const result = await updateMemberAction(memberId, dataToUpdate);

        if ('error' in result) {
            toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
        } else {
            toast({
                title: 'Profile Updated!',
                description: `${data.name}'s information has been successfully saved.`,
            });
            // Re-fetch data to show the latest state and exit edit mode
            fetchMember(false); // fetch without resetting the form state immediately
            toggleEditMode("General Info");
            // update session storage for profile picture if it was changed
            if ('profile_picture_url' in dataToUpdate) {
                window.dispatchEvent(new CustomEvent('profile-picture-updated'));
            }
        }
    });
  }

  const handleDelete = () => {
    startTransition(async () => {
        const result = await deleteMemberAction(memberId);
        if (result.success) {
            toast({ title: "Member Terminated", description: `${member?.name} has been removed.` });
            router.push('/admin/members');
        } else {
            toast({ title: "Error", description: "Failed to terminate member.", variant: "destructive" });
        }
    });
  }
  
  if (!member) {
      return <div className='flex justify-center items-center h-full'><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const fallback = member.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  const tabs = ["General Info", "Job", "Leave", "Notes", "Performance", "Permission", "Assets", "Documents", "Training", "To-Do", "Payslip", "Payroll", "Attendance"];
  const isGeneralInfoEditing = !!editModes["General Info"];

  return (
    <div className='space-y-6'>
        <Button variant="outline" asChild>
            <Link href="/admin/members">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Member List
            </Link>
        </Button>

        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className='flex items-center gap-4'>
                        <Avatar className="h-20 w-20 text-3xl">
                            <AvatarImage src={member.profile_picture_url ?? undefined} alt={`${member.name}'s avatar`} />
                            <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">{member.name}</h1>
                            <p className="text-muted-foreground">{member.domain}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Terminate</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the member account for {member.name}.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                                    {isPending ? 'Terminating...' : 'Yes, Terminate'}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardHeader>
        </Card>

        <Tabs defaultValue="General Info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-13">
                 {tabs.map(tab => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}
            </TabsList>

            <TabsContent value="General Info" className='mt-6'>
                <div className="flex justify-end items-center mb-4 gap-2">
                    {isGeneralInfoEditing ? (
                        <>
                            <Button onClick={() => {
                                toggleEditMode("General Info");
                                fetchMember(); // reset changes on cancel
                            }} variant="outline" disabled={isPending}>
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending || !form.formState.isDirty}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => toggleEditMode("General Info")} variant="outline">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
                {isGeneralInfoEditing ? (
                     <GeneralInfoEdit form={form} member={member} onCancel={() => toggleEditMode("General Info")} isPending={isPending} />
                ) : (
                    <GeneralInfoView member={member} />
                )}
            </TabsContent>
            
            {tabs.filter(t => t !== "General Info").map(tab => (
                 <TabsContent key={tab} value={tab} className='mt-6'>
                    <PlaceholderContent 
                        title={tab} 
                        onEdit={() => toggleEditMode(tab)} 
                        isEditing={!!editModes[tab]} 
                    />
                 </TabsContent>
            ))}

        </Tabs>
    </div>
  );
}

    