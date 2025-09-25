
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useTransition } from 'react';
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
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Logo from '@/components/logo';
import { requestPasswordResetAction } from '../actions/auth';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(data: ForgotPasswordFormValues) {
    startTransition(async () => {
      const result = await requestPasswordResetAction(data.email);
      if (result.success) {
        toast({
          title: 'Reset Link Sent',
          description: "If an account exists, a password reset link has been sent. Please check your console for the link.",
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || "An unknown error occurred.",
        });
      }
    });
  }

  return (
     <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
       <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo />
            </div>
            <CardTitle>Forgot Your Password?</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a link to reset it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="e.g. alex.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : "Send Reset Link"}
                </Button>
                 <Button variant="link" className="w-full" asChild>
                    <Link href="/">Back to Login</Link>
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
