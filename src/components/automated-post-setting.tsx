
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import BirthdayCardPreview from './birthday-card-preview';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type AutomatedPostSettingProps = {
    title: string;
    description: string;
    toggleId: string;
    toggleLabel: string;
    templateId: string;
    templateLabel: string;
    defaultTemplate: string;
    previewName: string;
    previewAvatarUrl: string;
    previewYears?: number;
    previewType: 'birthday' | 'anniversary';
};

export default function AutomatedPostSetting({
    title,
    description,
    toggleId,
    toggleLabel,
    templateId,
    templateLabel,
    defaultTemplate,
    previewName,
    previewAvatarUrl,
    previewYears,
    previewType,
}: AutomatedPostSettingProps) {
    const [template, setTemplate] = useState(defaultTemplate);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [publishTime, setPublishTime] = useState('09:00');

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setBackgroundImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                    <Switch id={toggleId} checked={isEnabled} onCheckedChange={setIsEnabled} />
                    <Label htmlFor={toggleId}>{toggleLabel}</Label>
                </div>

                {isEnabled && (
                     <div className="space-y-2">
                        <Label htmlFor={`${toggleId}-time`}>Time of Publishing</Label>
                        <Select value={publishTime} onValueChange={setPublishTime}>
                            <SelectTrigger id={`${toggleId}-time`} className="w-[180px]">
                                <SelectValue placeholder="Select a time" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="09:00">9:00 AM</SelectItem>
                                <SelectItem value="10:00">10:00 AM</SelectItem>
                                <SelectItem value="12:00">12:00 PM (Noon)</SelectItem>
                                <SelectItem value="14:00">2:00 PM</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

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
                    <Label>Post Image Preview</Label>
                    <BirthdayCardPreview 
                        name={previewName}
                        imageUrl={previewAvatarUrl}
                        type={previewType}
                        years={previewYears}
                        onImageUpload={handleImageUpload}
                        backgroundImageUrl={backgroundImage}
                    />
                </div>


                <div className="flex justify-end">
                    <Button>Save Settings</Button>
                </div>
            </CardContent>
        </Card>
    );
}
