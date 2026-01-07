
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Document } from "@/app/actions/documents"
import { Badge } from "../ui/badge"
import { MoreHorizontal } from "lucide-react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

export const columns = (): ColumnDef<Document>[] => [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "category_name",
    header: "Category",
    cell: ({ row }) => row.original.category_name || <span className="text-muted-foreground">Uncategorized</span>,
  },
   {
    accessorKey: "uploader_name",
    header: "Uploaded By",
  },
  {
    accessorKey: "created_at",
    header: "Date Added",
    cell: ({ row }) => format(new Date(row.original.created_at), "PPP"),
  },
  {
    accessorKey: "is_company_wide",
    header: "Visibility",
    cell: ({ row }) => (
      <Badge variant={row.original.is_company_wide ? "default" : "secondary"}>
        {row.original.is_company_wide ? "Company" : "Private"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const document = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(document.id)}
            >
              Copy document ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
             <DropdownMenuItem>Share</DropdownMenuItem>
             <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
