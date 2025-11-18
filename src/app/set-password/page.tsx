'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/logo';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { setNewPasswordAction } from '../actions/auth';
import { Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function SetPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
        if (!email || !token) {
            toast({ title: 'Error', description: 'Invalid invitation link.', variant: 'destructive'});
            return;
        }

        const result = await setNewPasswordAction({
            token,
            newPassword: data.password
        });
        
        if (result.success && result.email) {
            toast({
                title: 'Password Set Successfully!',
                description: 'You can now log in with your new password.',
            });
            router.push(`/?new_user=true&email=${result.email}`);
        } else {
            console.log(result);
             toast({
                title: 'Error',
                description: result.error || "Failed to set password. The link may have expired.",
                variant: 'destructive',
            });
        }
    });
  }

  if (!token || !email) {
    return (
         <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className='text-destructive'>Invalid Invitation Link</CardTitle>
                    <CardDescription>This link is either expired or invalid. Please request a new invitation.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Button asChild>
                        <Link href="/">Back to Home</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className='flex justify-center mb-4'>
                <Logo />
            </div>
          <CardTitle>Create Your Password</CardTitle>
          <CardDescription>Welcome to MDP! Please set a secure password for {email}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </FormControl>
                    <FormDescription>
                      Must be at least 8 characters and include an uppercase letter, a number, and a special character.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Saving...' : 'Set Password and Log In'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Link href="/" className="mt-6 text-sm text-muted-foreground hover:text-primary">
        Back to Home
      </Link>
    </main>
  );
}
