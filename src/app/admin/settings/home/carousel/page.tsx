
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CarouselSettings } from "@/components/carousel-settings";


export default function CarouselManagementPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Carousel Management</CardTitle>
                    <CardDescription>
                        Configure dashboard carousel slides for individual employees. Select a user to view and manage their carousel items.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CarouselSettings />
                </CardContent>
            </Card>
        </div>
    );
}
