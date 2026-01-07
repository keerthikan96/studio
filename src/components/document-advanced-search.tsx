'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DocumentCategory } from '@/app/actions/documents';

type AdvancedSearchFilters = {
    searchTerm?: string;
    categoryId?: string;
    fileType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    minSize?: number;
    maxSize?: number;
};

type DocumentAdvancedSearchProps = {
    categories: DocumentCategory[];
    onSearch: (filters: AdvancedSearchFilters) => void;
    onClear: () => void;
};

export function DocumentAdvancedSearch({ categories, onSearch, onClear }: DocumentAdvancedSearchProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [filters, setFilters] = useState<AdvancedSearchFilters>({});
    const [isPending, startTransition] = useTransition();

    const fileTypes = [
        { value: 'application/pdf', label: 'PDF' },
        { value: 'image/jpeg', label: 'JPEG Image' },
        { value: 'image/png', label: 'PNG Image' },
        { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word Document' },
        { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel Spreadsheet' },
        { value: 'text/csv', label: 'CSV' },
    ];

    const handleSearch = () => {
        startTransition(() => {
            onSearch(filters);
        });
    };

    const handleClear = () => {
        setFilters({});
        onClear();
    };

    const updateFilter = (key: keyof AdvancedSearchFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

    return (
        <Card>
            <CardContent className="pt-6 space-y-4">
                {/* Basic Search */}
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title or description..."
                            value={filters.searchTerm || ''}
                            onChange={(e) => updateFilter('searchTerm', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-9"
                        />
                    </div>
                    <Button 
                        variant="outline"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                    <Button onClick={handleSearch} disabled={isPending}>
                        Search
                    </Button>
                    {activeFilterCount > 0 && (
                        <Button variant="ghost" onClick={handleClear}>
                            <X className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Advanced Filters */}
                {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                        {/* Category Filter */}
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select 
                                value={filters.categoryId || 'all'} 
                                onValueChange={(value) => updateFilter('categoryId', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger>
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
                        </div>

                        {/* File Type Filter */}
                        <div className="space-y-2">
                            <Label>File Type</Label>
                            <Select 
                                value={filters.fileType || 'all'} 
                                onValueChange={(value) => updateFilter('fileType', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {fileTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date From */}
                        <div className="space-y-2">
                            <Label>Date From</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !filters.dateFrom && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={filters.dateFrom}
                                        onSelect={(date) => updateFilter('dateFrom', date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Date To */}
                        <div className="space-y-2">
                            <Label>Date To</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !filters.dateTo && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={filters.dateTo}
                                        onSelect={(date) => updateFilter('dateTo', date)}
                                        disabled={(date) => filters.dateFrom ? date < filters.dateFrom : false}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Min Size */}
                        <div className="space-y-2">
                            <Label>Min Size (MB)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.1"
                                placeholder="0"
                                value={filters.minSize ? filters.minSize / (1024 * 1024) : ''}
                                onChange={(e) => updateFilter('minSize', e.target.value ? parseFloat(e.target.value) * 1024 * 1024 : undefined)}
                            />
                        </div>

                        {/* Max Size */}
                        <div className="space-y-2">
                            <Label>Max Size (MB)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.1"
                                placeholder="15"
                                value={filters.maxSize ? filters.maxSize / (1024 * 1024) : ''}
                                onChange={(e) => updateFilter('maxSize', e.target.value ? parseFloat(e.target.value) * 1024 * 1024 : undefined)}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
