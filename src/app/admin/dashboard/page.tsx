'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  UserMinus,
  Briefcase,
  MoreHorizontal,
  Star,
  ChevronDown,
} from "lucide-react";
import { DailyAttendanceChart } from "@/components/daily-attendance-chart";
import { DashboardCalendar } from "@/components/loan-payment-chart";
import { DepartmentHeadcountChart } from "@/components/department-headcount-chart";
import { LeaveRequestsTrendChart } from "@/components/leave-requests-trend-chart";
import { EmployeeListDashboard } from "@/components/employee-list-dashboard";
import { EmployeeAwardList } from "@/components/employee-award-list";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { DashboardEvents, Event } from "@/components/dashboard-events";
import { getMembersAction } from '@/app/actions/staff';
import { getLeaveRequestsAction } from '@/app/actions/leave';
import { Member } from '@/lib/mock-data';
import { differenceInYears, isToday, startOfDay } from 'date-fns';
import DashboardCarousel from '@/components/dashboard-carousel';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const notices = [
  {
    title: "Get ready for meeting at 10.30 am",
    description: "Meeting",
    date: "19/09/2025",
    isStarred: true,
  },
  {
    title: "Management decision",
    description: "Immediate management meeting",
    date: "25/09/2025",
    isStarred: true,
  },
  {
    title: "Our organization will organize a annual report",
    description: "Meeting",
    date: "07/09/2025",
    isStarred: true,
  },
];

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isPending, startTransition] = useTransition();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [todayLeaveCount, setTodayLeaveCount] = useState(0);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [recentEmployees, setRecentEmployees] = useState<Array<{id: string, name: string, avatarUrl: string, reason: string}>>([]);
  const [todayLeaveEmployees, setTodayLeaveEmployees] = useState<Array<{id: string, name: string, avatarUrl: string, reason: string}>>([]);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState<Array<{id: string, name: string, avatarUrl: string, reason: string}>>([]);
  const [previousEmployeeCount, setPreviousEmployeeCount] = useState(0);

  useEffect(() => {
    startTransition(async () => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
        
        // Fetch members
        const membersResult = await getMembersAction(currentUserId);
        const members = Array.isArray(membersResult) ? membersResult : [];
        
        // Generate events
        const events = generateEventsFromMembers(members);
        setAllEvents(events);
        
        // Calculate stats
        const activeMembers = members.filter(m => m.status === 'active');
        setTotalEmployees(activeMembers.length);
        
        // Get recent employees (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentHires = activeMembers
          .filter(m => m.start_date && new Date(m.start_date) >= thirtyDaysAgo)
          .slice(0, 3)
          .map(m => ({
            id: m.id,
            name: m.name,
            avatarUrl: m.profile_picture_url || `https://i.pravatar.cc/40?u=${m.id}`,
            reason: m.job_title || 'New Employee'
          }));
        setRecentEmployees(recentHires);
        
        // Calculate previous month count for percentage
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const previousCount = members.filter(m => 
          m.start_date && new Date(m.start_date) <= thirtyDaysAgo
        ).length;
        setPreviousEmployeeCount(previousCount);
        
        // Fetch today's leave requests
        const leaveResult = await getLeaveRequestsAction(currentUserId);
        if (Array.isArray(leaveResult)) {
          const todayLeaves = leaveResult.filter(leave => {
            const startDate = startOfDay(new Date(leave.start_date));
            const endDate = startOfDay(new Date(leave.end_date));
            const today = startOfDay(new Date());
            return leave.status === 'Approved' && today >= startDate && today <= endDate;
          });
          
          setTodayLeaveCount(todayLeaves.length);
          
          const leaveEmployeeList = todayLeaves.slice(0, 3).map(leave => {
            const member = members.find(m => m.id === leave.member_id);
            return {
              id: leave.member_id,
              name: leave.member_name || 'Unknown',
              avatarUrl: member?.profile_picture_url || `https://i.pravatar.cc/40?u=${leave.member_id}`,
              reason: leave.leave_category_name || 'Leave'
            };
          });
          setTodayLeaveEmployees(leaveEmployeeList);
          
          // Get pending leave requests
          const pendingLeaves = leaveResult.filter((leave: any) => leave.status === 'Pending');
          setPendingLeaveCount(pendingLeaves.length);
          
          const pendingList = pendingLeaves.slice(0, 3).map((leave: any) => {
            const member = members.find(m => m.id === leave.member_id);
            return {
              id: leave.member_id,
              name: leave.member_name || 'Unknown',
              avatarUrl: member?.profile_picture_url || `https://i.pravatar.cc/40?u=${leave.member_id}`,
              reason: leave.leave_category_name || 'Leave Request'
            };
          });
          setPendingLeaveRequests(pendingList);
        }
    });
  }, []);

  const generateEventsFromMembers = (members: Member[]): Event[] => {
    const events: Event[] = [];
    const currentYear = new Date().getFullYear();

    members.forEach(member => {
        // Handle Birthdays
        if (member.date_of_birth) {
            const dob = new Date(member.date_of_birth);
            // Ignore potential invalid dates
            if (!isNaN(dob.getTime())) {
                const birthdayThisYear = new Date(currentYear, dob.getMonth(), dob.getDate());
                events.push({
                    id: `${member.id}-bday`,
                    type: 'birthday',
                    name: member.name,
                    avatar: member.profile_picture_url || `https://i.pravatar.cc/40?u=${member.id}`,
                    date: birthdayThisYear,
                });
            }
        }

        // Handle Anniversaries
        if (member.start_date) {
            const startDate = new Date(member.start_date);
             if (!isNaN(startDate.getTime())) {
                const yearsOfService = differenceInYears(new Date(), startDate);
                if (yearsOfService > 0) {
                    const anniversaryThisYear = new Date(currentYear, startDate.getMonth(), startDate.getDate());
                    // Only add if the anniversary is this year (or in the future, for upcoming)
                    if (anniversaryThisYear.getFullYear() === currentYear) {
                         events.push({
                            id: `${member.id}-anniv-${yearsOfService}`,
                            type: 'anniversary',
                            name: member.name,
                            avatar: member.profile_picture_url || `https://i.pravatar.cc/40?u=${member.id}`,
                            date: anniversaryThisYear,
                            yearsOfService: yearsOfService,
                        });
                    }
                }
            }
        }
    });

    return events;
  };

  // Calculate percentage change
  const employeeChangePercent = previousEmployeeCount > 0 
    ? (((totalEmployees - previousEmployeeCount) / previousEmployeeCount) * 100).toFixed(1)
    : '0.0';
  const employeeChangeType = totalEmployees >= previousEmployeeCount ? 'positive' : 'negative';

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2 }}
          className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-3xl"
        />
      </div>

      {/* Header: Dynamic Information Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardCarousel />
      </motion.div>
      
      {/* Row 1: At-a-Glance Summary - Key Metrics */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <DashboardStatCard
            title="Total employee"
            value={totalEmployees.toString()}
            change={`${employeeChangeType === 'positive' ? '+' : ''}${employeeChangePercent}%`}
            changeType={employeeChangeType}
            icon={<Users className="h-6 w-6 text-blue-600" />}
            iconBgColor="bg-blue-100"
            detailsTitle="Recent Employees"
            detailsData={recentEmployees}
            detailsCta={{ href: '/admin/add-staff', text: 'Add New Employee' }}
        />
        <DashboardStatCard
            title="Today leave"
            value={todayLeaveCount.toString()}
            change={todayLeaveCount > 0 ? `${todayLeaveCount} on leave` : 'No leaves'}
            changeType="positive"
            icon={<UserMinus className="h-6 w-6 text-orange-600" />}
            iconBgColor="bg-orange-100"
            detailsTitle="Employees on Leave Today"
            detailsData={todayLeaveEmployees}
            detailsCta={{ href: '/admin/leave', text: 'Manage Leave Requests' }}
        />
        <DashboardStatCard
            title="Pending requests"
            value={pendingLeaveCount.toString()}
            change={pendingLeaveCount > 0 ? `${pendingLeaveCount} awaiting review` : 'All reviewed'}
            changeType={pendingLeaveCount > 0 ? 'negative' : 'positive'}
            icon={<Briefcase className="h-6 w-6 text-purple-600" />}
            iconBgColor="bg-purple-100"
            detailsTitle="Pending Leave Requests"
            detailsData={pendingLeaveRequests}
            detailsCta={{ href: '/admin/leave', text: 'Review Requests' }}
        />
      </motion.div>

      {/* Row 2: Timely Information - Calendar & Events + Notice Board */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Left: Calendar & Events (Related Time-Sensitive Information) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendar & Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Calendar</h3>
                <DashboardCalendar selectedDate={selectedDate} onDateChange={(date) => date && setSelectedDate(date)} />
              </div>
              
              {/* Events */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Upcoming Events</h3>
                <div className="h-[470px] overflow-auto">
                  <DashboardEvents selectedDate={selectedDate} allEvents={allEvents} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Notice Board (Static Important Information) */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between relative z-10">
            <CardTitle>Notice Board</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="space-y-4 max-h-[320px] overflow-auto">
              {notices.map((notice, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start justify-between gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-all duration-200 border border-border/50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notice.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notice.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">{notice.date}</p>
                    {notice.isStarred && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 inline-block mt-1" />}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" size="sm">Previous</Button>
              <Button size="sm">See more</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Row 3: Performance & Business Intelligence - Key Charts */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {/* Left: Main Performance Chart */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Daily Attendance Statistics</CardTitle>
              <Select defaultValue="department">
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <DailyAttendanceChart />
          </CardContent>
        </Card>

        {/* Right: Business Intelligence Charts */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Department Headcount</CardTitle>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Depts</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <DepartmentHeadcountChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Leave Requests Trend</CardTitle>
                <Select defaultValue="6months">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <LeaveRequestsTrendChart />
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Row 4: Detailed Information - Employee Lists */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {/* Left: Employee List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Employee Directory</CardTitle>
              <Button variant="outline" size="sm">
                New Recruitment <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <EmployeeListDashboard />
          </CardContent>
        </Card>

        {/* Right: Employee Awards */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Employee Awards & Recognition</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <EmployeeAwardList />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}