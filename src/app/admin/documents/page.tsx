
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { getDocuments, getDocumentCategories } from '@/app/actions/documents';
import { Document, DocumentCategory } from '@/app/actions/documents';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  
  useEffect(() => {
    // In a real app, actorId would come from the current user session
    const actorId = 'admin-user-001'; 
    getDocuments({}, actorId).then(setDocuments);
    getDocumentCategories().then(setCategories);
  }, []);

  return (
    <div className="space-y-6">
       <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Document Management</CardTitle>
                    <CardDescription>
                        Manage all company and personal documents.
                    </CardDescription>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Upload Document
                </Button>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    The document list and category management interface will be displayed here.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
