
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
import { Loader2, PlusCircle, Save, Trash, X as XIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Member } from '@/lib/mock-data';
import { getMemberByIdAction, updateMemberAction } from '../actions/staff';
import ProfilePictureUploader from '@/components/profile-picture-uploader';

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
  profile_picture_url: z.string().url().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isPending, startTransition] = useTransition();
  const [skillInput, setSkillInput] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const { toast } = useToast();

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

  useEffect(() => {
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      startTransition(() => {
        getMemberByIdAction(user.id).then(currentMember => {
            if (currentMember) {
              setMember(currentMember);
              form.reset({
                ...currentMember,
                experience: currentMember.experience || [],
                education: currentMember.education || [],
                skills: currentMember.skills || [],
              });
            }
        });
      });
    }
  }, [form]);


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
    if (!member) return;

    startTransition(async () => {
      const dirtyFields = form.formState.dirtyFields;
      // The profile picture is handled separately by its component, so we ignore it here.
      const { profile_picture_url, ...otherDirtyFields } = dirtyFields;

      if (Object.keys(otherDirtyFields).length === 0) {
        toast({ title: 'No Changes', description: 'No changes were detected to save.' });
        return;
      }
      
      const dataToUpdate: Partial<Omit<ProfileFormValues, 'profile_picture_url'>> = {};
      for (const field of Object.keys(otherDirtyFields)) {
          // @ts-ignore
          dataToUpdate[field] = data[field];
      }

      const result = await updateMemberAction(member.id, dataToUpdate);

      if ('error' in result) {
          toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
      } else {
        toast({
          title: 'Profile Updated!',
          description: 'Your information has been successfully saved.',
        });
        // Re-fetch data and reset form to reflect the new state and clear dirty status
        const updatedMember = await getMemberByIdAction(member.id);
        if (updatedMember) {
          form.reset({
            ...updatedMember,
            experience: updatedMember.experience || [],
            education: updatedMember.education || [],
            skills: updatedMember.skills || [],
          });
        }
      }
    });
  }

  const handleUploadSuccess = (newUrl: string) => {
    form.setValue('profile_picture_url', newUrl, { shouldDirty: false });
     if (member) {
      setMember({ ...member, profile_picture_url: newUrl });
    }
  };

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

  if (!member) {
      return <div className='flex justify-center items-center h-full'><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }


  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex flex-col items-center gap-4 text-center">
            <ProfilePictureUploader
                memberId={member.id}
                currentImageUrl={member.profile_picture_url}
                onUploadSuccess={handleUploadSuccess}
                userName={member.name}
            />
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
              <Button type="submit" disabled={isPending || !form.formState.isDirty}>
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
