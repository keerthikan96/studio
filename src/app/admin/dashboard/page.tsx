'use client';

import { useState, useEffect, useTransition } from 'react';
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
import { PositionWiseRecruitmentChart } from "@/components/position-wise-recruitment-chart";
import { SalesAnalyticsChart } from "@/components/sales-analytics-chart";
import { EmployeeListDashboard } from "@/components/employee-list-dashboard";
import { EmployeeAwardList } from "@/components/employee-award-list";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { DashboardEvents, Event } from "@/components/dashboard-events";
import { getMembersAction } from '@/app/actions/staff';
import { Member } from '@/lib/mock-data';
import { differenceInYears } from 'date-fns';
import DashboardCarousel from '@/components/dashboard-carousel';

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

const totalEmployeeData = [
    { id: 'e1', name: 'Robert Fox', avatarUrl: 'https://i.pravatar.cc/40?u=e1', reason: 'Developer' },
    { id: 'e2', name: 'Wade Warren', avatarUrl: 'https://i.pravatar.cc/40?u=e2', reason: 'Designer' },
    { id: 'e3', name: 'Albert Flores', avatarUrl: 'https://i.pravatar.cc/40?u=e3', reason: 'Marketing' },
];

const workFromHomeData = [
    { id: 'wfh1', name: 'John Doe', avatarUrl: 'https://i.pravatar.cc/40?u=wfh1', reason: 'Approved for project deadline' },
    { id: 'wfh2', name: 'Jane Smith', avatarUrl: 'https://i.pravatar.cc/40?u=wfh2', reason: 'Approved for personal reasons' },
];

const leaveData = [
    { id: 'l1', name: 'John Doe', avatarUrl: 'https://i.pravatar.cc/40?u=m_1', reason: 'Sick Leave' },
    { id: 'l2', name: 'Jane Smith', avatarUrl: 'https://i.pravatar.cc/40?u=m_2', reason: 'Personal' },
    { id: 'l3', name: 'Peter Jones', avatarUrl: 'https://i.pravatar.cc/40?u=m_3', reason: 'Vacation' },
];

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isPending, startTransition] = useTransition();
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  useEffect(() => {
    startTransition(() => {
        getMembersAction().then(members => {
            const events = generateEventsFromMembers(members);
            setAllEvents(events);
        });
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

  return (
    <div className="flex flex-col gap-8">
      {/* Header: Dynamic Information Banner */}
      <DashboardCarousel />
      
      {/* Row 1: At-a-Glance Summary - Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStatCard
            title="Total employee"
            value="127"
            change="+6.4%"
            changeType="positive"
            icon={<Users className="h-6 w-6 text-blue-600" />}
            iconBgColor="bg-blue-100"
            detailsTitle="All Employees"
            detailsData={totalEmployeeData}
            detailsCta={{ href: '/admin/members', text: 'Go to Member List' }}
        />
        <DashboardStatCard
            title="Today leave"
            value="13"
            change="-1.9%"
            changeType="negative"
            icon={<UserMinus className="h-6 w-6 text-orange-600" />}
            iconBgColor="bg-orange-100"
            detailsTitle="Employees on Leave Today"
            detailsData={leaveData}
            detailsCta={{ href: '/admin/leave', text: 'Go to Leave Management' }}
        />
        <DashboardStatCard
            title="Work from home"
            value="5"
            change="+2.1%"
            changeType="positive"
            icon={<Briefcase className="h-6 w-6 text-purple-600" />}
            iconBgColor="bg-purple-100"
            detailsTitle="Work From Home Today"
            detailsData={workFromHomeData}
            detailsCta={{ href: '/admin/attendance', text: 'Go to Attendance' }}
        />
      </div>

      {/* Row 2: Timely Information - Calendar & Events + Notice Board */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                <DashboardCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notice Board</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 max-h-[320px] overflow-auto">
              {notices.map((notice, index) => (
                <div key={index} className="flex items-start justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notice.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notice.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">{notice.date}</p>
                    {notice.isStarred && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 inline-block mt-1" />}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" size="sm">Previous</Button>
              <Button size="sm">See more</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Performance & Business Intelligence - Key Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                <CardTitle>Position Wise Recruitment</CardTitle>
                <Select defaultValue="yearly">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <PositionWiseRecruitmentChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Sales Analytics</CardTitle>
                <Select defaultValue="department">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <SalesAnalyticsChart />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 4: Detailed Information - Employee Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
      </div>
    </div>
  );
}