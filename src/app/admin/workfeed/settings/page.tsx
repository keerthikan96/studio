
'use client';

import AutomatedPostSetting from "@/components/automated-post-setting";

export default function WorkfeedSettingsPage() {
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Workfeed Settings</h1>
                <p className="text-muted-foreground">
                    Configure automated posts for birthdays and work anniversaries.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AutomatedPostSetting
                    title="Automatic Birthday Posts"
                    description="This post will be automatically generated on a member's birthday using their name and profile picture."
                    toggleId="birthday-toggle"
                    toggleLabel="Enable Birthday Posts"
                    templateId="birthday-template"
                    templateLabel="Birthday Message Template"
                    defaultTemplate="Happy Birthday, {name}! Wishing you a fantastic day and a wonderful year ahead! 🎉🎂"
                    previewName="Jessica Singh"
                    previewAvatarUrl="/placeholder.svg"
                    previewType="birthday"
                />

                <AutomatedPostSetting
                    title="Automatic Anniversary Posts"
                    description="This post will be automatically generated on a member's work anniversary, celebrating their years of service."
                    toggleId="anniversary-toggle"
                    toggleLabel="Enable Anniversary Posts"
                    templateId="anniversary-template"
                    templateLabel="Anniversary Message Template"
                    defaultTemplate="Congratulations, {name}, on your {years}-year work anniversary! Thank you for your dedication and hard work. Here's to many more successful years! 🥂"
                    previewName="John Doe"
                    previewAvatarUrl="/placeholder.svg"
                    previewType="anniversary"
                    previewYears={5}
                />
            </div>
        </div>
    );
}
