
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type DetailItem = {
    id: string;
    name: string;
    avatarUrl: string;
    reason: string;
}

type DashboardStatCardProps = {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ReactNode;
  iconBgColor: string;
  detailsTitle: string;
  detailsData: DetailItem[];
  detailsCta: {
    href: string;
    text: string;
  };
};

export function DashboardStatCard({
  title,
  value,
  change,
  changeType,
  icon,
  iconBgColor,
  detailsTitle,
  detailsData,
  detailsCta,
}: DashboardStatCardProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-lg", iconBgColor)}>{icon}</div>
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <p
                  className={cn(
                    "text-xs",
                    changeType === "positive"
                      ? "text-green-500"
                      : "text-red-500"
                  )}
                >
                  {change}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{detailsTitle}</DialogTitle>
          <DialogDescription>
            Here is a quick overview. Click the button below to see all details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {detailsData.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={item.avatarUrl} alt={item.name} />
                <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button asChild>
            <Link href={detailsCta.href}>{detailsCta.text}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
