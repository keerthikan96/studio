
'use client';

import { useState } from "react";
import AutomatedPostSetting from "@/components/automated-post-setting";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export type AutomatedPostConfig = {
    isEnabled: boolean;
    publishTime: string;
    template: string;
    backgroundImage: string | null;
};

export default function WorkfeedSettingsPage() {
    const { toast } = useToast();

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

    const handleSave = () => {
        // In a real application, you would save these settings to a database or a configuration file.
        console.log('Saving Birthday Settings:', birthdayConfig);
        console.log('Saving Anniversary Settings:', anniversaryConfig);

        toast({
            title: "Settings Saved!",
            description: "Your Workfeed automation settings have been updated.",
        });
    };
    
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Workfeed Settings</h1>
                    <p className="text-muted-foreground">
                        Configure automated posts for birthdays and work anniversaries.
                    </p>
                </div>
                 <Button onClick={handleSave}>Save All Settings</Button>
            </div>

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
        </div>
    );
}
