
'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import { MoreHorizontal, TrendingUp, TrendingDown } from "lucide-react";
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
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = parseInt(value);

  // Animated count-up effect
  useEffect(() => {
    if (isNaN(numericValue)) return;
    
    let startTime: number;
    const duration = 1000; // 1 second animation
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setDisplayValue(Math.floor(progress * numericValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [numericValue]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ y: -4 }}
        >
          <Card className="cursor-pointer hover:border-primary/50 transition-all group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <motion.div 
                  className={cn("p-3 rounded-xl", iconBgColor)}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {icon}
                </motion.div>
                <div className="flex-1">
                  <motion.div 
                    className="text-3xl font-bold tracking-tight"
                    key={displayValue}
                  >
                    {isNaN(numericValue) ? value : displayValue}
                  </motion.div>
                  <div className="flex items-center gap-1 mt-1">
                    {changeType === "positive" ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <p
                      className={cn(
                        "text-xs font-medium",
                        changeType === "positive"
                          ? "text-emerald-500"
                          : "text-red-500"
                      )}
                    >
                      {change}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{detailsTitle}</DialogTitle>
          <DialogDescription>
            Here is a quick overview. Click the button below to see all details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
          {detailsData.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10 border-2 border-primary/10">
                <AvatarImage src={item.avatarUrl} alt={item.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                  {item.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-sm text-muted-foreground truncate">{item.reason}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <DialogFooter>
          <Button asChild className="w-full sm:w-auto" variant="gradient">
            <Link href={detailsCta.href}>{detailsCta.text}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
