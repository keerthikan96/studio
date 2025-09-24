
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

const leaveData = [
    { id: 'l1', name: 'John Doe', avatarUrl: 'https://i.pravatar.cc/40?u=m_1', reason: 'Sick Leave' },
    { id: 'l2', name: 'Jane Smith', avatarUrl: 'https://i.pravatar.cc/40?u=m_2', reason: 'Personal' },
    { id: 'l3', name: 'Peter Jones', avatarUrl: 'https://i.pravatar.cc/40?u=m_3', reason: 'Vacation' },
];

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total employee</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-green-500">+6.4%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today presents
            </CardTitle>
             <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
               <div className="p-3 rounded-lg bg-purple-100">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">119</div>
                <p className="text-xs text-green-500">+8.9%</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today absents</CardTitle>
             <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-4">
               <div className="p-3 rounded-lg bg-cyan-100">
                <UserX className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-green-500">+7.3%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
            <Card>
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
         </div>
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

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card>
            <CardHeader>
                <CardTitle>Loan payment received</CardTitle>
            </CardHeader>
            <CardContent>
                <LoanPaymentChart />
            </CardContent>
        </Card>
        <div className="lg:col-span-2 grid grid-cols-1 gap-6">
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
