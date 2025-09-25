

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useTransition, KeyboardEvent, useEffect, useCallback } from 'react';
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
import { Loader2, PlusCircle, Save, X as XIcon, Ban, CalendarIcon, Briefcase, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Member } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMemberByIdAction, updateMemberAction } from '@/app/actions/staff';
import ProfilePictureUploader from '@/components/profile-picture-uploader';
import CoverPhotoUploader from '@/components/cover-photo-uploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { NotesTab } from '@/components/member-profile-tabs/notes-tab';
import { PerformanceTab } from '@/components/member-profile-tabs/performance-tab';
import { SelfAssessmentTab } from '@/components/member-profile-tabs/self-assessment-tab';
import { DocumentsTab } from '@/components/member-profile-tabs/documents-tab';
import { CoursesAndCertificatesTab } from '@/components/member-profile-tabs/courses-and-certificates-tab';
import { EmploymentHistoryTab } from '@/components/member-profile-tabs/payslip-tab';

const domains = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'];
const countries = ['Canada', 'USA', 'Sri Lanka'];
const sriLankanBranches = ['Nothern', 'Central', 'Eastern'];
const employmentCategories = ['Full-time', 'Part-time', 'Contract'];
const workLocations = ['Office', 'Work from home'];

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
  profile_picture_url: z.string().url().optional().nullable(),
  cover_photo_url: z.string().url().optional().nullable(),
  date_of_birth: z.date().optional().nullable(),
  start_date: z.date().optional().nullable(),
  address: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  employment_category: z.enum(employmentCategories as [string, ...string[]]).optional(),
  work_location: z.enum(workLocations as [string, ...string[]]).optional(),
  hobbies: z.array(z.string()).optional().nullable(),
  volunteer_work: z.array(z.string()).optional().nullable(),
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

const GeneralInfoTab = ({ form, isPending }: { form: any, isPending: boolean }) => {
  const watchedCountry = form.watch('country');

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Update your personal and professional information.</CardDescription>
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
                            <Input placeholder="e.g. alex.doe@example.com" {...field} readOnly className="cursor-not-allowed bg-muted/50"/>
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
                                        <Calendar captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
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
                                        <Calendar captionLayout="dropdown-buttons" fromYear={1990} toYear={new Date().getFullYear() + 5} mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="employment_category"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Employment Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {employmentCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="work_location"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Work Location</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a location" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {workLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                                </SelectContent>
                            </Select>
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
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const SkillsTab = ({ form }: { form: any }) => {
  const [skillInput, setSkillInput] = useState('');

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control: form.control,
    name: "skills",
  });

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
                <CardTitle>Skills</CardTitle>
                <CardDescription>Manage your skills.</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    )
}

