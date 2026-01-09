
'use client';

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { getRoleAction, getPermissionsAction, createRoleAction, updateRoleAction } from "@/app/actions/roles";
import { Role } from "@/lib/mock-data";
import { Permission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { PERMISSION_RESOURCES } from "@/lib/permissions";

const formSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters."),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

type RoleFormValues = z.infer<typeof formSchema>;

type RoleEditorProps = {
  isNewRole?: boolean;
};

export function RoleEditor({ isNewRole = false }: RoleEditorProps) {
    const [role, setRole] = useState<Role | null>(null);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [isPending, startTransition] = useTransition();
    const [isLoading, startLoadingTransition] = useTransition();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const roleId = params.id as string;

    const form = useForm<RoleFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", description: "", permissions: [] },
    });

    useEffect(() => {
        startLoadingTransition(() => {
            getPermissionsAction().then(setAllPermissions);

            if (!isNewRole && roleId) {
                getRoleAction(roleId).then(fetchedRole => {
                    if (fetchedRole) {
                        setRole(fetchedRole);
                        form.reset({
                            name: fetchedRole.name,
                            description: fetchedRole.description || "",
                            permissions: fetchedRole.permissions || [],
                        });
                    } else {
                        toast({ title: "Role not found", variant: "destructive" });
                        router.push('/admin/settings/user-management/roles');
                    }
                });
            }
        });
    }, [roleId, isNewRole, form, router, toast]);
    
    const onSubmit = (data: RoleFormValues) => {
        startTransition(async () => {
            const storedUser = sessionStorage.getItem('loggedInUser');
            const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
            
            const result = isNewRole 
                ? await createRoleAction({ ...data, currentUserId })
                : await updateRoleAction(roleId, { ...data, currentUserId });
            
            if ('error' in result) {
                toast({ title: "Error", description: result.error, variant: "destructive"});
            } else {
                toast({
                    title: `Role ${isNewRole ? 'created' : 'updated'}!`,
                    description: `The role "${data.name}" has been saved.`
                });
                router.push('/admin/settings/user-management/roles');
            }
        });
    };
    
    const permissionsByResource = allPermissions.reduce((acc, permission) => {
        const resource = permission.resource || 'general';
        if (!acc[resource]) {
            acc[resource] = [];
        }
        acc[resource].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    const orderedResources = PERMISSION_RESOURCES;


    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <Button variant="outline" size="sm" asChild>
                <Link href="/admin/settings/user-management/roles">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Roles List
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>{isNewRole ? "Create New Role" : "Edit Role"}</CardTitle>
                    <CardDescription>
                        {isNewRole ? "Define a new role and assign permissions." : `Editing permissions for the "${form.getValues('name') || role?.name || 'selected'}" role.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField name="name" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Role Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField name="description" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>

                            <FormField
                                control={form.control}
                                name="permissions"
                                render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Permissions</FormLabel>
                                        <FormMessage />
                                    </div>
                                    <Accordion type="multiple" className="w-full" defaultValue={['members']}>
                                        {orderedResources.map(resource => (
                                            <AccordionItem value={resource} key={resource}>
                                                <AccordionTrigger className="capitalize">{resource.replace(/_/g, ' ')}</AccordionTrigger>
                                                <AccordionContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                                    {(permissionsByResource[resource] || []).map((item) => (
                                                        <FormField
                                                            key={item.id}
                                                            control={form.control}
                                                            name="permissions"
                                                            render={({ field }) => {
                                                            return (
                                                                <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                                    <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                                                        return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id));
                                                                    }} /></FormControl>
                                                                    <div className="space-y-1 leading-none">
                                                                        <FormLabel>{item.id.split('.')[1].replace(/_/g, ' ')}</FormLabel>
                                                                        <FormMessage className="text-xs">{item.description}</FormMessage>
                                                                    </div>
                                                                </FormItem>
                                                            );
                                                            }}
                                                        />
                                                    ))}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </FormItem>
                                )}
                            />
                            
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isNewRole ? "Create Role" : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

export default RoleEditor;
