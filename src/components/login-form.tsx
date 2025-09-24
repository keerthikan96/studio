
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useTransition, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import { Member } from '@/lib/mock-data';
import { getMembersAction } from '@/app/actions/staff';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = (user: { id: string, name: string, email: string, role: 'admin' | 'staff' | 'HR' }) => {
    sessionStorage.setItem('loggedInUser', JSON.stringify(user));
  };
  
  useEffect(() => {
    // This is a workaround for a demo. In a real app, you'd clear this on logout.
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new_user') === 'true') {
        const email = urlParams.get('email');
        if (email) {
            startTransition(async () => {
                const members = await getMembersAction();
                const newUser = members.find(m => m.email === email);
                if (newUser) {
                    handleLogin({ id: newUser.id, name: newUser.name, email: newUser.email, role: 'staff'});
                }
            })
        }
    }
  }, []);

  function onSubmit(data: LoginFormValues) {
    startTransition(async () => {
      
      // Mock authentication logic
      if (data.password === 'password') { // Simple password check for demo
        if (data.email === 'admin@gmail.com') {
          // Admin login doesn't need a real DB record for this demo
          handleLogin({ id: 'admin-user-001', name: 'People and Culture office', email: 'admin@gmail.com', role: 'HR' });
          toast({
            title: 'Login Successful',
            description: 'Redirecting to admin dashboard...',
          });
          router.push('/admin/dashboard');
          return;
        }

        // For staff, we check if they exist in the DB
        const members = await getMembersAction();
        const member = members.find(m => m.email === data.email && m.status === 'active');
        
        if (member) {
            handleLogin({ id: member.id, name: member.name, email: data.email, role: 'staff' });
            toast({
                title: 'Login Successful',
                description: 'Redirecting to your profile...',
            });
            router.push('/profile');
            return;
        }
      }
      
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email, password, or inactive account.',
      });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g. alex.doe@staffsync.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          Log In
        </Button>
      </form>
    </Form>
  );
}
