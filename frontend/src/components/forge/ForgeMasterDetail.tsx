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
    <div className={cn("flex w-full h-full overflow-hidden font-sans", className)}>
      {/* 1. MASTER LIST PANEL */}
      {showList && (
        <div 
          className={cn(
            "flex flex-col h-full bg-[var(--color-surface-raised)] border-r border-[var(--color-border)] shrink-0",
            isMobile ? "w-full" : ""
          )}
          style={{ width: !isMobile ? listWidth : undefined }}
        >
          {(onSearchChange !== undefined || filterSlot) && (
            <div className="p-3.5 border-b border-[var(--color-border)] flex flex-col gap-2.5 bg-[var(--color-surface-sunken)]">
              {onSearchChange !== undefined && (
                <div className="relative flex items-center w-full">
                  <Search className="absolute left-3 w-4 h-4 text-[var(--color-ink-muted)]" />
                  <input
                    type="text"
                    value={searchValue || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] pl-9 pr-3 py-2 outline-none focus:border-[var(--color-border-focus)] transition-colors font-sans"
                  />
                </div>
              )}
              {filterSlot && (
                <div className="flex flex-wrap gap-1.5">
                  {filterSlot}
                </div>
              )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border-subtle)]">
            {items.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] font-sans">
                {emptyListMessage}
              </div>
            ) : (
              items.map((item) => {
                const id = getItemId(item);
                const isSelected = selectedId === id;
                return (
                  <div
                    key={id}
                    onClick={() => onSelect(id)}
                    className={cn(
                      "w-full cursor-pointer transition-colors duration-[var(--duration-fast)]",
                      isSelected 
                        ? "bg-[var(--color-accent-surface)] border-l-3 border-[var(--color-accent)]" 
                        : "border-l-3 border-transparent hover:bg-[var(--color-surface-sunken)]"
                    )}
                  >
                    {renderListItem(item, isSelected)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. DETAIL PANEL */}
      {showDetail && (
        <div className="flex flex-col flex-1 h-full bg-[var(--color-surface)] overflow-y-auto">
          {isMobile && (
            <div className="sticky top-0 z-20 flex items-center p-3 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-xs">
              <button
                onClick={() => onSelect('')}
                className="flex items-center text-xs font-bold text-[var(--color-accent)] hover:text-[var(--color-ink)] transition-colors py-1 px-2 rounded-lg hover:bg-[var(--color-surface-sunken)] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" />
                Back to List
              </button>
            </div>
          )}
          
          <div className="flex-1 relative">
            {!selectedItem ? (
              <div className="flex items-center justify-center h-full p-8 text-center">
                <ForgeEmptyState
                  title={emptyDetailTitle}
                  description={emptyDetailDescription}
                />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedId}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
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
