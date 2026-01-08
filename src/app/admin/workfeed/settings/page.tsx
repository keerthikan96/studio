
'use client';

import { useState, useTransition, useEffect } from "react";
import AutomatedPostSetting from "@/components/automated-post-setting";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getWorkfeedSettingsAction, saveWorkfeedSettingsAction, createPostAction } from "@/app/actions/workfeed";
import { getMembersAction } from "@/app/actions/staff";
import { Loader2, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Member } from "@/lib/mock-data";
import BirthdayCardPreview from "@/components/birthday-card-preview";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import AutomatedPostRecipientList from "@/components/automated-post-recipient-list";


export type AutomatedPostConfig = {
    isEnabled: boolean;
    publishTime: string;
    template: string;
    backgroundImage: string | null;
};

export default function WorkfeedSettingsPage() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [members, setMembers] = useState<Member[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<'birthday' | 'anniversary'>('birthday');
    const [postContent, setPostContent] = useState('');
    const [currentUser, setCurrentUser] = useState<{ id: string, name: string, email: string, role: string, profile_picture_url: string } | null>(null);


    const [birthdayConfig, setBirthdayConfig] = useState<AutomatedPostConfig>({
        isEnabled: false,
        publishTime: '09:00',
        template: "Happy Birthday, {name}! Wishing you a fantastic day and a wonderful year ahead! 🎉🎂",
        backgroundImage: null,
    });

    const [anniversaryConfig, setAnniversaryConfig] = useState<AutomatedPostConfig>({
        isEnabled: false,
        publishTime: '09:00',
        template: "Congratulations, {name}, on your {years}-year work anniversary! Thank you for your dedication and hard work. Here's to many more successful years! 🥂",
        backgroundImage: null,
    });
    
    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }

        startTransition(async () => {
            const settingsPromise = getWorkfeedSettingsAction();
            const storedUser = sessionStorage.getItem('loggedInUser');
            const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
            const membersPromise = getMembersAction(currentUserId);
            
            const [settings, memberList] = await Promise.all([settingsPromise, membersPromise]);

            if (settings) {
                if(settings.birthday) setBirthdayConfig(settings.birthday);
                if(settings.anniversary) setAnniversaryConfig(settings.anniversary);
            }
            setMembers(memberList);
        });
    }, []);

    useEffect(() => {
        if (selectedMember) {
            const template = selectedTemplate === 'birthday' ? birthdayConfig.template : anniversaryConfig.template;
            let newContent = template.replace('{name}', selectedMember.name);
            if (selectedTemplate === 'anniversary') {
                const years = selectedMember.start_date ? new Date().getFullYear() - new Date(selectedMember.start_date).getFullYear() : 1;
                newContent = newContent.replace('{years}', years.toString());
            }
            setPostContent(newContent);
        } else {
            setPostContent('');
        }
    }, [selectedMember, selectedTemplate, birthdayConfig.template, anniversaryConfig.template]);

    const handleSave = () => {
        startTransition(async () => {
            const result = await saveWorkfeedSettingsAction({
                birthday: birthdayConfig,
                anniversary: anniversaryConfig
            });

            if (result.success) {
                toast({
                    title: "Settings Saved!",
                    description: "Your Workfeed automation settings have been updated.",
                });
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to save settings.",
                    variant: "destructive",
                });
            }
        });
    };

    const handleCreatePost = () => {
        if (!selectedMember || !postContent || !currentUser) {
            toast({ title: 'Error', description: 'Please select a member and ensure content is not empty.', variant: 'destructive' });
            return;
        }

        startTransition(async () => {
            // For now, we are not generating an image, just the text content.
            const result = await createPostAction(postContent, currentUser);

            if ('error' in result) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Post Created!', description: 'The post has been added to the workfeed.' });
                setIsCreateDialogOpen(false);
                setSelectedMember(null);
            }
        });
    };

     const [open, setOpen] = useState(false)
    
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Workfeed Settings</h1>
                    <p className="text-muted-foreground">
                        Configure automated posts and manually create announcements.
                    </p>
                </div>
                 <div className="flex items-center gap-2">
                     <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Create Manual Post</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <ScrollArea className="max-h-[80vh] pr-6">
                                <div className="space-y-4 pt-4">
                                    <DialogHeader className="pr-6">
                                        <DialogTitle>Create a Manual Workfeed Post</DialogTitle>
                                        <DialogDescription>
                                            Choose a member and a template to generate a post. You can edit the content before publishing.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 pr-6">
                                        <div className="space-y-2">
                                            <Label>Select Member</Label>
                                            <Popover open={open} onOpenChange={setOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={open}
                                                    className="w-full justify-between"
                                                    >
                                                    {selectedMember
                                                        ? selectedMember.name
                                                        : "Select member..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[260px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search member..." />
                                                        <CommandList>
                                                            <CommandEmpty>No member found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {members.map((member) => (
                                                                <CommandItem
                                                                    key={member.id}
                                                                    value={member.name}
                                                                    onSelect={(currentValue) => {
                                                                        const member = members.find(m => m.name.toLowerCase() === currentValue.toLowerCase())
                                                                        setSelectedMember(member || null)
                                                                        setOpen(false)
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", selectedMember?.id === member.id ? "opacity-100" : "opacity-0")} />
                                                                    {member.name}
                                                                </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Select Template</Label>
                                            <Select value={selectedTemplate} onValueChange={(v: any) => setSelectedTemplate(v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="birthday">Birthday</SelectItem>
                                                    <SelectItem value="anniversary">Anniversary</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pr-6">
                                        <Label htmlFor="post-content">Post Content</Label>
                                        <Textarea id="post-content" value={postContent} onChange={(e) => setPostContent(e.target.value)} rows={5} />
                                    </div>
                                    {selectedMember && (
                                        <div className="space-y-2 pr-6">
                                            <Label>Preview</Label>
                                            <BirthdayCardPreview 
                                                name={selectedMember.name}
                                                imageUrl={selectedMember.profile_picture_url || '/placeholder.svg'}
                                                type={selectedTemplate}
                                                years={selectedMember.start_date ? new Date().getFullYear() - new Date(selectedMember.start_date).getFullYear() : 1}
                                                onImageUpload={() => {}}
                                                backgroundImageUrl={null}
                                            />
                                        </div>
                                    )}
                                    <DialogFooter className="pr-6 pt-4">
                                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                        <Button onClick={handleCreatePost} disabled={isPending || !selectedMember}>
                                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Post to Feed'}
                                        </Button>
                                    </DialogFooter>
                                </div>
                            </ScrollArea>
                        </DialogContent>
                     </Dialog>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save All Settings'}
                    </Button>
                 </div>
            </div>
            
            {isPending && members.length === 0 ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <AutomatedPostSetting
                            title="Automatic Birthday Posts"
                            description="This post will be automatically generated on a member's birthday using their name and profile picture."
                            toggleId="birthday-toggle"
                            toggleLabel="Enable Birthday Posts"
                            config={birthdayConfig}
                            onConfigChange={setBirthdayConfig}
                            previewName="Jessica Singh"
                            previewAvatarUrl="/placeholder.svg"
                            previewType="birthday"
                        />

                        <AutomatedPostSetting
                            title="Automatic Anniversary Posts"
                            description="This post will be automatically generated on a member's work anniversary, celebrating their years of service."
                            toggleId="anniversary-toggle"
                            toggleLabel="Enable Anniversary Posts"
                            config={anniversaryConfig}
                            onConfigChange={setAnniversaryConfig}
                            previewName="John Doe"
                            previewAvatarUrl="/placeholder.svg"
                            previewType="anniversary"
                            previewYears={5}
                        />
                    </div>
                    <AutomatedPostRecipientList members={members} />
                </>
            )}
        </div>
    );
}

    

    