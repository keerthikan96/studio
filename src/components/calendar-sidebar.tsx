
'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { ChevronDown, Plus } from "lucide-react"
import { Button } from "./ui/button";

type CalendarSidebarProps = {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

const calendarFilters = [
    { id: 'esther', label: 'Esther Howard', color: 'bg-blue-500' },
    { id: 'task', label: 'Task', color: 'bg-red-500' },
    { id: 'bootcamp', label: 'Bootcamp', color: 'bg-yellow-500' },
    { id: 'birthday', label: 'Birthday', color: 'bg-purple-500' },
    { id: 'reminders', label: 'Reminders', color: 'bg-gray-400', defaultChecked: false },
    { id: 'collage', label: 'Collage', color: 'bg-pink-500', defaultChecked: false },
]

const categoryFilters = [
    { id: 'work', label: 'Work', color: 'bg-blue-500' },
    { id: 'education', label: 'Education', color: 'bg-green-500' },
]

export function CalendarSidebar({ selectedDate, onDateChange }: CalendarSidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card text-card-foreground p-4 space-y-6 overflow-y-auto">
      <Calendar 
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateChange(date)}
        className="rounded-md"
        captionLayout="dropdown-buttons"
        fromYear={1990} toYear={new Date().getFullYear() + 5}
      />
      
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-semibold">
          My Calendars
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {calendarFilters.map(filter => (
            <div key={filter.id} className="flex items-center gap-2">
                <Checkbox id={filter.id} defaultChecked={filter.defaultChecked ?? true} className="data-[state=checked]:bg-primary"/>
                <div className={`w-3 h-3 rounded-full ${filter.color}`} />
                <Label htmlFor={filter.id}>{filter.label}</Label>
            </div>
          ))}
           <Button variant="link" size="sm" className="text-primary p-0 h-auto">
            <Plus className="h-4 w-4 mr-1" /> Add other
          </Button>
        </CollapsibleContent>
      </Collapsible>
      
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-semibold">
          Other Calendars
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <p className="text-xs text-muted-foreground">No other calendars yet.</p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-semibold">
          Categories
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
           {categoryFilters.map(filter => (
            <div key={filter.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${filter.color}`} />
                <Label htmlFor={filter.id}>{filter.label}</Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </aside>
  )
}
