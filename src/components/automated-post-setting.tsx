
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { UploadCloud } from 'lucide-react';
import Image from 'next/image';

type AutomatedPostSettingProps = {
    title: string;
    description: string;
    toggleId: string;
    toggleLabel: string;
    templateId: string;
    templateLabel: string;
    defaultTemplate: string;
    imageUploadDescription: string;
    imageHint: string;
    placeHolderImageUrl: string;
};

export default function AutomatedPostSetting({
    title,
    description,
    toggleId,
    toggleLabel,
    templateId,
    templateLabel,
    defaultTemplate,
    imageUploadDescription,
    imageHint,
    placeHolderImageUrl,
}: AutomatedPostSettingProps) {
    const [template, setTemplate] = useState(defaultTemplate);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                    <Switch id={toggleId} />
                    <Label htmlFor={toggleId}>{toggleLabel}</Label>
                </div>

                <div className="space-y-2">
                    <Label htmlFor={templateId}>{templateLabel}</Label>
                    <Textarea
                        id={templateId}
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        rows={4}
                        placeholder="Use {name} for the member's name and {years} for anniversary years."
                    />
                    <p className="text-xs text-muted-foreground">
                        You can use placeholders like <code>{`{name}`}</code> and <code>{`{years}`}</code> (for anniversaries).
                    </p>
                </div>
                
                <div className="space-y-2">
                    <Label>Post Image</Label>
                    <div className="relative aspect-[3/2] w-full rounded-lg border-2 border-dashed border-muted flex flex-col justify-center items-center text-center group">
                        <Image 
                            src={placeHolderImageUrl} 
                            alt="Post image preview" 
                            fill
                            className="object-cover rounded-md"
                            data-ai-hint={imageHint}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex flex-col justify-center items-center">
                            <Button>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Upload Image
                            </Button>
                        </div>
                    </div>
                     <p className="text-xs text-muted-foreground">
                        {imageUploadDescription}
                    </p>
                </div>


                <div className="flex justify-end">
                    <Button>Save Settings</Button>
                </div>
            </CardContent>
        </Card>
    );
}
