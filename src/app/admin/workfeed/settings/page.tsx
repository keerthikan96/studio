
'use client';

import { useState, useTransition, useEffect } from "react";
import AutomatedPostSetting from "@/components/automated-post-setting";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getWorkfeedSettingsAction, saveWorkfeedSettingsAction } from "@/app/actions/workfeed";
import { Loader2 } from "lucide-react";

export type AutomatedPostConfig = {
    isEnabled: boolean;
    publishTime: string;
    template: string;
    backgroundImage: string | null;
};

export default function WorkfeedSettingsPage() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isLoading, startLoadingTransition] = useTransition();

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
        startLoadingTransition(async () => {
            const settings = await getWorkfeedSettingsAction();
            if (settings) {
                if(settings.birthday) setBirthdayConfig(settings.birthday);
                if(settings.anniversary) setAnniversaryConfig(settings.anniversary);
            }
        });
    }, []);

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
    
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Workfeed Settings</h1>
                    <p className="text-muted-foreground">
                        Configure automated posts for birthdays and work anniversaries.
                    </p>
                </div>
                 <Button onClick={handleSave} disabled={isPending || isLoading}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save All Settings'}
                </Button>
            </div>
            
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
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
            )}
        </div>
    );
}
