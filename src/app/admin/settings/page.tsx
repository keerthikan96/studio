
'use client';

import AutomatedPostSetting from "@/components/automated-post-setting";

export default function SettingsPage() {
    
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
                    description="Automatically post a message on a member's birthday."
                    toggleId="birthday-toggle"
                    toggleLabel="Enable Birthday Posts"
                    templateId="birthday-template"
                    templateLabel="Birthday Message Template"
                    defaultTemplate="Happy Birthday, {name}! Wishing you a fantastic day and a wonderful year ahead! 🎉🎂"
                    imageUploadDescription="This image will be attached to all birthday posts. (Recommended size: 1200x800)"
                    imageHint="celebration birthday"
                    placeHolderImageUrl="https://picsum.photos/seed/birthday/1200/800"
                />

                <AutomatedPostSetting
                    title="Automatic Anniversary Posts"
                    description="Celebrate members' work anniversaries with an automated post."
                    toggleId="anniversary-toggle"
                    toggleLabel="Enable Anniversary Posts"
                    templateId="anniversary-template"
                    templateLabel="Anniversary Message Template"
                    defaultTemplate="Congratulations, {name}, on your {years}-year work anniversary! Thank you for your dedication and hard work. Here's to many more successful years! 🥂"
                    imageUploadDescription="This image will be attached to all anniversary posts. (Recommended size: 1200x800)"
                    imageHint="work anniversary"
                    placeHolderImageUrl="https://picsum.photos/seed/anniversary/1200/800"
                />
            </div>
        </div>
    );
}
