
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
import { Loader2, PlusCircle, Save, Trash, X as XIcon, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Member } from '@/lib/mock-data';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMemberByIdAction, updateMemberAction, updateMemberProfilePictureAction } from '@/app/actions/staff';
import ProfilePictureUploader from '@/components/profile-picture-uploader';
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
  profile_picture_url: z.string().optional(),
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

export default function MemberProfilePage() {
  const [isPending, startTransition] = useTransition();
  const [skillInput, setSkillInput] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;
  const [member, setMember] = useState<Member | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        name: '',
        email: '',
        phone: '',
        experience: [],
        education: [],
        skills: [],
        profile_picture_url: '',
    },
  });

  useEffect(() => {
    if (memberId) {
        startTransition(() => {
            getMemberByIdAction(memberId).then(currentMember => {
                if (currentMember) {
                    setMember(currentMember);
                    form.reset({
                        ...currentMember,
                        experience: currentMember.experience || [],
                        education: currentMember.education || [],
                        skills: currentMember.skills || [],
                        profile_picture_url: currentMember.profile_picture_url || '',
                    });
                } else {
                    toast({ title: "Member not found", variant: "destructive" });
                    router.push('/admin/members');
                }
            });
        });
    }
  }, [memberId, form, toast, router]);

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
  
  function onSubmit(data: ProfileFormValues) {
    startTransition(async () => {
        let hasError = false;

        const { profile_picture_url, ...otherData } = data;
        const dirtyFields = form.formState.dirtyFields;

        // Update profile picture only if it has changed
        if (dirtyFields.profile_picture_url && profile_picture_url) {
            const pictureResult = await updateMemberProfilePictureAction(memberId, profile_picture_url);
            if ('error' in pictureResult) {
                toast({ title: 'Update Failed', description: pictureResult.error, variant: 'destructive' });
                hasError = true;
            }
        }

        // Check if any other field is dirty before updating
        const otherFieldsDirty = Object.keys(dirtyFields).some(field => field !== 'profile_picture_url');
        if (otherFieldsDirty) {
            const result = await updateMemberAction(memberId, otherData);
            if ('error' in result) {
                toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
                hasError = true;
            }
        }
        
        if (!hasError) {
            toast({
                title: 'Profile Updated!',
                description: `${data.name}'s information has been successfully saved.`,
            });
            router.push('/admin/members');
        }
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

  if (!member) {
      return <div className='flex justify-center items-center h-full'><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
        <Button variant="outline" asChild className="mb-4">
            <Link href="/admin/members">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Member List
            </Link>
        </Button>
        <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <div className="flex flex-col items-center gap-4 text-center">
                 <ProfilePictureUploader
                    currentImage={form.watch('profile_picture_url')}
                    onImageSelect={(dataUri) => form.setValue('profile_picture_url', dataUri, { shouldDirty: true })}
                    userName={member.name}
                 />
                <div>
                    <CardTitle className="text-2xl">Edit Profile</CardTitle>
                    <CardDescription>
                        View and update member's personal and professional information.
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
    </>
  );
}
