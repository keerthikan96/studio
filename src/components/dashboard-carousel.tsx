
'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

type Slide = {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    actionEnabled: boolean;
    action: string;
};

// Mock data similar to what's in carousel-settings
const mockSlides: { [key: string]: Slide[] } = {
    user1: [
        { id: 'slide1', title: 'Project Alpha Deadline', description: 'The deadline for Project Alpha is approaching. Please submit your work on time.', imageUrl: 'https://picsum.photos/seed/alpha/800/400', actionEnabled: true, action: 'view_tasks' },
        { id: 'slide2', title: 'Company Town Hall', description: 'Join us for the quarterly town hall next Friday at 10 AM.', imageUrl: 'https://picsum.photos/seed/townhall/800/400', actionEnabled: true, action: 'view_calendar' },
        { id: 'slide4', title: 'Welcome to the Team!', description: 'A warm welcome to our newest team members. We are excited to have you!', imageUrl: 'https://picsum.photos/seed/welcome/800/400', actionEnabled: false, action: 'none' },
    ],
    user2: [
        { id: 'slide3', title: 'New Design System', description: 'Explore the new design system documentation.', imageUrl: 'https://picsum.photos/seed/design/800/400', actionEnabled: true, action: 'view_docs' },
    ],
    user3: [],
    'admin-user-001': [
        { id: 'slide-admin-1', title: 'Manage Company Policies', description: 'Review and update company policies for the upcoming quarter.', imageUrl: 'https://picsum.photos/seed/policies/800/400', actionEnabled: true, action: 'view_docs' },
        { id: 'slide-admin-2', title: 'Q3 Performance Reviews', description: 'Performance review cycle starts next week. Prepare your teams.', imageUrl: 'https://picsum.photos/seed/reviews/800/400', actionEnabled: true, action: 'view_calendar' },
    ]
};

export default function DashboardCarousel() {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        // In a real app, you would fetch this data from your backend
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            // Using mock data for now
            const userSlides = mockSlides[user.id] || [];
            setSlides(userSlides);
            // You'd also fetch if the carousel is active for this user
            setIsActive(userSlides.length > 0);
        }
    }, []);

    if (!isActive || slides.length === 0) {
        return null;
    }

    return (
        <Carousel
            opts={{
                loop: true,
            }}
            className="w-full"
        >
            <CarouselContent>
                {slides.map((slide) => (
                    <CarouselItem key={slide.id}>
                        <Card className="overflow-hidden">
                        <CardContent className="relative h-64 p-0">
                                <Image
                                    src={slide.imageUrl}
                                    alt={slide.title}
                                    fill
                                    className="object-cover"
                                    data-ai-hint="office background"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 flex flex-col justify-end">
                                    <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
                                    <p className="text-white/90 mt-1">{slide.description}</p>
                                    {slide.actionEnabled && (
                                        <Button size="sm" className="mt-4 w-fit">
                                            Go to Action <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-4" />
            <CarouselNext className="absolute right-4" />
        </Carousel>
    );
}
