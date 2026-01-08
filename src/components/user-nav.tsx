
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
import { CreditCard, LogOut, User, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getMemberByIdAction } from '@/app/actions/staff';

type UserData = {
    id: string;
    name: string;
    email: string;
    role?: string | null;
    profile_picture_url?: string | null;
    cover_photo_url?: string | null;
}

export default function UserNav() {
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  const loadUser = () => {
    const storedUserStr = sessionStorage.getItem('loggedInUser');
    if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        if (storedUser.id === 'admin-user-001') {
             setUser({...storedUser, name: storedUser.name || 'People and Culture office', role: 'HR'});
        } else {
            // Fetch the latest user data to get the profile picture URL and role
            getMemberByIdAction(storedUser.id, storedUser.id).then(result => {
                const member = result && 'error' in result ? null : result;
                if (member) {
                    const fullUserData = { 
                        ...storedUser,
                        role: member.role,
                        profile_picture_url: member.profile_picture_url,
                        cover_photo_url: member.cover_photo_url
                    };
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

    const handleProfileUpdate = () => {
        loadUser();
    };

    const handleCoverUpdate = () => {
        loadUser();
    }

    window.addEventListener('profile-picture-updated', handleProfileUpdate);
    window.addEventListener('cover-photo-updated', handleCoverUpdate);

    return () => {
        window.removeEventListener('profile-picture-updated', handleProfileUpdate);
        window.removeEventListener('cover-photo-updated', handleCoverUpdate);
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
  
  const imageSrc = user.profile_picture_url;
  const hasProfilePicture = imageSrc && imageSrc.trim() !== '';
  
  const profileLink = user.role === 'HR' 
    ? `/dashboard/profile` 
    : '/dashboard/profile';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-3 h-auto p-2 hover:bg-muted/50 transition-all group">
          <div className="relative">
            {hasProfilePicture ? (
              <Avatar className="h-10 w-10 border-2 border-primary/20 group-hover:border-primary/50 transition-all">
                <AvatarImage
                  key={imageSrc} 
                  src={imageSrc}
                  alt="User avatar"
                  data-ai-hint="person portrait"
                />
              </Avatar>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full" />
          </div>
          <div className="hidden md:flex flex-col items-start">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        </Button>
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
          <Link href={profileLink}>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem disabled>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          {user.role === 'HR' && (
            <Link href="/admin/settings">
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
            </Link>
          )}
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
