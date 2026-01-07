
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Document, DocumentCategory } from '@/app/actions/documents';
import { getDocuments } from '@/app/actions/documents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { columns } from '@/components/document/columns';
import { DocumentUploadDialog } from '@/components/document/document-upload-dialog';
import { useToast } from '@/hooks/use-toast';
import { CategoryDialog } from '@/components/document/category-dialog';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [companyDocuments, setCompanyDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const { toast } = useToast();

  const fetchData = () => {
    if (user) {
      startTransition(async () => {
        try {
          const [docs, compDocs, catsResponse] = await Promise.all([
            getDocuments({}, user.id),
            getDocuments({ isCompanyWide: true }, user.id),
            fetch('/api/document-categories'),
          ]);
          
          if (!catsResponse.ok) throw new Error('Failed to fetch categories');
          const cats = await catsResponse.json();

          setDocuments(docs);
          setCompanyDocuments(compDocs);
          setCategories(cats);
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to fetch document data.', variant: 'destructive' });
        }
      });
    }
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(fetchData, [user]);
  
  const handleCategorySubmit = async (values: { name: string }, id?: string) => {
    if (!user) return false;

    const url = id ? `/api/document-categories?id=${id}` : '/api/document-categories';
    const method = id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, actorId: user.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({ title: `Category ${id ? 'Updated' : 'Created'}`, description: `The category "${values.name}" has been saved.` });
      fetchData();
      return true;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!user) return;
     try {
      const response = await fetch(`/api/document-categories?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: user.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({ title: 'Category Deleted', description: 'The category has been removed.' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const tableColumns = columns();

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="company">Company-wide</TabsTrigger>
          <TabsTrigger value="categories">Manage Categories</TabsTrigger>
        </TabsList>
        <DocumentUploadDialog categories={categories} onUploadSuccess={fetchData} userId={user?.id} />
      </div>

      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>All Documents</CardTitle>
            <CardDescription>A list of all documents in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : <DataTable columns={tableColumns} data={documents} />}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="company">
        <Card>
          <CardHeader>
            <CardTitle>Company-wide Documents</CardTitle>
            <CardDescription>Documents accessible to everyone in the company.</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : <DataTable columns={tableColumns} data={companyDocuments} />}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="categories">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Document Categories</CardTitle>
                    <CardDescription>Organize your documents by creating categories.</CardDescription>
                </div>
                <CategoryDialog onSubmit={handleCategorySubmit} />
            </CardHeader>
            <CardContent>
               {isPending ? (
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
               ) : (
                <div className="max-w-2xl">
                    <ul className="space-y-2">
                        {categories.map(cat => (
                            <li key={cat.id} className="flex items-center justify-between p-2 border rounded-md">
                                <span className="font-medium">{cat.name}</span>
                                <div className="space-x-2">
                                    <CategoryDialog category={cat} onSubmit={handleCategorySubmit} />
                                    <Button variant="destructive" size="sm" onClick={() => handleCategoryDelete(cat.id)}>Delete</Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
               )}
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
