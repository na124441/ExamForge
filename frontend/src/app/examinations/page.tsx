"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { 
  Users, 
  Building2, 
  Percent, 
  FileText, 
  Calendar, 
  Clock, 
  MonitorPlay, 
  Settings,
  RefreshCw,
  Database,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';

import { ForgeMasterDetail } from '@/components/forge/ForgeMasterDetail';
import { ForgeSection } from '@/components/forge/ForgeSection';
import { ForgeCard, ForgeCardHeader, ForgeCardTitle, ForgeCardContent } from '@/components/forge/ForgeCard';
import { ForgeStatusPill } from '@/components/forge/ForgeStatusPill';
import { ForgeMetric } from '@/components/forge/ForgeMetric';
import { ForgePageHeader } from '@/components/forge/ForgePageHeader';
import { ForgeButton } from '@/components/forge/ForgeButton';
import { cn } from '@/lib/cn';

interface Examination {
  id: string;
  name: string;
  code?: string;
  status: 'live' | 'scheduled' | 'completed' | 'draft' | 'upcoming';
  candidates: number;
  centres: number;
  startDate: string;
  endDate: string;
  completion: number;
  subject: string;
  blueprint: string;
  fee_general?: number;
  fee_reserved?: number;
}

type FilterType = 'All' | 'Live' | 'Scheduled' | 'Completed' | 'Draft';

export default function ExaminationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--color-ink-muted)]">Loading examinations...</div>}>
      <ExaminationsContent />
    </Suspense>
  );
}

function ExaminationsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const selectedId = searchParams.get('selected');
  
  const [exams, setExams] = useState<Examination[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/exams`);
      if (!res.ok) {
        throw new Error(`Failed to fetch examinations: ${res.statusText}`);
      }
      const data = await res.json();
      setExams(data);
    } catch (err: any) {
      console.error("[Database Connectivity Error] /api/exams:", err);
      setError(err.message || "Failed to connect to database");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

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
    return exams.filter((exam) => {
      if (search && !exam.name.toLowerCase().includes(search.toLowerCase()) && !exam.subject?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      if (activeFilter !== 'All') {
        if (activeFilter.toLowerCase() !== exam.status.toLowerCase()) {
          return false;
        }
      }
      
      return true;
    });
  }, [exams, search, activeFilter]);

  const renderListItem = useCallback((exam: Examination) => {
    return (
      <div className="flex flex-col gap-1 px-4 py-3 border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-surface-sunken)] transition-colors cursor-pointer w-full">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col truncate">
            <span className="text-sm font-semibold text-[var(--color-ink)] truncate">{exam.name}</span>
            <span className="text-xs text-[var(--color-ink-muted)] truncate">{exam.subject}</span>
          </div>
          <ForgeStatusPill status={exam.status as any} />
        </div>
        <div className="text-xs text-[var(--color-ink-secondary)] mt-1 flex items-center gap-1 font-mono">
          <Users className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          {new Intl.NumberFormat().format(exam.candidates)} candidates
        </div>
      </div>
    );
  }, []);

  const renderDetail = useCallback((exam: Examination) => {
    const formatDateTime = (isoStr: string) => {
      if (!isoStr) return 'N/A';
      try {
        return new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(new Date(isoStr));
      } catch {
        return isoStr;
      }
    };

    return (
      <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto font-sans">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-bold text-[var(--color-ink)]">{exam.name}</h2>
            <div className="flex items-center gap-2 text-xs text-[var(--color-ink-secondary)]">
              <span className="px-2 py-0.5 rounded bg-[var(--color-surface-sunken)] border border-[var(--color-border)] font-mono text-xs font-bold text-[var(--color-ink)]">
                {exam.id}
              </span>
              <span>&bull;</span>
              <span className="font-semibold">{exam.subject}</span>
            </div>
          </div>
          <ForgeStatusPill status={exam.status as any} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ForgeMetric 
            label="Total Registrations" 
            value={new Intl.NumberFormat().format(exam.candidates)} 
            icon={<Users className="w-4 h-4 text-[var(--color-accent)]" />} 
          />
          <ForgeMetric 
            label="Active Centres" 
            value={new Intl.NumberFormat().format(exam.centres)} 
            icon={<Building2 className="w-4 h-4 text-[var(--color-accent)]" />} 
          />
          <ForgeMetric 
            label="Completion" 
            value={`${exam.completion}%`} 
            icon={<Percent className="w-4 h-4 text-[var(--color-success)]" />} 
          />
          <ForgeMetric 
            label="Security Blueprint" 
            value={exam.blueprint} 
            icon={<FileText className="w-4 h-4 text-[var(--color-accent)]" />} 
            mono={true}
          />
        </div>

        <ForgeCard>
          <ForgeCardHeader>
            <ForgeCardTitle>Schedule &amp; Fee Structure</ForgeCardTitle>
          </ForgeCardHeader>
          <ForgeCardContent className="flex flex-col gap-4 text-xs font-mono">
            <div className="flex items-center gap-3 text-[var(--color-ink)]">
              <Calendar className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
              <span className="w-28 text-[var(--color-ink-secondary)]">Start Date:</span>
              <span className="font-bold">{formatDateTime(exam.startDate)}</span>
            </div>
            <div className="flex items-center gap-3 text-[var(--color-ink)]">
              <Clock className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
              <span className="w-28 text-[var(--color-ink-secondary)]">End Date:</span>
              <span className="font-bold">{formatDateTime(exam.endDate)}</span>
            </div>
            {exam.fee_general !== undefined && (
              <div className="flex items-center gap-3 text-[var(--color-ink)]">
                <IndianRupee className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                <span className="w-28 text-[var(--color-ink-secondary)]">Application Fee:</span>
                <span className="font-bold text-[var(--color-success)]">₹{exam.fee_general} (General) / ₹{exam.fee_reserved} (Reserved)</span>
              </div>
            )}
          </ForgeCardContent>
        </ForgeCard>

        <div className="mt-auto pt-6 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
          <span className="text-[11px] text-[var(--color-ink-muted)] font-mono flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-[var(--color-success)]" /> Database Source: PostgreSQL / SQLite
          </span>
          <div className="flex gap-2">
            <ForgeButton variant="secondary" icon={<Settings className="w-4 h-4" />}>
              Configure Blueprint
            </ForgeButton>
            <ForgeButton variant="primary" icon={<MonitorPlay className="w-4 h-4" />}>
              Launch Monitor
            </ForgeButton>
          </div>
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
              "px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer",
              activeFilter === filter
                ? "bg-[var(--color-accent)] text-white shadow-xs"
                : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-inset)]"
            )}
          >
            {filter}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 sm:p-6 lg:p-8 space-y-6 font-sans select-none">
      <ForgePageHeader
        breadcrumbs={[
          { label: "Operations", href: "/authority" },
          { label: "Examinations" }
        ]}
        title="Examinations Directory"
        description="Live database catalog of all accredited examination sessions, fee schedules, and question blueprints."
        actions={
          <div className="flex items-center gap-2.5">
            <ForgeButton
              variant="secondary"
              size="md"
              icon={<RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />}
              onClick={fetchExams}
              disabled={isLoading}
            >
              Refresh
            </ForgeButton>
            <ForgeButton
              variant="primary"
              size="md"
              onClick={() => router.push("/create-exam")}
            >
              Create Examination
            </ForgeButton>
          </div>
        }
      />

      <div className="h-[calc(100vh-220px)] w-full flex-1">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-[var(--color-accent)] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Querying Database Catalog...
          </div>
        ) : error ? (
          <div className="p-8 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs text-center space-y-3 max-w-md mx-auto mt-8">
            <p className="font-bold">Database Query Error: {error}</p>
            <ForgeButton variant="primary" size="sm" onClick={fetchExams}>
              Retry Query
            </ForgeButton>
          </div>
        ) : (
          <ForgeMasterDetail
            items={filteredExams}
            selectedId={selectedId}
            onSelect={handleSelect}
            renderListItem={renderListItem}
            renderDetail={renderDetail}
            getItemId={(exam) => exam.id}
            searchPlaceholder="Search examinations by title, code or domain..."
            searchValue={search}
            onSearchChange={setSearch}
            filterSlot={<FilterPills />}
            emptyDetailTitle="Select an examination"
            emptyDetailDescription="Choose an examination from the database list to inspect its configuration and telemetry."
          />
        )}
      </div>
    </div>
  );
}
