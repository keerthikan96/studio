
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

type UserData = {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'staff';
}

export default function UserNav() {
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    // This is a client-side only effect.
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
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
  const imageSrc = user.role === 'admin' 
    ? `https://picsum.photos/seed/${user.email}/100/100` 
    : `/api/staff/${user.id}/profile-picture`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              key={imageSrc}
              src={imageSrc}
              alt="User avatar"
              data-ai-hint="person portrait"
            />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
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
          <Link href={user.role === 'admin' ? '/admin/dashboard' : '/profile'}>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>{user.role === 'admin' ? 'Dashboard' : 'Profile'}</span>
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
