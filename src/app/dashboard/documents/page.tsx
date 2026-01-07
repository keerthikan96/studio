'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { Document, DocumentCategory, getSharedDocuments } from '@/app/actions/documents';
import { getDocuments } from '@/app/actions/documents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { columns } from '@/components/document/columns';
import { DocumentUploadDialog } from '@/components/document/document-upload-dialog';
import { useToast } from '@/hooks/use-toast';
import { DocumentViewerModal } from '@/components/document-viewer-modal';
import { DocumentShareDialog } from '@/components/document-share-dialog';
import { DocumentVersionHistory } from '@/components/document-version-history';
import { DocumentComments } from '@/components/document-comments';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function UserDocumentsPage() {
  const [myDocuments, setMyDocuments] = useState<Document[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const { toast } = useToast();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredMyDocs, setFilteredMyDocs] = useState<Document[]>([]);
  const [filteredSharedDocs, setFilteredSharedDocs] = useState<Document[]>([]);

  // Modal states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const fetchData = () => {
    if (user) {
      startTransition(async () => {
        try {
          const [myDocs, shared, catsResponse] = await Promise.all([
            getDocuments({ ownerId: user.id }, user.id),
            getSharedDocuments(user.id),
            fetch('/api/document-categories'),
          ]);
          
          if (!catsResponse.ok) throw new Error('Failed to fetch categories');
          const cats = await catsResponse.json();

          setMyDocuments(myDocs);
          setSharedDocuments(shared);
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

  useEffect(() => {
    fetchData();
  }, [user]);

  // Apply filters
  useEffect(() => {
    const filterDocuments = (docs: Document[]) => {
      return docs.filter(doc => {
        const matchesSearch = !searchTerm || 
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = selectedCategory === 'all' || 
          doc.category_id === selectedCategory;
        
        return matchesSearch && matchesCategory;
      });
    };

    setFilteredMyDocs(filterDocuments(myDocuments));
    setFilteredSharedDocs(filterDocuments(sharedDocuments));
  }, [myDocuments, sharedDocuments, searchTerm, selectedCategory]);

  // Document action handlers
  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setViewerOpen(true);
  };

  const handleShare = (doc: Document) => {
    setSelectedDocument(doc);
    setShareOpen(true);
  };

  const handleDelete = async (doc: Document) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

    try {
      const response = await fetch(`/api/documents/${doc.id}?actorId=${user.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({ title: 'Document Deleted', description: 'The document has been removed successfully.' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleVersions = (doc: Document) => {
    setSelectedDocument(doc);
    setVersionsOpen(true);
  };

  const handleComments = (doc: Document) => {
    setSelectedDocument(doc);
    setCommentsOpen(true);
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.file_url, '_blank');
  };

  const tableColumns = columns({
    onView: handleView,
    onShare: handleShare,
    onDelete: handleDelete,
    onVersions: handleVersions,
    onComments: handleComments,
    onDownload: handleDownload,
  });

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Documents</h1>
            <p className="text-muted-foreground">Manage your personal and shared documents</p>
          </div>
          <DocumentUploadDialog categories={categories} onUploadSuccess={fetchData} userId={user?.id} />
        </div>

        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchTerm || selectedCategory !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="my-documents">
          <TabsList>
            <TabsTrigger value="my-documents">
              My Documents ({filteredMyDocs.length})
            </TabsTrigger>
            <TabsTrigger value="shared-with-me">
              Shared with Me ({filteredSharedDocs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-documents">
            <Card>
              <CardHeader>
                <CardTitle>My Documents</CardTitle>
                <CardDescription>Documents you have uploaded</CardDescription>
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                ) : filteredMyDocs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'No documents match your filters' 
                      : 'You haven\'t uploaded any documents yet'}
                  </div>
                ) : (
                  <DataTable columns={tableColumns} data={filteredMyDocs} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shared-with-me">
            <Card>
              <CardHeader>
                <CardTitle>Shared with Me</CardTitle>
                <CardDescription>Documents others have shared with you</CardDescription>
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                ) : filteredSharedDocs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'No documents match your filters' 
                      : 'No documents have been shared with you yet'}
                  </div>
                ) : (
                  <DataTable columns={tableColumns} data={filteredSharedDocs} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {selectedDocument && (
        <>
          <DocumentViewerModal
            open={viewerOpen}
            onOpenChange={setViewerOpen}
            document={selectedDocument}
          />
          <DocumentShareDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            documentId={selectedDocument.id}
            documentTitle={selectedDocument.title}
            onShareSuccess={fetchData}
          />
          <DocumentVersionHistory
            open={versionsOpen}
            onOpenChange={setVersionsOpen}
            documentId={selectedDocument.id}
            documentTitle={selectedDocument.title}
            currentVersion={selectedDocument.version}
            onVersionUpdate={fetchData}
          />
          <DocumentComments
            open={commentsOpen}
            onOpenChange={setCommentsOpen}
            documentId={selectedDocument.id}
            documentTitle={selectedDocument.title}
          />
        </>
      )}
    </>
  );
}
