
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  UserCheck,
  UserX,
  UserMinus,
  MoreHorizontal,
  Star,
  ChevronDown,
} from "lucide-react";
import { DailyAttendanceChart } from "@/components/daily-attendance-chart";
import { LoanPaymentChart } from "@/components/loan-payment-chart";
import { PositionWiseRecruitmentChart } from "@/components/position-wise-recruitment-chart";
import { SalesAnalyticsChart } from "@/components/sales-analytics-chart";
import { EmployeeListDashboard } from "@/components/employee-list-dashboard";
import { EmployeeAwardList } from "@/components/employee-award-list";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { DashboardEvents } from "@/components/dashboard-events";


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

const presentEmployeeData = [
    { id: 'p1', name: 'John Doe', avatarUrl: 'https://i.pravatar.cc/40?u=p1', reason: 'Checked in at 9:01 AM' },
    { id: 'p2', name: 'Jane Smith', avatarUrl: 'https://i.pravatar.cc/40?u=p2', reason: 'Checked in at 8:58 AM' },
];

const absentEmployeeData = [
    { id: 'a1', name: 'Peter Jones', avatarUrl: 'https://i.pravatar.cc/40?u=a1', reason: 'No show' },
    { id: 'a2', name: 'Emily Carter', avatarUrl: 'https://i.pravatar.cc/40?u=a2', reason: 'No show' },
];

const leaveData = [
    { id: 'l1', name: 'John Doe', avatarUrl: 'https://i.pravatar.cc/40?u=m_1', reason: 'Sick Leave' },
    { id: 'l2', name: 'Jane Smith', avatarUrl: 'https://i.pravatar.cc/40?u=m_2', reason: 'Personal' },
    { id: 'l3', name: 'Peter Jones', avatarUrl: 'https://i.pravatar.cc/40?u=m_3', reason: 'Vacation' },
];

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            title="Today presents"
            value="119"
            change="+8.9%"
            changeType="positive"
            icon={<UserCheck className="h-6 w-6 text-purple-600" />}
            iconBgColor="bg-purple-100"
            detailsTitle="Present Employees"
            detailsData={presentEmployeeData}
            detailsCta={{ href: '/admin/attendance', text: 'Go to Attendance' }}
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
            title="Today absents"
            value="8"
            change="+7.3%"
            changeType="positive"
            icon={<UserX className="h-6 w-6 text-cyan-600" />}
            iconBgColor="bg-cyan-100"
            detailsTitle="Absent Employees"
            detailsData={absentEmployeeData}
            detailsCta={{ href: '/admin/attendance', text: 'Go to Attendance' }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="grid gap-6 lg:col-span-2 md:grid-cols-2">
            <DashboardEvents />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Notice</CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                {notices.map((notice, index) => (
                    <div key={index} className="flex items-start justify-between gap-4">
                    <div>
                        <p className="font-medium text-sm">{notice.title}</p>
                        <p className="text-xs text-muted-foreground">{notice.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">{notice.date}</p>
                        {notice.isStarred && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 inline-block" />}
                    </div>
                    </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                    <Button variant="outline">Previous</Button>
                    <Button>See more</Button>
                </div>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Loan payment received</CardTitle>
            </CardHeader>
            <CardContent>
                <LoanPaymentChart />
            </CardContent>
        </Card>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Daily attendance statistic</CardTitle>
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
        <div className="grid grid-cols-1 gap-6">
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Position wise recruitment</CardTitle>
                         <Select defaultValue="yearly">
                            <SelectTrigger className="w-[180px]">
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
                        <CardTitle>Sales analytics</CardTitle>
                         <Select defaultValue="department">
                            <SelectTrigger className="w-[180px]">
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

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                 <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Employee list</CardTitle>
                         <Button variant="outline">
                            New recruitment <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <EmployeeListDashboard />
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Employee award list</CardTitle>
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
