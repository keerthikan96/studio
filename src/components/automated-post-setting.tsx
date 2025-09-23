
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";

type AutomatedPostSettingProps = {
    title: string;
    description: string;
    toggleId: string;
    toggleLabel: string;
    templateId: string;
    templateLabel: string;
    defaultTemplate: string;
    previewContent: React.ReactNode;
};

export default function AutomatedPostSetting({
    title,
    description,
    toggleId,
    toggleLabel,
    templateId,
    templateLabel,
    defaultTemplate,
    previewContent,
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
                    <Label>Post Image Preview</Label>
                    <div className="relative w-full rounded-lg border border-muted flex flex-col justify-center items-center text-center group bg-gray-900 overflow-hidden">
                       {previewContent}
                    </div>
                </div>


                <div className="flex justify-end">
                    <Button>Save Settings</Button>
                </div>
            </CardContent>
        </Card>
    );
}
