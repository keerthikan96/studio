'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { Loader2, UploadCloud, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  skills: z.string().optional(),
});

type StaffFormValues = z.infer<typeof formSchema>;

export default function AddStaffForm() {
  const [isPending, startTransition] = useTransition();
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      experience: '',
      education: '',
      skills: '',
    },
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
          form.reset(result);
          toast({
            title: 'Resume Parsed Successfully!',
            description: 'The form has been pre-filled with the extracted information.',
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
    startTransition(() => {
      // Here you would typically send an invitation email via an API call
      console.log('Inviting staff with data:', data);
      toast({
        title: 'Invitation Sent!',
        description: `An invitation has been sent to ${data.name} at ${data.email}.`,
      });
      form.reset();
    });
  }

  return (
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
            
            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Experience</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe work experience..." {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Invite Staff Member
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
