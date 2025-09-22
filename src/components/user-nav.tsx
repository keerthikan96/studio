
'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreditCard, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getMemberByIdAction } from '@/app/actions/staff';

type UserData = {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'staff';
    profile_picture_url?: string | null;
}

export default function UserNav() {
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  const loadUser = () => {
    const storedUserStr = sessionStorage.getItem('loggedInUser');
    if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        if (storedUser.role === 'admin') {
            setUser({...storedUser, name: 'Johan Alexandra', role: 'HR'}); // As per image
        } else {
            // Fetch the latest user data to get the profile picture URL
            getMemberByIdAction(storedUser.id).then(member => {
                if (member) {
                    const fullUserData = { ...storedUser, profile_picture_url: member.profile_picture_url };
                    setUser(fullUserData);
                    // Update session storage with the latest data
                    sessionStorage.setItem('loggedInUser', JSON.stringify(fullUserData));
                } else {
                    setUser(storedUser); // fallback to stored user if fetch fails
                }
            });
        }
    }
  }

  useEffect(() => {
    loadUser();

    // Listen for custom event to update profile picture
    const handleProfileUpdate = () => {
        console.log("Profile picture updated event received!");
        loadUser();
    };

    window.addEventListener('profile-picture-updated', handleProfileUpdate);

    // Cleanup listener on component unmount
    return () => {
        window.removeEventListener('profile-picture-updated', handleProfileUpdate);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('loggedInUser');
    setUser(null);
    router.push('/');
  };

  if (!user) {
    return null; // Or a loading skeleton
  }
  
  const fallback = user.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  const imageSrc = user.profile_picture_url || `https://i.pravatar.cc/150?u=johan-alexandra`;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 cursor-pointer">
           <Avatar className="h-9 w-9">
            <AvatarImage
              key={imageSrc} // Using key to force re-render on src change
              src={imageSrc ?? undefined}
              alt="User avatar"
              data-ai-hint="person portrait"
            />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
           <div className="hidden md:flex flex-col items-start">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.role}
            </p>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href={user.role === 'HR' ? '/admin/profile' : '/profile'}>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem disabled>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
