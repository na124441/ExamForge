"use client";

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { 
  Users, 
  Building2, 
  Percent, 
  FileText, 
  Calendar, 
  Clock, 
  MonitorPlay, 
  Settings 
} from 'lucide-react';

import { ForgeMasterDetail } from '@/components/forge/ForgeMasterDetail';
import { ForgeSection } from '@/components/forge/ForgeSection';
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from '@/components/forge/ForgeCard';
import { ForgeStatusPill } from '@/components/forge/ForgeStatusPill';
import { ForgeMetric } from '@/components/forge/ForgeMetric';
import { ForgeButton } from '@/components/forge/ForgeButton';
import { cn } from '@/lib/cn';

interface Examination {
  id: string;
  name: string;
  status: 'live' | 'scheduled' | 'completed' | 'draft';
  candidates: number;
  centres: number;
  startDate: string;
  endDate: string;
  completion: number;
  subject: string;
  blueprint: string;
}

const MOCK_EXAMS: Examination[] = [
  { id: 'EXM-001', name: 'JEE Mock Examination 2026', status: 'live', candidates: 12482, centres: 38, startDate: '2026-08-20T09:00:00Z', endDate: '2026-08-20T12:00:00Z', completion: 67, subject: 'Engineering', blueprint: 'JEE-2026-Mock-A' },
  { id: 'EXM-002', name: 'NEET Practice Series — Biology', status: 'scheduled', candidates: 8421, centres: 24, startDate: '2026-08-25T10:00:00Z', endDate: '2026-08-25T13:00:00Z', completion: 0, subject: 'Medical', blueprint: 'NEET-2026-BIO' },
  { id: 'EXM-003', name: 'BTech Midterm Mathematics', status: 'completed', candidates: 1205, centres: 5, startDate: '2026-08-15T09:00:00Z', endDate: '2026-08-15T11:00:00Z', completion: 100, subject: 'Mathematics', blueprint: 'BTech-MID-MATH' },
  { id: 'EXM-004', name: 'Civil Services Prelim Mock', status: 'draft', candidates: 0, centres: 0, startDate: '', endDate: '', completion: 0, subject: 'General Studies', blueprint: 'UPSC-2026-PRE' },
  { id: 'EXM-005', name: 'SSC Combined Graduate Level', status: 'live', candidates: 45210, centres: 120, startDate: '2026-08-20T14:00:00Z', endDate: '2026-08-20T16:00:00Z', completion: 34, subject: 'General', blueprint: 'SSC-CGL-2026' },
  { id: 'EXM-006', name: 'State Board Class XII Final', status: 'scheduled', candidates: 28400, centres: 85, startDate: '2026-09-01T09:00:00Z', endDate: '2026-09-01T15:00:00Z', completion: 0, subject: 'Multiple', blueprint: 'SB-XII-2026' },
];

type FilterType = 'All' | 'Live' | 'Scheduled' | 'Completed' | 'Draft';

export default function ExaminationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--text-muted)]">Loading examinations...</div>}>
      <ExaminationsContent />
    </Suspense>
  );
}

function ExaminationsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const selectedId = searchParams.get('selected');
  
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const handleSelect = useCallback((id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set('selected', id);
    } else {
      params.delete('selected');
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const filteredExams = useMemo(() => {
    return MOCK_EXAMS.filter((exam) => {
      // Name filter
      if (search && !exam.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (activeFilter !== 'All') {
        if (activeFilter.toLowerCase() !== exam.status) {
          return false;
        }
      }
      
      return true;
    });
  }, [search, activeFilter]);

  const renderListItem = useCallback((exam: Examination) => {
    return (
      <div className="flex flex-col gap-1 px-4 py-3 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer w-full">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">{exam.name}</span>
            <span className="text-xs text-[var(--text-muted)] truncate">{exam.subject}</span>
          </div>
          <ForgeStatusPill status={exam.status as any} />
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {new Intl.NumberFormat().format(exam.candidates)} candidates
        </div>
      </div>
    );
  }, []);

  const renderDetail = useCallback((exam: Examination) => {
    const formatDateTime = (isoStr: string) => {
      if (!isoStr) return 'N/A';
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(isoStr));
    };

    return (
      <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{exam.name}</h2>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono text-xs">
                {exam.id}
              </span>
              • {exam.subject}
            </div>
          </div>
          <ForgeStatusPill status={exam.status} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ForgeMetric 
            label="Candidates" 
            value={new Intl.NumberFormat().format(exam.candidates)} 
            icon={<Users className="w-4 h-4" />} 
          />
          <ForgeMetric 
            label="Centres" 
            value={new Intl.NumberFormat().format(exam.centres)} 
            icon={<Building2 className="w-4 h-4" />} 
          />
          <ForgeMetric 
            label="Completion" 
            value={`${exam.completion}%`} 
            icon={<Percent className="w-4 h-4" />} 
          />
          <ForgeMetric 
            label="Blueprint" 
            value={exam.blueprint} 
            icon={<FileText className="w-4 h-4" />} 
            mono={true}
          />
        </div>

        <ForgeCard>
          <ForgeCardHeader>
            <ForgeCardTitle>Schedule Details</ForgeCardTitle>
          </ForgeCardHeader>
          <ForgeCardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
              <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="w-24 text-[var(--text-secondary)]">Start Date:</span>
              <span>{formatDateTime(exam.startDate)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="w-24 text-[var(--text-secondary)]">End Date:</span>
              <span>{formatDateTime(exam.endDate)}</span>
            </div>
          </ForgeCardContent>
        </ForgeCard>

        <div className="mt-auto pt-6 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
          <ForgeButton variant="secondary" icon={<Settings className="w-4 h-4" />}>
            Manage
          </ForgeButton>
          <ForgeButton variant="primary" icon={<MonitorPlay className="w-4 h-4" />}>
            Monitor Exam
          </ForgeButton>
        </div>
      </div>
    );
  }, []);

  const FilterPills = () => {
    const filters: FilterType[] = ['All', 'Live', 'Scheduled', 'Completed', 'Draft'];
    
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-[var(--radius-pill)] whitespace-nowrap transition-colors",
              activeFilter === filter
                ? "bg-[var(--accent-primary)] text-white"
                : "bg-[var(--surface-interactive)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            )}
          >
            {filter}
          </button>
        ))}
      </div>
    );
  };

  return (
    <ForgeSection 
      title="Examinations" 
      subtitle="Manage and monitor all examination sessions"
      className="flex flex-col h-full overflow-hidden"
    >
      <div className="h-[calc(100vh-140px)] w-full flex-1">
        <ForgeMasterDetail
          items={filteredExams}
          selectedId={selectedId}
          onSelect={handleSelect}
          renderListItem={renderListItem}
          renderDetail={renderDetail}
          getItemId={(exam) => exam.id}
          searchPlaceholder="Search examinations..."
          searchValue={search}
          onSearchChange={setSearch}
          filterSlot={<FilterPills />}
          emptyDetailTitle="Select an examination"
          emptyDetailDescription="Choose an examination from the list to view its details and monitoring dashboard."
        />
      </div>
    </ForgeSection>
  );
}
