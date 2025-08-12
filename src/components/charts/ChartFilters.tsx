// Chart search and filter component

"use client";

import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { debounce } from '../../lib/utils';

interface ChartFiltersProps {
  onFiltersChange: (filters: { search?: string; category?: string }) => void;
  categories: string[];
  isLoading?: boolean;
}

const ChartFilters: React.FC<ChartFiltersProps> = ({
  onFiltersChange,
  categories,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounced search function
  const debouncedSearch = debounce((searchTerm: string) => {
    onFiltersChange({
      search: searchTerm || undefined,
      category: selectedCategory || undefined,
    });
  }, 300);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  // Handle category selection
  const handleCategoryChange = (category: string) => {
    const newCategory = category === selectedCategory ? '' : category;
    setSelectedCategory(newCategory);
    
    onFiltersChange({
      search: search || undefined,
      category: newCategory || undefined,
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    onFiltersChange({});
  };

  const hasActiveFilters = search || selectedCategory;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search charts..."
            value={search}
            onChange={handleSearchChange}
            leftIcon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            rightIcon={
              search && (
                <button
                  onClick={() => {
                    setSearch('');
                    debouncedSearch('');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )
            }
          />
        </div>
        
        {/* Filter Toggle Button */}
        {categories.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            Filters
            {selectedCategory && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                1
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Category Filters */}
      {isExpanded && categories.length > 0 && (
        <div className="space-y-3 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Filter by Category</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Active filters:</span>
          {search && (
            <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded">
              Search: &quot;{search}&quot;
              <button
                onClick={() => {
                  setSearch('');
                  debouncedSearch('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded">
              Category: {selectedCategory}
              <button
                onClick={() => handleCategoryChange(selectedCategory)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">Filtering charts...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export { ChartFilters };