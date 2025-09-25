
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useEffect, useState } from 'react';
import Link from 'next/link';
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
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';


const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof formSchema>;

const handleLoginSession = (user: { id: string, name: string, email: string, role: 'admin' | 'staff' | 'HR' }) => {
    sessionStorage.setItem('loggedInUser', JSON.stringify(user));
};

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const newUserEmail = searchParams.get('email');
    const newUserParam = searchParams.get('new_user');
    const passwordResetParam = searchParams.get('password_reset');

    if (newUserParam === 'true' && newUserEmail) {
        form.setValue('email', newUserEmail);
        toast({
            title: 'Account Activated!',
            description: 'You can now log in with your new password.',
        });
    }
    if (passwordResetParam === 'true' && newUserEmail) {
        form.setValue('email', newUserEmail);
         toast({
            title: 'Password Reset Successful!',
            description: 'You can now log in with your new password.',
        });
    }
  }, [searchParams, form, toast]);


  function onSubmit(data: LoginFormValues) {
    startTransition(async () => {
      const result = await loginAction(data);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: result.error,
        });
      } else if (result.user) {
        handleLoginSession(result.user);
        toast({
          title: 'Login Successful',
          description: 'Redirecting...',
        });
        
        if (result.user.role === 'HR') {
            router.push('/admin/dashboard');
        } else {
            router.push('/dashboard');
        }
      }
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
                <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                     <Link href="/forgot-password" passHref>
                        <span className="text-sm text-primary hover:underline cursor-pointer">
                            Forgot password?
                        </span>
                    </Link>
                </div>
              <FormControl>
                <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                    <Button 
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                        >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
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