const JobInfoTab = ({ form }: { form: any }) => {
    const { fields, append } = useFieldArray({
        control: form.control,
        name: "experience",
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Job Information</CardTitle>
                <CardDescription>Update your work experience.</CardDescription>
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
                        
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ companyName: '', role: '', years: '', keyResponsibilities: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                </Button>
            </CardContent>
        </Card>
    );
};

const EducationTab = ({ form }: { form: any }) => {
    const { fields, append } = useFieldArray({
        control: form.control,
        name: "education",
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Education</CardTitle>
                <CardDescription>Update your educational background.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                             <FormField control={form.control} name={`education.${index}.institution`} render={({ field }) => (<FormItem><FormLabel>Institution</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`education.${index}.degree`} render={({ field }) => (<FormItem><FormLabel>Degree</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name={`education.${index}.years`} render={({ field }) => (<FormItem><FormLabel>Years</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ institution: '', degree: '', years: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                </Button>
            </CardContent>
        </Card>
    );
};


const PlaceholderContent = ({ title }: { title: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Details for {title.toLowerCase()} will be displayed here.</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">No {title.toLowerCase()} information available yet.</p>
        </CardContent>
    </Card>
);

const parseDateString = (dateString: string | Date | null | undefined): Date | null => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    
    const parts = dateString.split(/[-T]/);
    if (parts.length >= 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            const date = new Date(Date.UTC(year, month, day));
            if (date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
                return date;
            }
        }
    }
    return null;
};

export default function ProfilePage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [member, setMember] = useState<Member | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [nextTab, setNextTab] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("General Info");


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
        hobbies: [],
        volunteer_work: [],
    },
  });
  
  const { formState: { isDirty, dirtyFields }, handleSubmit, reset } = form;

  const resetFormValues = useCallback((memberData: Member) => {
    reset({
        ...memberData,
        date_of_birth: parseDateString(memberData.date_of_birth),
        start_date: parseDateString(memberData.start_date),
        experience: memberData.experience || [],
        education: memberData.education || [],
        skills: memberData.skills || [],
        hobbies: memberData.hobbies || [],
        volunteer_work: memberData.volunteer_work || [],
    });
  }, [reset]);

  const fetchMember = useCallback(() => {
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        startTransition(() => {
            getMemberByIdAction(user.id).then(currentMember => {
                if (currentMember) {
                    setMember(currentMember);
                    resetFormValues(currentMember);
                } else {
                    toast({ title: "Your user data could not be found.", variant:"destructive" });
                }
            });
        });
    }
  }, [resetFormValues, toast]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  
  const handleCoverUploadSuccess = (newUrl: string) => {
    if (!member) return;
    const updatedMember = { ...member, cover_photo_url: newUrl };
    setMember(updatedMember);
    form.setValue('cover_photo_url', newUrl, { shouldDirty: true });
    onSubmit({ cover_photo_url: newUrl });
  };
  
  const handleProfilePicUploadSuccess = (newUrl: string) => {
    if (!member) return;
    const updatedMember = { ...member, profile_picture_url: newUrl };
    setMember(updatedMember);
    form.setValue('profile_picture_url', newUrl, { shouldDirty: true });
    onSubmit({ profile_picture_url: newUrl });
  };

  const onSubmit = useCallback(async (data?: Partial<ProfileFormValues>) => {
    if (!member) return;
    let dataToUpdate = data;
    
    if (!dataToUpdate || Object.keys(dataToUpdate).length === 0) {
        if (!isDirty) {
            toast({ title: 'No Changes Detected', description: 'You haven\'t made any changes to save.' });
            return;
        }
        const fullData = form.getValues();
        const changedData: Partial<ProfileFormValues> = {};
        
        (Object.keys(dirtyFields) as Array<keyof typeof dirtyFields>).forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(fullData, field)) {
                // @ts-ignore
                changedData[field] = fullData[field];
            }
        });
        dataToUpdate = changedData;
    }

    if (Object.keys(dataToUpdate).length === 0) {
        toast({ title: 'No Changes Detected', description: 'You haven\'t made any changes to save.' });
        return;
    }

    const result = await updateMemberAction(member.id, dataToUpdate);

    if ('error' in result) {
        toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
    } else {
        toast({
            title: 'Profile Updated!',
            description: `Your information has been successfully saved.`,
        });
        setMember(result as Member);
        resetFormValues(result as Member);
    }
  }, [isDirty, form, dirtyFields, member, toast, resetFormValues]);

  const handleFormSubmit = handleSubmit(() => onSubmit());

  const handleTabChange = (value: string) => {
    if (isDirty) {
      setNextTab(value);
      setShowUnsavedDialog(true);
    } else {
      setCurrentTab(value);
    }
  };

  const handleLeavePage = () => {
      resetFormValues(member!);
      setShowUnsavedDialog(false);
      if (nextTab) {
          setCurrentTab(nextTab);
          setNextTab(null);
      }
  };

  const handleSaveAndLeave = async () => {
      await handleFormSubmit();
      setShowUnsavedDialog(false);
      if (nextTab) {
          setCurrentTab(nextTab);
          setNextTab(null);
      }
  };
  
  if (!member) {
      return <div className='flex justify-center items-center h-full'><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  const renderTabContent = (tab: string) => {
    const FormWrapper = ({ children }: { children: React.ReactNode }) => (
        <form onSubmit={handleFormSubmit} className="space-y-4">
            <Form {...form}>
                {children}
            </Form>
            <div className="flex justify-end items-center gap-2 pt-4">
                <Button type="submit" disabled={isPending || !isDirty}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Changes
                </Button>
            </div>
        </form>
    );

    switch(tab) {
        case "General Info":
            return <FormWrapper><GeneralInfoTab form={form} isPending={isPending} /></FormWrapper>;
        case "Job":
             return <FormWrapper><JobInfoTab form={form} /></FormWrapper>;
        case "Education":
             return <FormWrapper><EducationTab form={form} /></FormWrapper>;
        case "Skills":
             return <FormWrapper><SkillsTab form={form} /></FormWrapper>;
        case "Notes":
            return <NotesTab memberId={member.id} />;
        case "Performance":
            return <PerformanceTab memberId={member.id} />;
        case "Self-assesment":
            return <SelfAssessmentTab memberId={member.id} />;
        case "Documents":
            return <DocumentsTab memberId={member.id} />;
        case "Certificate and Courses":
            return <CoursesAndCertificatesTab memberId={member.id} memberName={member.name} />;
        case "Employment History":
            return <EmploymentHistoryTab memberId={member.id} memberName={member.name} />;
        default:
            return <PlaceholderContent title={tab} />;
    }
  }

  const tabs = ["General Info", "Job", "Education", "Skills", "Leave", "Notes", "Performance", "Documents", "Certificate and Courses", "To-Do", "Employment History", "Attendance", "Self-assesment"];

  return (
    <div className='space-y-6'>
        <Card className='overflow-hidden'>
            <CoverPhotoUploader
                memberId={member.id}
                currentImageUrl={member.cover_photo_url}
                onUploadSuccess={handleCoverUploadSuccess}
                isEditable={true}
            />
            <CardHeader className='pt-0'>
                <div className="flex items-end justify-between gap-4 -mt-12">
                    <ProfilePictureUploader
                        memberId={member.id}
                        currentImageUrl={member.profile_picture_url}
                        onUploadSuccess={handleProfilePicUploadSuccess}
                        userName={member.name}
                        isEditable={true}
                        className='w-24 h-24 text-3xl border-4 border-card'
                    />
                </div>
                 <div className='pt-4'>
                    <h1 className="text-2xl font-bold">{member.name}</h1>
                    <p className="text-muted-foreground">{member.job_title || member.domain}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                        {member.start_date && (
                            <div className="flex items-center gap-1.5">
                                <CalendarIcon className="h-4 w-4" />
                                <span>Joined {format(new Date(member.start_date), 'PPP')}</span>
                            </div>
                        )}
                        {member.employment_category && (
                            <div className="flex items-center gap-1.5">
                                <Briefcase className="h-4 w-4" />
                                <span>{member.employment_category}</span>
                            </div>
                        )}
                        {member.work_location && (
                             <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                <span>{member.work_location}</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
        </Card>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-13">
                 {tabs.map(tab => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}
            </TabsList>

            {tabs.map(tab => (
                 <TabsContent key={tab} value={tab} className='mt-6' forceMount={currentTab !== tab ? undefined : true}>
                    {renderTabContent(tab)}
                 </TabsContent>
            ))}

        </Tabs>

        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
                    <AlertDialogDescription>
                        Do you want to save your changes before leaving?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button variant="ghost" onClick={() => setShowUnsavedDialog(false)}>
                        <Ban className="mr-2 h-4 w-4" /> Stay on Page
                    </Button>
                    <Button variant="outline" onClick={handleLeavePage}>
                        Discard and Continue
                    </Button>
                    <Button onClick={handleSaveAndLeave}>
                        <Save className="mr-2 h-4 w-4" /> Save and Continue
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
