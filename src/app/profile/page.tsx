
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useTransition, KeyboardEvent } from 'react';
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
import { Loader2, PlusCircle, Save, Trash, X as XIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
  experience: z.array(workExperienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  skills: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const mockStaffData: ProfileFormValues = {
    name: "Alex Doe",
    email: "alex.doe@staffsync.com",
    phone: "(555) 123-4567",
    skills: ["React", "TypeScript", "Node.js", "Leadership"],
    experience: [{
        companyName: "TechCorp",
        role: "Senior Software Engineer",
        years: "2018 - 2023",
        keyResponsibilities: "Led a team of 5 engineers to deliver a major product redesign. Specialized in front-end architecture and performance optimization."
    }],
    education: [{
        institution: "University of Technology",
        degree: "B.S. in Computer Science",
        years: "2014 - 2018"
    }],
};

export default function ProfilePage() {
  const [isPending, startTransition] = useTransition();
  const [skillInput, setSkillInput] = useState('');
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: mockStaffData,
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
  
  function onSubmit(data: ProfileFormValues) {
    startTransition(() => {
      // API call to update profile would go here
      console.log('Updating profile with data:', data);
      toast({
        title: 'Profile Updated!',
        description: 'Your information has been successfully saved.',
      });
    });
  }

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
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
                <AvatarImage src="https://picsum.photos/seed/user-avatar/100/100" alt="User avatar" data-ai-hint="person portrait" />
                <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-2xl">Your Profile</CardTitle>
                <CardDescription>
                    View and update your personal and professional information.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                      <Input placeholder="e.g. alex.doe@example.com" {...field} readOnly className="cursor-not-allowed bg-muted/50" />
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
                            {/* @ts-ignore */}
                            {field.value}
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

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
