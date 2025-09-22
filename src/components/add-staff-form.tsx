
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useTransition } from 'react';
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
import { Loader2, PlusCircle, Trash, UploadCloud, UserPlus, Save } from 'lucide-react';
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

const domains = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'];
const branches = ['New York', 'London', 'Tokyo', 'Sydney'];

const workExperienceSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  role: z.string().min(1, 'Role is required.'),
  years: z.string().min(1, 'Years are required.'),
  keyResponsibilities: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().optional(),
  domain: z.enum(domains as [string, ...string[]], { required_error: 'Domain is required' }),
  branch: z.enum(branches as [string, ...string[]], { required_error: 'Branch is required' }),
  experience: z.array(workExperienceSchema).optional(),
  education: z.string().optional(),
  skills: z.string().optional(),
});

type StaffFormValues = z.infer<typeof formSchema>;

type AddStaffFormProps = {
    onAddStaff: (staff: Omit<Member, 'id' | 'status'>) => void;
};

function generateSecureToken() {
    // In a real app, use a crypto library for this.
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default function AddStaffForm({ onAddStaff }: AddStaffFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isParsing, setIsParsing] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [formData, setFormData] = useState<StaffFormValues | null>(null);
  const { toast } = useToast();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      experience: [],
      education: '',
      skills: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "experience",
  });

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
            branch: result.branch || currentValues.branch,
          });
          toast({
            title: 'Resume Parsed Successfully!',
            description: 'The form has been pre-filled. Please select a domain and branch.',
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
    startTransition(() => {
        const { experience, education, skills, phone, ...memberData} = data;
        // @ts-ignore
        onAddStaff(memberData);
        toast({
            title: 'Member Saved',
            description: `${data.name} has been added to the member list.`,
        });
        setShowInviteDialog(true);
    });
  }

  const handleSendInvite = () => {
    if (!formData) return;
     const token = generateSecureToken();
      const invitationLink = `${window.location.origin}/set-password?token=${token}&email=${encodeURIComponent(formData.email)}`;
      
      console.log('--- Invitation Email ---');
      console.log(`To: ${formData.email}`);
      console.log('Subject: You have been invited to join StaffSync!');
      console.log(`Hi ${formData.name},`);
      console.log(`Please click the link below to set up your account. This link will expire in 7 days.`);
      console.log(invitationLink);
      console.log('------------------------');
      
      toast({
        title: 'Invitation Sent!',
        description: `An invitation has been sent to ${formData.name} at ${formData.email}.`,
      });
      setShowInviteDialog(false);
      form.reset();
  }

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
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a branch" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {branches.map(branch => <SelectItem key={branch} value={branch}>{branch}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. React, Next.js, Project Management" {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated list of skills.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormLabel>Work Experience</FormLabel>
              <div className="space-y-4 mt-2">
                {fields.map((field, index) => (
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
                      <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)} className="absolute top-2 right-2">
                        <Trash className="h-4 w-4" />
                      </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ companyName: '', role: '', years: '', keyResponsibilities: '' })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Work Experience
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="education"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe education background..." {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <AlertDialogCancel onClick={() => form.reset()}>No, Later</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendInvite}>Yes, Send Invite</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
