
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useTransition, KeyboardEvent, useRef } from 'react';
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
import { ParseResumeToAutofillProfileOutput } from '@/ai/flows/resume-parsing-to-autofill-profile';
import { ResumeReview } from './resume-review';
import { ReviewFieldWrapper } from './review-field-wrapper';

const domains = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'];
const countries = ['Canada', 'USA', 'Sri Lanka'];
const sriLankanBranches = ['Nothern', 'Central', 'Eastern'];
const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Intern'];
const employeeLevels = ['L1', 'L2', 'L3', 'Manager', 'Senior Manager', 'Director'];


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
  first_name: z.string().min(1, 'First name is required.'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required.'),
  gender: z.enum(genders as [string, ...string[]]).optional(),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().optional(),
  street_address: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.enum(countries as [string, ...string[]]).optional(),
  domain: z.enum(domains as [string, ...string[]]).optional(),
  branch: z.string().optional(),
  job_title: z.string().optional(),
  date_of_birth: z.date().optional(),
  start_date: z.date().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  citizenship: z.string().optional(),
  national_id: z.string().optional(),
  passport_no: z.string().optional(),
  visa_work_permit: z.string().optional(),
  visa_work_permit_expiry: z.date().optional(),
  employee_id: z.string().min(1, "Employee ID is required."),
  employment_type: z.enum(employmentTypes as [string, ...string[]]),
  employee_level: z.enum(employeeLevels as [string, ...string[]]),
  reporting_supervisor_id: z.string().optional(),
  experience: z.array(workExperienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  skills: z.array(z.string()).optional(),
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
    onAddStaff: (staffData: { staff: Omit<Member, 'id' | 'status' | 'profile_picture_url' | 'cover_photo_url' | 'role' | 'name' | 'hobbies' | 'volunteer_work'>, sendInvite: boolean, resume?: { url: string, type: string, size: number } }) => Promise<{ success: boolean; error?: string }>;
};

export default function AddStaffForm({ onAddStaff }: AddStaffFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isParsing, setIsParsing] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [formData, setFormData] = useState<StaffFormValues | null>(null);
  const [resumeDataUri, setResumeDataUri] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [parsedData, setParsedData] = useState<ParseResumeToAutofillProfileOutput | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { experience: [], education: [], skills: [] },
  });

   const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control: form.control,
    name: "skills",
  });
  
  const watchedCountry = form.watch('country');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload a PDF, DOC, or DOCX file.',
        });
        return;
    }

    setResumeFile(file);
    setIsParsing(true);
    toast({
      title: 'Parsing Resume...',
      description: 'The AI is extracting information. Please wait.',
    });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUri = reader.result as string;
      setResumeDataUri(dataUri);
      startTransition(async () => {
        const result = await parseResumeAction({ resumeDataUri: dataUri });
        if ('error' in result) {
          toast({
            variant: 'destructive',
            title: 'Parsing Failed',
            description: result.error,
          });
          setParsedData(null);
        } else {
          setParsedData(result);
          
          const formValues: Partial<StaffFormValues> = {};
          for (const key in result) {
              if (Object.prototype.hasOwnProperty.call(result, key) && key !== 'unsupportedFields' && result[key]) {
                  formValues[key] = result[key].value;
              }
          }
          form.reset(formValues);
          toast({
            title: 'Resume Parsed Successfully!',
            description: 'Please review the extracted information and complete any missing fields.',
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
    setShowInviteDialog(true);
  }

  const handleSaveAndInvite = (sendInvite: boolean) => {
    if (!formData) return;

    startTransition(async () => {
      let resumeDataForAction: { url: string; type: string; size: number } | undefined;

      if (resumeFile && resumeDataUri) {
          // This is a mock upload for demonstration. In a real app, you would upload to a GCS bucket.
          const destination = `resumes/${formData.email}-${Date.now()}-${resumeFile.name}`;
          const publicUrl = `https://storage.googleapis.com/mock-bucket/${destination}`;
          resumeDataForAction = { url: publicUrl, type: resumeFile.type, size: resumeFile.size };
      }

      const result = await onAddStaff({ staff: formData, sendInvite, resume: resumeDataForAction });

      if (result.success) {
          toast({
              title: 'Member Saved',
              description: `${formData.first_name} ${formData.last_name} has been added to the member list.`,
          });
          if(sendInvite) {
              toast({
                  title: 'Invitation Sent!',
                  description: `An invitation has been sent to ${formData.first_name}. Check the server console for the link.`,
              });
          }
          router.push('/admin/members');
      } else {
            toast({
              title: 'Error Saving Member',
              description: result.error || 'An unknown error occurred.',
              variant: 'destructive',
          });
      }
      setShowInviteDialog(false);
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
        {!parsedData ? (
             <div className="relative rounded-lg border-2 border-dashed border-muted p-6 text-center hover:border-primary/50 transition-colors">
                 <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">
                    {isParsing ? 'Parsing resume...' : 'Upload a resume to autofill'}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    PDF, DOC, DOCX up to 10MB
                </p>
                <Input
                    id="resume-upload"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    disabled={isParsing}
                    ref={fileInputRef}
                />
                 {isParsing && <div className="absolute inset-0 bg-background/80 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <ResumeReview parsedData={parsedData} resumeDataUri={resumeDataUri} />
                </div>
                <div className="lg:col-span-2">
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <ReviewFieldWrapper confidence={parsedData.first_name?.confidence}>
                                <FormField control={form.control} name="first_name" render={({ field }) => (<FormItem><FormLabel>First Name <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </ReviewFieldWrapper>
                            <ReviewFieldWrapper confidence={parsedData.middle_name?.confidence}>
                                <FormField control={form.control} name="middle_name" render={({ field }) => (<FormItem><FormLabel>Middle Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </ReviewFieldWrapper>
                             <ReviewFieldWrapper confidence={parsedData.last_name?.confidence}>
                                <FormField control={form.control} name="last_name" render={({ field }) => (<FormItem><FormLabel>Last Name <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </ReviewFieldWrapper>

                             <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <ReviewFieldWrapper confidence={parsedData.gender?.confidence}>
                                    <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent>{genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                </ReviewFieldWrapper>
                                <ReviewFieldWrapper confidence={0.9}>
                                    <FormField control={form.control} name="date_of_birth" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date of Birth</FormLabel><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                                </ReviewFieldWrapper>
                            </div>
                            
                            <h3 className="text-lg font-medium border-b pb-2">Contact Information</h3>
                            <ReviewFieldWrapper confidence={parsedData.email?.confidence}>
                                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Work Email <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </ReviewFieldWrapper>
                            <ReviewFieldWrapper confidence={parsedData.phone?.confidence}>
                                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </ReviewFieldWrapper>

                            <h3 className="text-lg font-medium border-b pb-2">Address</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ReviewFieldWrapper confidence={parsedData.street_address?.confidence}><FormField control={form.control} name="street_address" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /></ReviewFieldWrapper>
                                <ReviewFieldWrapper confidence={parsedData.city?.confidence}><FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /></ReviewFieldWrapper>
                                <ReviewFieldWrapper confidence={parsedData.state_province?.confidence}><FormField control={form.control} name="state_province" render={({ field }) => (<FormItem><FormLabel>State / Province</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /></ReviewFieldWrapper>
                                <ReviewFieldWrapper confidence={parsedData.postal_code?.confidence}><FormField control={form.control} name="postal_code" render={({ field }) => (<FormItem><FormLabel>Postal / Zip Code</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /></ReviewFieldWrapper>
                                <ReviewFieldWrapper confidence={parsedData.country?.confidence}><FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl><SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} /></ReviewFieldWrapper>
                            </div>
                            
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isPending || isParsing}>
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Member
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
    <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              The member has been saved. Would you like to send an invitation email to {formData?.first_name} {formData?.last_name} to set up their account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleSaveAndInvite(false)}>No, Later</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSaveAndInvite(true)} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Save & Send Invite'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
