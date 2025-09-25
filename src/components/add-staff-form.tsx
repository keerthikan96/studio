
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useTransition, KeyboardEvent } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { parseResumeAction } from '@/app/actions/staff';
import { Loader2, PlusCircle, Trash, UploadCloud, Save, X as XIcon, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Member } from '@/lib/mock-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { requestPasswordResetAction } from '@/app/actions/auth';

const domains = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'];
const countries = ['Canada', 'USA', 'Sri Lanka'];
const sriLankanBranches = ['Nothern', 'Central', 'Eastern'];

const workExperienceSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  role: z.string().min(1, 'Role is required.'),
  years: z.string().min(1, 'Years are required.'),
  keyResponsibilities: z.string().min(1, 'Key responsibilities are required.'),
});

const educationSchema = z.object({
    institution: z.string().min(1, 'Institution is required.'),
    degree: z.string().min(1, 'Degree is required.'),
    years: z.string().min(1, 'Years are required.'),
});

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  domain: z.enum(domains as [string, ...string[]]).optional(),
  country: z.enum(countries as [string, ...string[]]).optional(),
  branch: z.string().optional(),
  experience: z.array(workExperienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  skills: z.array(z.string()).optional(),
  date_of_birth: z.date().optional(),
  start_date: z.date().optional(),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
}).refine(data => {
    if (data.country === 'Sri Lanka' && data.branch) {
        return sriLankanBranches.includes(data.branch);
    }
    return true;
}, {
    message: 'Invalid branch for the selected country.',
    path: ['branch'],
});

type StaffFormValues = z.infer<typeof formSchema>;

type AddStaffFormProps = {
    onAddStaff: (staff: Omit<Member, 'id' | 'status'>) => Promise<boolean>;
};

export default function AddStaffForm({ onAddStaff }: AddStaffFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isParsing, setIsParsing] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [formData, setFormData] = useState<StaffFormValues | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      experience: [],
      education: [],
      skills: [],
    },
  });

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    toast({
      title: 'Parsing Resume...',
      description: 'The AI is extracting information. Please wait.',
    });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const resumeDataUri = reader.result as string;
      startTransition(async () => {
        const result = await parseResumeAction({ resumeDataUri });
        if ('error' in result) {
          toast({
            variant: 'destructive',
            title: 'Parsing Failed',
            description: result.error,
          });
        } else {
          // Keep domain and branch if they were already selected.
          const currentValues = form.getValues();
          form.reset({
            ...result,
            // @ts-ignore
            domain: result.domain || currentValues.domain,
            // @ts-ignore
            country: result.country || currentValues.country,
            // @ts-ignore
            branch: result.branch || currentValues.branch,
          });
          toast({
            title: 'Resume Parsed Successfully!',
            description: 'The form has been pre-filled. Please review and complete all fields.',
          });
        }
        setIsParsing(false);
      });
    };
    reader.onerror = (error) => {
        console.error('Error reading file:', error);
        toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'Could not read the selected file.',
        });
        setIsParsing(false);
    }
  };
  
  function onSubmit(data: StaffFormValues) {
    setFormData(data);
    startTransition(async () => {
        // @ts-ignore
        const success = await onAddStaff(data);
        if (success) {
            toast({
                title: 'Member Saved',
                description: `${data.name} has been added to the member list.`,
            });
            setShowInviteDialog(true);
        } else {
             toast({
                title: 'Error Saving Member',
                description: 'A member with this email might already exist.',
                variant: 'destructive',
            });
        }
    });
  }

  const handleSendInvite = () => {
    if (!formData) return;
    
    startTransition(async () => {
        // We request a reset, but this is for an invitation. 
        // We will generate a link to `/set-password` instead of `/reset-password`.
        const result = await requestPasswordResetAction(formData.email, true); // isInvitation = true
        if (result.success && result.invitationLink) {
            toast({
                title: 'Invitation Sent!',
                description: `An invitation has been sent to ${formData.name}. Check the console for the link.`,
            });
            console.log('--- INVITATION LINK (for new employee) ---');
            console.log(result.invitationLink);
            console.log('-------------------------------------------');
        } else {
            toast({
                title: 'Error Sending Invitation',
                description: result.error || 'An unknown error occurred.',
                variant: 'destructive',
            });
        }
        setShowInviteDialog(false);
        router.push('/admin/members');
    });
  }

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newSkill = skillInput.trim();
      // @ts-ignore
      if (newSkill && !form.getValues('skills').includes(newSkill)) {
        appendSkill(newSkill);
        setSkillInput('');
      }
    }
  };


  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Add New Staff Member</CardTitle>
        <CardDescription>
            Fill in the details below or upload a resume to have AI pre-fill the form for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="relative rounded-lg border-2 border-dashed border-muted p-6 text-center hover:border-primary/50 transition-colors">
                 <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">
                    {isParsing ? 'Parsing resume...' : 'Upload a resume to autofill'}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    PDF, DOCX up to 10MB
                </p>
                <Input
                    id="resume-upload"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    disabled={isParsing}
                />
                 {isParsing && <div className="absolute inset-0 bg-background/80 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Doe" {...field} />
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
                      <Input placeholder="e.g. jane.doe@example.com" {...field} />
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
                      <Input placeholder="e.g. Software Engineer" {...field} />
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
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                                <Textarea placeholder="123 Main St, Anytown, USA" {...field} />
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
                            <Input placeholder="e.g. John Smith" {...field} />
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
                            <Input placeholder="e.g. (987) 654-3210" {...field} />
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
                  <FormDescription>Press Enter or comma to add a skill.</FormDescription>
                  <FormMessage />
                </FormItem>
              </div>
            </div>
            
            <div>
              <FormLabel>Work Experience</FormLabel>
              <div className="space-y-4 mt-2">
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
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeExp(index)} className="absolute top-2 right-2">
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
              <FormLabel>Education</FormLabel>
              <div className="space-y-4 mt-2">
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
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeEdu(index)} className="absolute top-2 right-2">
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
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending || isParsing}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Member
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
    <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              The member has been saved. Would you like to send an invitation email to {formData?.name} now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push('/admin/members')}>No, Later</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendInvite}>Yes, Send Invite</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
