"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { ForgeEmptyState } from '@/components/forge/ForgeEmptyState';
import { Search, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ForgeMasterDetailProps<T> {
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  renderListItem: (item: T, isSelected: boolean) => React.ReactNode;
  renderDetail: (item: T) => React.ReactNode;
  getItemId: (item: T) => string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterSlot?: React.ReactNode;
  emptyListMessage?: string;
  emptyDetailTitle?: string;
  emptyDetailDescription?: string;
  className?: string;
  listWidth?: string;
}

export function ForgeMasterDetail<T>({
  items,
  selectedId,
  onSelect,
  renderListItem,
  renderDetail,
  getItemId,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filterSlot,
  emptyListMessage = 'No items found',
  emptyDetailTitle = 'No selection',
  emptyDetailDescription = 'Select an item from the list to view details.',
  className,
  listWidth = '380px'
}: ForgeMasterDetailProps<T>) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const selectedItem = selectedId ? items.find((item) => getItemId(item) === selectedId) : null;

  const showList = !isMobile || (isMobile && !selectedItem);
  const showDetail = !isMobile || (isMobile && !!selectedItem);

  return (
    <div className={cn("flex w-full h-full overflow-hidden", className)}>
      {showList && (
        <div 
          className={cn(
            "flex flex-col h-full bg-[var(--surface-panel)] border-r border-[var(--border-subtle)] shrink-0",
            isMobile ? "w-full" : ""
          )}
          style={{ width: !isMobile ? listWidth : undefined }}
        >
          {(onSearchChange !== undefined || filterSlot) && (
            <div className="p-4 border-b border-[var(--border-subtle)] flex flex-col gap-3">
              {onSearchChange !== undefined && (
                <div className="relative flex items-center w-full">
                  <Search className="absolute left-3 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchValue || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-[var(--surface-interactive)] rounded-[var(--radius-control)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  />
                </div>
              )}
              {filterSlot && (
                <div className="flex flex-wrap gap-2">
                  {filterSlot}
                </div>
              )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--text-muted)]">
                {emptyListMessage}
              </div>
            ) : (
              <div className="flex flex-col">
                {items.map((item) => {
                  const id = getItemId(item);
                  const isSelected = selectedId === id;
                  return (
                    <div
                      key={id}
                      onClick={() => onSelect(id)}
                      className={cn(
                        "w-full cursor-pointer transition-colors",
                        isSelected 
                          ? "bg-[var(--accent-primary-surface)] border-l-2 border-[var(--accent-primary)]" 
                          : "border-l-2 border-transparent hover:bg-[var(--surface-interactive)]"
                      )}
                    >
                      {renderListItem(item, isSelected)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {showDetail && (
        <div className="flex flex-col flex-1 h-full bg-[var(--surface-workspace)] overflow-y-auto">
          {isMobile && (
            <div className="sticky top-0 z-10 flex items-center p-3 border-b border-[var(--border-subtle)] bg-[var(--surface-workspace)]">
              <button
                onClick={() => onSelect('')}
                className="flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back
              </button>
            </div>
          )}
          
          <div className="flex-1 relative">
            {!selectedItem ? (
              <div className="flex items-center justify-center h-full">
                <ForgeEmptyState
                  title={emptyDetailTitle}
                  description={emptyDetailDescription}
                />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedId}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="h-full w-full"
                >
                  {renderDetail(selectedItem)}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
