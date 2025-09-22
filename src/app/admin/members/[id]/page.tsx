
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useTransition, KeyboardEvent, useEffect } from 'react';
import Image from 'next/image';
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
import { Loader2, PlusCircle, Save, Trash, X as XIcon, ArrowLeft, Edit, Ban, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Member } from '@/lib/mock-data';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMemberByIdAction, updateMemberAction, deleteMemberAction } from '@/app/actions/staff';
import ProfilePictureUploader from '@/components/profile-picture-uploader';
import CoverPhotoUploader from '@/components/cover-photo-uploader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).optional(),
  email: z.string().email({ message: 'Please enter a valid email address.' }).optional(),
  phone: z.string().optional(),
  job_title: z.string().optional().nullable(),
  domain: z.enum(domains as [string, ...string[]]).optional(),
  country: z.enum(countries as [string, ...string[]]).optional(),
  branch: z.string().optional(),
  experience: z.array(workExperienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  skills: z.array(z.string()).optional(),
  status: z.enum(['active', 'pending', 'inactive']).optional(),
  profile_picture_url: z.string().url().optional().nullable(),
  cover_photo_url: z.string().url().optional().nullable(),
  date_of_birth: z.date().optional().nullable(),
  start_date: z.date().optional().nullable(),
  address: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
}).refine(data => {
    if (data.country === 'Sri Lanka' && data.branch) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div className="flex flex-col">
                    <span className="font-semibold text-muted-foreground">Full Name</span>
                    <span>{member.name}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-muted-foreground">Email Address</span>
                    <span>{member.email}</span>
                </div>
                 <div className="flex flex-col">
                    <span className="font-semibold text-muted-foreground">Job Title</span>
                    <span>{member.job_title || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-muted-foreground">Phone Number</span>
                    <span>{member.phone || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-muted-foreground">Date of Birth</span>
                    <span>{member.date_of_birth ? format(new Date(member.date_of_birth), 'PPP') : 'N/A'}</span>
                </div>
                 <div className="flex flex-col">
                    <span className="font-semibold text-muted-foreground">Start Date</span>
                    <span>{member.start_date ? format(new Date(member.start_date), 'PPP') : 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-muted-foreground">Domain</span>
                    <span>{member.domain || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-muted-foreground">Country</span>
                    <span>{member.country || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-muted-foreground">Branch / State</span>
                    <span>{member.branch || 'N/A'}</span>
                </div>
                <div className="flex flex-col md:col-span-2">
                    <span className="font-semibold text-muted-foreground">Address</span>
                    <span>{member.address || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-muted-foreground">Emergency Contact</span>
                    <span>{member.emergency_contact_name || 'N/A'}</span>
                </div>
                 <div className="flex flex-col">
                    <span className="font-semibold text-muted-foreground">Emergency Phone</span>
                    <span>{member.emergency_contact_phone || 'N/A'}</span>
                </div>
            </div>
             <div className="space-y-2">
                <h4 className="font-semibold text-muted-foreground">Skills</h4>
                {member.skills && member.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {member.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                        ))}
                    </div>
                ) : <p className="text-muted-foreground text-sm">No skills listed.</p>}
            </div>
        </CardContent>
    </Card>
);

const GeneralInfoEdit = ({ form, member, onCancel, isPending }: { form: any, member: Member, onCancel: () => void, isPending: boolean }) => {
  const [skillInput, setSkillInput] = useState('');

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

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Update member's personal and professional information.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                        name="job_title"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. Software Engineer" {...field} value={field.value ?? ''} />
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
                            <Input placeholder="e.g. (123) 456-7890" {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="date_of_birth"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date of Birth</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Start Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="md:col-span-3">
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                <Textarea placeholder="123 Main St, Anytown, USA" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="emergency_contact_name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Emergency Contact Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. John Smith" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="emergency_contact_phone"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Emergency Contact Phone</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. (987) 654-3210" {...field} value={field.value ?? ''} />
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
                                    <Input placeholder="e.g. New York, California" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}
                    <div className="md:col-span-3">
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
                </div>
            </CardContent>
        </Card>
    );
};

const JobInfoView = ({ member }: { member: Member }) => (
    <Card>
        <CardHeader>
            <CardTitle>Job Information</CardTitle>
            <CardDescription>Work experience and job-related details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
    </Card>
);

const JobInfoEdit = ({ form }: { form: any }) => {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "experience",
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Job Information</CardTitle>
                <CardDescription>Update work experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <h3 className="text-lg font-medium">Work Experience</h3>
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField control={form.control} name={`experience.${index}.companyName`} render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`experience.${index}.role`} render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`experience.${index}.years`} render={({ field }) => (<FormItem><FormLabel>Years</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name={`experience.${index}.keyResponsibilities`} render={({ field }) => (<FormItem><FormLabel>Responsibilities</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-7 w-7"><Trash className="h-4 w-4" /></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ companyName: '', role: '', years: '', keyResponsibilities: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                </Button>
            </CardContent>
        </Card>
    );
};

const EducationView = ({ member }: { member: Member }) => (
    <Card>
        <CardHeader>
            <CardTitle>Education</CardTitle>
            <CardDescription>Member's educational background.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {member.education && member.education.length > 0 ? (
                member.education.map((edu, index) => (
                    <div key={index} className="p-4 border rounded-md text-sm">
                        <h5 className="font-bold">{edu.degree}</h5>
                        <p className="text-muted-foreground">{edu.institution} | {edu.years}</p>
                    </div>
                ))
            ) : <p className="text-muted-foreground text-sm">No education history listed.</p>}
        </CardContent>
    </Card>
);

const EducationEdit = ({ form }: { form: any }) => {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "education",
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Education</CardTitle>
                <CardDescription>Update educational background.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                             <FormField control={form.control} name={`education.${index}.institution`} render={({ field }) => (<FormItem><FormLabel>Institution</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`education.${index}.degree`} render={({ field }) => (<FormItem><FormLabel>Degree</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name={`education.${index}.years`} render={({ field }) => (<FormItem><FormLabel>Years</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-7 w-7"><Trash className="h-4 w-4" /></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ institution: '', degree: '', years: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                </Button>
            </CardContent>
        </Card>
    );
};


const PlaceholderContent = ({ title, onEdit }: { title: string, onEdit: () => void }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Details for {title.toLowerCase()} will be displayed here.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
            </Button>
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
        cover_photo_url: null,
        job_title: '',
        date_of_birth: null,
        start_date: null,
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
    },
  });
  
  const resetFormValues = (memberData: Member) => {
    form.reset({
        ...memberData,
        date_of_birth: memberData.date_of_birth ? new Date(memberData.date_of_birth) : null,
        start_date: memberData.start_date ? new Date(memberData.start_date) : null,
        experience: memberData.experience || [],
        education: memberData.education || [],
        skills: memberData.skills || [],
    });
  }

  const fetchMember = (resetForm = true) => {
    startTransition(() => {
        getMemberByIdAction(memberId).then(currentMember => {
            if (currentMember) {
                setMember(currentMember);
                if (resetForm) {
                   resetFormValues(currentMember);
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
    const isEnteringEdit = !editModes[tab];
    const newEditModes = { ...editModes, [tab]: isEnteringEdit };

    // When entering edit mode for a tab, exit edit mode for all other tabs
    if (isEnteringEdit) {
      Object.keys(editModes).forEach(key => {
        if (key !== tab) {
          newEditModes[key] = false;
        }
      });
    }

    setEditModes(newEditModes);
    
    if (isEnteringEdit && member) {
        resetFormValues(member);
    }
  };

  const handleCoverUploadSuccess = (newUrl: string) => {
    if (!member) return;
    const updatedMember = { ...member, cover_photo_url: newUrl };
    setMember(updatedMember);
    form.setValue('cover_photo_url', newUrl, { shouldDirty: true });
    toast({ title: 'Cover photo updated!', description: 'Saving your changes...' });
    onSubmit({ cover_photo_url: newUrl });
  };
  
  const handleProfilePicUploadSuccess = (newUrl: string) => {
    if (!member) return;
    const updatedMember = { ...member, profile_picture_url: newUrl };
    setMember(updatedMember);
    form.setValue('profile_picture_url', newUrl, { shouldDirty: true });
    toast({ title: 'Profile picture updated!', description: 'Saving your changes...' });
    onSubmit({ profile_picture_url: newUrl });
  };

  function onSubmit(data: Partial<ProfileFormValues>) {
    startTransition(async () => {
        const dirtyFields = form.formState.dirtyFields;
        const activeEditTab = Object.keys(editModes).find(key => editModes[key]);
        
        let dataToUpdate = data;
        
        if (Object.keys(data).length === 0) {
            if (Object.keys(dirtyFields).length === 0) {
                toast({ title: 'No Changes Detected', description: 'You haven\'t made any changes to save.' });
                if(activeEditTab) toggleEditMode(activeEditTab);
                return;
            }

            const fullData = form.getValues();
            const changedData: Partial<ProfileFormValues> = {};
             for (const field in dirtyFields) {
                // @ts-ignore
                if (Object.prototype.hasOwnProperty.call(fullData, field)) {
                    // @ts-ignore
                    changedData[field] = fullData[field];
                }
            }
            dataToUpdate = changedData;
        }

        const result = await updateMemberAction(memberId, dataToUpdate);

        if ('error' in result) {
            toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
        } else {
            toast({
                title: 'Profile Updated!',
                description: `${result.name}'s information has been successfully saved.`,
            });
            setMember(result as Member); // update local member state
            resetFormValues(result as Member); // reset form with new data
            if(activeEditTab) toggleEditMode(activeEditTab);

            if ('profile_picture_url' in dataToUpdate) {
                window.dispatchEvent(new CustomEvent('profile-picture-updated'));
            }
            if ('cover_photo_url' in dataToUpdate) {
                window.dispatchEvent(new CustomEvent('cover-photo-updated'));
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
  
  const renderTabContent = (tab: string) => {
    const isEditing = !!editModes[tab];

    const EditWrapper = ({ children }: { children: React.ReactNode }) => (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex justify-end items-center gap-2">
                    <Button onClick={() => toggleEditMode(tab)} variant="outline" disabled={isPending}>
                        <Ban className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
                    </Button>
                </div>
                {children}
            </form>
        </Form>
    );

     const ViewWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className="space-y-4">
            <div className="flex justify-end items-center">
                 <Button onClick={() => toggleEditMode(tab)} variant="outline">
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
            </div>
            {children}
        </div>
    );

    switch(tab) {
        case "General Info":
            return isEditing 
                ? <EditWrapper><GeneralInfoEdit form={form} member={member} onCancel={() => toggleEditMode(tab)} isPending={isPending} /></EditWrapper>
                : <ViewWrapper><GeneralInfoView member={member} /></ViewWrapper>;
        case "Job":
             return isEditing
                ? <EditWrapper><JobInfoEdit form={form} /></EditWrapper>
                : <ViewWrapper><JobInfoView member={member} /></ViewWrapper>;
        case "Education":
             return isEditing
                ? <EditWrapper><EducationEdit form={form} /></EditWrapper>
                : <ViewWrapper><EducationView member={member} /></ViewWrapper>;
        default:
            return <PlaceholderContent title={tab} onEdit={() => toggleEditMode(tab)} />;
    }
  }


  const fallback = member.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  const tabs = ["General Info", "Job", "Education", "Leave", "Notes", "Performance", "Permission", "Assets", "Documents", "Training", "To-Do", "Payslip", "Payroll", "Attendance"];
  const isAnyTabEditing = Object.values(editModes).some(v => v);

  return (
    <div className='space-y-6'>
        <Button variant="outline" asChild>
            <Link href="/admin/members">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Member List
            </Link>
        </Button>

        <Card className='overflow-hidden'>
            <CoverPhotoUploader
                memberId={member.id}
                currentImageUrl={member.cover_photo_url}
                onUploadSuccess={handleCoverUploadSuccess}
                isEditable={!isAnyTabEditing}
            />
            <CardHeader className='pt-0'>
                <div className="flex items-end justify-between gap-4 -mt-12">
                    <ProfilePictureUploader
                        memberId={member.id}
                        currentImageUrl={member.profile_picture_url}
                        onUploadSuccess={handleProfilePicUploadSuccess}
                        userName={member.name}
                        isEditable={!isAnyTabEditing}
                        className='w-24 h-24 text-3xl border-4 border-card'
                    />
                     <div className="flex items-center gap-2 pb-4">
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
                 <div className='pt-4'>
                    <h1 className="text-2xl font-bold">{member.name}</h1>
                    <p className="text-muted-foreground">{member.job_title || member.domain}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
            </CardHeader>
        </Card>

        <Tabs defaultValue="General Info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-13">
                 {tabs.map(tab => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}
            </TabsList>

            {tabs.map(tab => (
                 <TabsContent key={tab} value={tab} className='mt-6'>
                    {renderTabContent(tab)}
                 </TabsContent>
            ))}

        </Tabs>
    </div>
  );
}

    