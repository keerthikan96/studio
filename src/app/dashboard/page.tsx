
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Calendar, 
  Users, 
  User, 
  FileText,
  Clock,
  Award,
  TrendingUp,
  Briefcase,
  PartyPopper,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import { getMembersAction } from '@/app/actions/staff';
import { getMemberLeaveRequestsAction, getMemberEntitlementsAction } from '@/app/actions/leave';
import { Member } from '@/lib/mock-data';
import { differenceInYears, format, isToday, isFuture, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function EmployeeDashboard() {
  const [isPending, startTransition] = useTransition();
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<number>(0);
  const [upcomingLeaves, setUpcomingLeaves] = useState<any[]>([]);
  const [yearsOfService, setYearsOfService] = useState<number>(0);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startTransition(async () => {
      try {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (!storedUser) {
          setLoading(false);
          return;
        }
        
        const currentUser = JSON.parse(storedUser);
        const currentUserId = currentUser.id;

        // Fetch current member data
        const membersResult = await getMembersAction(currentUserId);
        const members = Array.isArray(membersResult) ? membersResult : [];
        const member = members.find(m => m.id === currentUserId);
        
        if (member) {
          setCurrentMember(member);
          
          // Calculate years of service
          if (member.start_date) {
            const years = differenceInYears(new Date(), new Date(member.start_date));
            setYearsOfService(years);
          }
          
          // Fetch leave entitlements
          const currentYear = new Date().getFullYear();
          const entitlements = await getMemberEntitlementsAction(currentUserId, currentYear);
          if (Array.isArray(entitlements) && entitlements.length > 0) {
            const totalBalance = entitlements.reduce((sum, ent) => sum + (ent.balance || 0), 0);
            setLeaveBalance(totalBalance);
          }
          
          // Fetch upcoming leave requests
          const leaveRequests = await getMemberLeaveRequestsAction(currentUserId, currentUserId);
          if (Array.isArray(leaveRequests)) {
            const upcoming = leaveRequests
              .filter(leave => leave.status === 'Approved' && isFuture(new Date(leave.start_date)))
              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
              .slice(0, 3);
            setUpcomingLeaves(upcoming);
          }
          
          // Get upcoming birthdays from team
          const activeMembers = members.filter(m => m.status === 'active' && m.id !== currentUserId);
          const birthdaysThisMonth = activeMembers
            .filter(m => {
              if (!m.date_of_birth) return false;
              const dob = new Date(m.date_of_birth);
              const today = new Date();
              return dob.getMonth() === today.getMonth();
            })
            .slice(0, 5);
          setUpcomingBirthdays(birthdaysThisMonth);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {currentMember?.first_name || 'User'}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your profile today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Years of Service</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yearsOfService}</div>
            <p className="text-xs text-muted-foreground">
              {currentMember?.start_date && format(new Date(currentMember.start_date), 'MMM dd, yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveBalance} days</div>
            <p className="text-xs text-muted-foreground">
              Available this year
            </p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/dashboard/leave">Request Leave</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Position</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{currentMember?.job_title || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {currentMember?.employee_level || 'Employee'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {currentMember?.domain || 'General'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMember?.branch || 'Main Office'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Leaves */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Leaves
            </CardTitle>
            <CardDescription>Your approved leave requests</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingLeaves.length > 0 ? (
              <div className="space-y-3">
                {upcomingLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{leave.leave_category_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(leave.start_date), 'MMM dd')} - {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      {leave.days} days
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming leaves</p>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link href="/dashboard/leave">Request Leave</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5" />
              Team Birthdays This Month
            </CardTitle>
            <CardDescription>Celebrate with your colleagues</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length > 0 ? (
              <div className="space-y-3">
                {upcomingBirthdays.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profile_picture_url || `https://i.pravatar.cc/40?u=${member.id}`} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.date_of_birth && format(new Date(member.date_of_birth), 'MMMM dd')}
                      </p>
                    </div>
                    <Heart className="h-4 w-4 text-pink-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <PartyPopper className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No birthdays this month</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Profile</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              View and edit your personal information
            </p>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/profile">
                View Profile <ArrowRight className="ml-2 h-4 w-4"/>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee Directory</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Search and connect with colleagues
            </p>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/members">
                View Directory <ArrowRight className="ml-2 h-4 w-4"/>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Access company documents and files
            </p>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/documents">
                View Documents <ArrowRight className="ml-2 h-4 w-4"/>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workfeed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Latest updates and announcements
            </p>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/workfeed">
                View Workfeed <ArrowRight className="ml-2 h-4 w-4"/>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
