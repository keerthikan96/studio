
'use client';

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";
import { CarouselSlideCard, Slide } from "./carousel-slide-card";
import { Separator } from "./ui/separator";

// Mock data, in a real app this would come from an API
const mockUsers = [
    { id: 'user1', name: 'John Doe' },
    { id: 'user2', name: 'Jane Smith' },
    { id: 'user3', name: 'Peter Jones' },
];

const mockSlides: { [key: string]: Slide[] } = {
    user1: [
        { id: 'slide1', title: 'Project Alpha Deadline', description: 'The deadline for Project Alpha is approaching. Please submit your work on time.', imageUrl: 'https://picsum.photos/seed/alpha/600/400', actionEnabled: true, action: 'view_tasks' },
        { id: 'slide2', title: 'Company Town Hall', description: 'Join us for the quarterly town hall next Friday at 10 AM.', imageUrl: 'https://picsum.photos/seed/townhall/600/400', actionEnabled: true, action: 'view_calendar' },
    ],
    user2: [
        { id: 'slide3', title: 'New Design System', description: 'Explore the new design system documentation.', imageUrl: 'https://picsum.photos/seed/design/600/400', actionEnabled: true, action: 'view_docs' },
    ],
    user3: [],
};


export function CarouselSettings() {
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [isCarouselActive, setIsCarouselActive] = useState(true);

    const handleUserChange = (userId: string) => {
        setSelectedUser(userId);
        setSlides(mockSlides[userId] || []);
        // In a real app, you'd also fetch the user's carousel activation status
        setIsCarouselActive(true); 
    };

    const handleSlideUpdate = (updatedSlide: Slide) => {
        setSlides(slides.map(slide => slide.id === updatedSlide.id ? updatedSlide : slide));
    };
    
    const handleSlideDelete = (slideId: string) => {
        setSlides(slides.filter(slide => slide.id !== slideId));
    };
    
    const handleAddSlide = () => {
        const newSlide: Slide = {
            id: `slide${Date.now()}`,
            title: 'New Slide',
            description: 'Enter a description.',
            imageUrl: 'https://picsum.photos/seed/new/600/400',
            actionEnabled: false,
            action: 'none',
        };
        setSlides([...slides, newSlide]);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="select-user">Select User</Label>
                    <Select onValueChange={handleUserChange}>
                        <SelectTrigger id="select-user" className="w-[280px]">
                            <SelectValue placeholder="Select an employee..." />
                        </SelectTrigger>
                        <SelectContent>
                            {mockUsers.map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 {selectedUser && (
                    <div className="flex items-center space-x-2 pt-6">
                        <Switch id="carousel-activation" checked={isCarouselActive} onCheckedChange={setIsCarouselActive} />
                        <Label htmlFor="carousel-activation">Activate Carousel for this User</Label>
                    </div>
                 )}
            </div>
            
            {selectedUser && (
                 <>
                    <Separator />
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-medium">Carousel Slides</h3>
                        <Button onClick={handleAddSlide}><PlusCircle className="mr-2 h-4 w-4" /> Add New Slide</Button>
                    </div>
                    {slides.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {slides.map(slide => (
                                <CarouselSlideCard 
                                    key={slide.id} 
                                    slide={slide} 
                                    onUpdate={handleSlideUpdate}
                                    onDelete={handleSlideDelete}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No slides found for this user.</p>
                            <Button variant="link" onClick={handleAddSlide} className="mt-2">Add the first slide</Button>
                        </div>
                    )}
                 </>
            )}

        </div>
    );
}

