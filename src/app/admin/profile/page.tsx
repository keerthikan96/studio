
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
import { getMemberByIdAction, updateMemberAction } from '../../actions/staff';
import ProfilePictureUploader from '@/components/profile-picture-uploader';
import CoverPhotoUploader from '@/components/cover-photo-uploader';

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
  cover_photo_url: z.string().url().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AdminProfilePage() {
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
      cover_photo_url: null,
    },
  });

  useEffect(() => {
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.id === 'admin-user-001') {
         const adminAsMember: Member = {
           id: user.id,
           name: user.name || 'People and Culture office',
           email: user.email,
           status: 'active',
           experience: user.experience || [],
           education: user.education || [],
           skills: user.skills || [],
           profile_picture_url: user.profile_picture_url || null,
           cover_photo_url: user.cover_photo_url || null,
         };
         setMember(adminAsMember);
         form.reset(adminAsMember);
      } else {
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

    // Special handling for the admin user who is not in the database
    if (member.id === 'admin-user-001') {
        const currentUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
        const updatedAdmin = { ...currentUser, ...data };
        sessionStorage.setItem('loggedInUser', JSON.stringify(updatedAdmin));
        
        setMember(prev => ({...prev, ...updatedAdmin}));
        form.reset(updatedAdmin, { keepDirty: false });

        toast({
            title: 'Profile Updated!',
            description: 'Your information has been successfully saved.',
        });
        
        // Notify other components like UserNav to update
        window.dispatchEvent(new CustomEvent('profile-picture-updated'));
        window.dispatchEvent(new CustomEvent('cover-photo-updated'));
        return; // Important: exit after handling admin
    } 
    
    // Standard update logic for regular members
    startTransition(async () => {
        const dirtyFields = form.formState.dirtyFields;
        // Image URLs are handled separately by their uploader components and don't need to be in this submission
        const { profile_picture_url, cover_photo_url, ...otherDirtyFields } = dirtyFields;

        if (Object.keys(otherDirtyFields).length === 0) {
            toast({ title: 'No Changes', description: 'No changes were detected to save.' });
            return;
        }
        
        const dataToUpdate: Partial<Omit<ProfileFormValues, 'profile_picture_url' | 'cover_photo_url'>> = {};
        for (const field of Object.keys(otherDirtyFields)) {
            // @ts-ignore
            if(Object.prototype.hasOwnProperty.call(data, field)) {
                // @ts-ignore
                dataToUpdate[field] = data[field];
            }
        }
        
        const result = await updateMemberAction(member.id, dataToUpdate);

        if ('error' in result) {
            toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
        } else {
            toast({
                title: 'Profile Updated!',
                description: 'Your information has been successfully saved.',
            });
            setMember(result as Member);
            form.reset({
                ...(result as Member),
                experience: (result as Member).experience || [],
                education: (result as Member).education || [],
                skills: (result as Member).skills || [],
            }, { keepDirty: false });
        }
    });
  }

  const handleProfileUploadSuccess = (newUrl: string) => {
    if (!member) return;
    form.setValue('profile_picture_url', newUrl, { shouldDirty: false });
    const updatedMember = { ...member, profile_picture_url: newUrl };
    setMember(updatedMember);
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.id === member.id) {
            user.profile_picture_url = newUrl;
            sessionStorage.setItem('loggedInUser', JSON.stringify(user));
            window.dispatchEvent(new CustomEvent('profile-picture-updated'));
        }
    }
  };
  
  const handleCoverUploadSuccess = (newUrl: string) => {
    if (!member) return;
    form.setValue('cover_photo_url', newUrl, { shouldDirty: false });
     const updatedMember = { ...member, cover_photo_url: newUrl };
      setMember(updatedMember);
      const storedUser = sessionStorage.getItem('loggedInUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.id === member.id) {
          user.cover_photo_url = newUrl;
          sessionStorage.setItem('loggedInUser', JSON.stringify(user));
           window.dispatchEvent(new CustomEvent('cover-photo-updated'));
        }
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
    <Card className="max-w-4xl mx-auto overflow-hidden">
        <CoverPhotoUploader
            memberId={member.id}
            currentImageUrl={member.cover_photo_url}
            onUploadSuccess={handleCoverUploadSuccess}
            isEditable={true}
        />
        <div className='-mt-16 sm:-mt-20 px-4 sm:px-6 flex items-end gap-4'>
            <ProfilePictureUploader
                memberId={member.id}
                currentImageUrl={member.profile_picture_url}
                onUploadSuccess={handleProfileUploadSuccess}
                userName={member.name}
                isEditable={true}
                className='w-24 h-24 sm:w-32 sm:h-32 text-4xl border-4 border-card'
            />
            <div className='pb-2'>
                <CardTitle className="text-2xl sm:text-3xl">{member.name}</CardTitle>
                <CardDescription>
                    {member.email}
                </CardDescription>
            </div>
        </div>
      <CardContent className="pt-6">
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
                      <Input placeholder="e.g. (123) 456-7890" {...field} value={field.value ?? ''} />
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
                              <Textarea {...field} placeholder="Describe key responsibilities..." value={field.value ?? ''}/>
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                      
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

    