
'use client';

import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export type Slide = {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    actionEnabled: boolean;
    action: string;
};

type CarouselSlideCardProps = {
    slide: Slide;
    onUpdate: (slide: Slide) => void;
    onDelete: (slideId: string) => void;
};

const availableActions = [
    { value: 'none', label: 'None' },
    { value: 'view_tasks', label: 'View Tasks' },
    { value: 'view_calendar', label: 'View Calendar' },
    { value: 'view_docs', label: 'View Documents' },
    { value: 'submit_expense', label: 'Submit Expense' },
];

export function CarouselSlideCard({ slide, onUpdate, onDelete }: CarouselSlideCardProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFieldChange = (field: keyof Slide, value: any) => {
        onUpdate({ ...slide, [field]: value });
    };
    
    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // In a real app, you would upload this file to a storage service (like GCS)
            // and get back a URL. For this demo, we'll use a local blob URL as a preview.
            const newImageUrl = URL.createObjectURL(file);
            handleFieldChange('imageUrl', newImageUrl);
            toast({ title: "Image Selected", description: "Remember to save changes to persist the new image." });
        }
    };


    return (
        <Card>
            <CardHeader className="p-4">
                <div className="relative aspect-video w-full rounded-md overflow-hidden group">
                    <Image src={slide.imageUrl} alt={slide.title} fill className="object-cover" data-ai-hint="abstract background"/>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="outline" size="sm" onClick={handleImageUploadClick}>
                            <Upload className="mr-2 h-4 w-4" /> Change Image
                        </Button>
                    </div>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
                 <div className="space-y-1">
                    <Label htmlFor={`title-${slide.id}`}>Slide Title</Label>
                    <Input id={`title-${slide.id}`} value={slide.title} onChange={e => handleFieldChange('title', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`desc-${slide.id}`}>Slide Description</Label>
                    <Textarea id={`desc-${slide.id}`} value={slide.description} onChange={e => handleFieldChange('description', e.target.value)} rows={3} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <Label htmlFor={`action-toggle-${slide.id}`}>Enable/Disable Action</Label>
                    <Switch id={`action-toggle-${slide.id}`} checked={slide.actionEnabled} onCheckedChange={value => handleFieldChange('actionEnabled', value)} />
                </div>
                 {slide.actionEnabled && (
                    <div className="space-y-1">
                        <Label htmlFor={`action-select-${slide.id}`}>Button Action</Label>
                        <Select value={slide.action} onValueChange={value => handleFieldChange('action', value)}>
                            <SelectTrigger id={`action-select-${slide.id}`}>
                                <SelectValue placeholder="Select an action" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableActions.map(action => (
                                    <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                 )}
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-end">
                <Button variant="destructive" size="icon" onClick={() => onDelete(slide.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}

