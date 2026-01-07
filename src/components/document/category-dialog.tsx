
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Edit } from 'lucide-react';
import { DocumentCategory } from '@/app/actions/documents';

const formSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters.'),
});
type FormValues = z.infer<typeof formSchema>;

type CategoryDialogProps = {
  category?: DocumentCategory;
  onSubmit: (values: FormValues, id?: string) => Promise<boolean>;
};

export function CategoryDialog({ category, onSubmit }: CategoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || '',
    },
  });

  useEffect(() => {
    form.reset({ name: category?.name || '' });
  }, [category, isOpen]);

  const handleSubmit = (data: FormValues) => {
    startTransition(async () => {
      const success = await onSubmit(data, category?.id);
      if (success) {
        setIsOpen(false);
      }
    });
  };

  const isEditing = !!category;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="secondary" size="sm">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        ) : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Category' : 'Create New Category'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the name of this document category.' : 'Enter a name for the new category.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
