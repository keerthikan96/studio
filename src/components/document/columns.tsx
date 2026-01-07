
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Document } from "@/app/actions/documents"
import { Badge } from "../ui/badge"
import { MoreHorizontal, Eye, Share2, Trash2, History, MessageSquare, Download } from "lucide-react"
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

type DocumentActionsProps = {
  onView?: (doc: Document) => void;
  onShare?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
  onVersions?: (doc: Document) => void;
  onComments?: (doc: Document) => void;
  onDownload?: (doc: Document) => void;
};

export const columns = (actions?: DocumentActionsProps): ColumnDef<Document>[] => [
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
            <DropdownMenuItem onClick={() => actions?.onView?.(document)}>
              <Eye className="h-4 w-4 mr-2" />
              View Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions?.onDownload?.(document)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions?.onShare?.(document)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions?.onVersions?.(document)}>
              <History className="h-4 w-4 mr-2" />
              Version History
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions?.onComments?.(document)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => actions?.onDelete?.(document)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
