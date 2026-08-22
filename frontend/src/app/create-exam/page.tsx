"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { ForgePageHeader } from "@/components/forge/ForgePageHeader";
import { ForgeStepIndicator, Step } from "@/components/forge/ForgeStepIndicator";
import { ForgeButton } from "@/components/forge/ForgeButton";
import { ForgeInput } from "@/components/forge/ForgeInput";
import { ForgeSelect } from "@/components/forge/ForgeSelect";
import { ForgeSwitch } from "@/components/forge/ForgeSwitch";
import { CheckCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const EXAM_TYPES = [
  { id: "cbt", name: "CBT Exam" },
  { id: "omr", name: "OMR Exam" },
  { id: "written", name: "Written Exam" },
  { id: "hybrid", name: "Hybrid Exam" }
];

const INTEGRITY_PACKAGES = [
  { id: "basic", name: "Basic Trust" },
  { id: "secure", name: "Secure Exam" },
  { id: "stakes", name: "High-Stakes" },
  { id: "authority", name: "Authority Grade" }
];

const CENTRE_LIST = [
  { id: "c1", name: "Mumbai Central - Hub A" },
  { id: "c2", name: "Delhi NCR - Hub B" },
  { id: "c3", name: "Bangalore Tech Park - Hub C" },
  { id: "c4", name: "Chennai Main - Hub D" },
];

function CreateExamPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Existing state from original implementation
  const [examType, setExamType] = useState("hybrid");
  const [integrityPackage, setIntegrityPackage] = useState("authority");
  const [examName, setExamName] = useState("National Scholarship Test 2026");
  const [candidates, setCandidates] = useState(40000);
  const [centers, setCenters] = useState(80);
  const [sets, setSets] = useState(4);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);

  // Workflow state
  const [step, setStep] = useState(1);

  // New form fields for the 8 steps
  const [examCode, setExamCode] = useState("EXM-2026-001");
  const [description, setDescription] = useState("");
  const [examDate, setExamDate] = useState("");
  const [duration, setDuration] = useState("120");

  const [numSections, setNumSections] = useState("3");
  const [questionTypes, setQuestionTypes] = useState("MCQ");
  const [marksPerQuestion, setMarksPerQuestion] = useState("4");

  const [questionCount, setQuestionCount] = useState("100");
  const [randomization, setRandomization] = useState(true);

  const [negativeMarking, setNegativeMarking] = useState(true);
  const [timePerSection, setTimePerSection] = useState(false);
  const [calculatorAllowed, setCalculatorAllowed] = useState(false);

  const [securitySettings, setSecuritySettings] = useState({
    deviceBinding: true,
    browserIntegrity: true,
    fullscreenEnforcement: true,
    clipboardRestriction: true,
    multiDeviceLogin: false, // blocked
    sessionReauth: true,
    identityVerification: true, // required
    livenessVerification: true, // required
    tabSwitchingDetection: true,
    networkAnomalyDetection: true,
    deviceIntegrity: true,
  });

  const [selectedCentres, setSelectedCentres] = useState<string[]>([]);

  useEffect(() => {
    const tpl = searchParams.get("template");
    const pkg = searchParams.get("package");
    if (tpl && EXAM_TYPES.some(t => t.id === tpl)) setExamType(tpl);
    if (pkg && INTEGRITY_PACKAGES.some(p => p.id === pkg)) setIntegrityPackage(pkg);
  }, [searchParams]);

  const handleNext = () => {
    if (step < 8) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleLaunch = async () => {
    setLoading(true);
    setLoadingStage(1);
    
    setTimeout(() => setLoadingStage(2), 500);
    setTimeout(() => setLoadingStage(3), 1000);
    setTimeout(() => setLoadingStage(4), 1500);
    setTimeout(() => setLoadingStage(5), 2000);
    
    setTimeout(() => {
      setLoading(false);
      router.push("/exams/EXM-001/control-room");
    }, 2600);
  };

  const handleSecurityChange = (key: keyof typeof securitySettings, checked: boolean) => {
    setSecuritySettings(prev => ({ ...prev, [key]: checked }));
  };

  const toggleCentre = (id: string) => {
    setSelectedCentres(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const stepList: Step[] = [
    { label: "01 Identity", status: step > 1 ? "completed" : step === 1 ? "current" : "pending" },
    { label: "02 Structure", status: step > 2 ? "completed" : step === 2 ? "current" : "pending" },
    { label: "03 Question Bank", status: step > 3 ? "completed" : step === 3 ? "current" : "pending" },
    { label: "04 Rules", status: step > 4 ? "completed" : step === 4 ? "current" : "pending" },
    { label: "05 Security", status: step > 5 ? "completed" : step === 5 ? "current" : "pending" },
    { label: "06 Centres", status: step > 6 ? "completed" : step === 6 ? "current" : "pending" },
    { label: "07 Review", status: step > 7 ? "completed" : step === 7 ? "current" : "pending" },
    { label: "08 Publish", status: step > 8 ? "completed" : step === 8 ? "current" : "pending" },
  ];

  if (loading) {
    const logMessages = [
      "",
      "Establishing dual-custody HSM key vaults...",
      "Seeding center database configurations...",
      "Sealing exam center envelopes with node-keys...",
      "Signing candidate biometric identity tokens...",
      "Locking final security policies & publication gates..."
    ];
    return (
      <div className="fixed inset-0 z-50 bg-[var(--surface-background)] flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[var(--surface-elevated)] border border-[var(--border-default)] p-6 rounded-[var(--radius-3)] shadow-2xl space-y-5">
          <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
            <span className="text-[var(--accent-primary)] font-bold text-xs uppercase">Vault Engine</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">System Deploy</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[var(--accent-primary)] animate-spin" />
              <span className="text-[var(--text-primary)] font-bold text-sm">Deploying Exam Pipelines</span>
            </div>
            <div className="bg-[var(--surface-background)] border border-[var(--border-subtle)] rounded-[var(--radius-2)] p-4 space-y-2 text-xs text-[var(--text-secondary)] font-mono min-h-[160px]">
              {loadingStage >= 1 && <div>[1/5] {logMessages[1]}</div>}
              {loadingStage >= 2 && <div className="text-[var(--accent-primary)]">[2/5] {logMessages[2]}</div>}
              {loadingStage >= 3 && <div className="text-[var(--accent-primary)]">[3/5] {logMessages[3]}</div>}
              {loadingStage >= 4 && <div className="text-[var(--accent-primary)]">[4/5] {logMessages[4]}</div>}
              {loadingStage >= 5 && <div className="text-[var(--status-success)] font-semibold">[5/5] {logMessages[5]}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] font-sans flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 select-none">
      <ForgePageHeader
        breadcrumbs={[
          { label: "Examinations", href: "/examinations" },
          { label: "Create Examination" }
        ]}
        title="Configure New Examination"
        description="Define examination blueprint, security policies, time per section, and assessment center quotas."
        actions={
          <ForgeButton
            variant="secondary"
            size="md"
            onClick={() => router.push("/examinations")}
          >
            Cancel & Exit
          </ForgeButton>
        }
      />

      <div className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-6 overflow-x-auto shadow-xs">
        <ForgeStepIndicator steps={stepList} className="min-w-max" />
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto">
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-6 md:p-8 flex flex-col min-h-[500px] shadow-xs">
          
          <div className="flex-1 mb-8">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-[var(--duration-normal)]">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] font-sans">01. Identity Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ForgeInput 
                    label="Exam Title" 
                    value={examName} 
                    onChange={(e) => setExamName(e.target.value)} 
                    placeholder="e.g. National Scholarship Test 2026"
                  />
                  <ForgeInput 
                    label="Exam Code" 
                    value={examCode} 
                    onChange={(e) => setExamCode(e.target.value)} 
                    mono
                  />
                  <div className="md:col-span-2">
                    <ForgeInput 
                      label="Description" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                    />
                  </div>
                  <ForgeInput 
                    label="Exam Date" 
                    type="date"
                    value={examDate} 
                    onChange={(e) => setExamDate(e.target.value)} 
                  />
                  <ForgeInput 
                    label="Duration (minutes)" 
                    type="number"
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value)} 
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-[var(--duration-normal)]">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] font-sans">02. Structure Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ForgeInput 
                    label="Number of Sections" 
                    type="number"
                    value={numSections} 
                    onChange={(e) => setNumSections(e.target.value)} 
                  />
                  <ForgeSelect 
                    label="Question Types"
                    options={[
                      { value: "MCQ", label: "Multiple Choice (MCQ)" },
                      { value: "Numerical", label: "Numerical Response" },
                      { value: "Written", label: "Descriptive/Written" },
                      { value: "Mixed", label: "Mixed Format" },
                    ]}
                    value={questionTypes}
                    onValueChange={setQuestionTypes}
                  />
                  <ForgeInput 
                    label="Marks Per Question" 
                    type="number"
                    value={marksPerQuestion} 
                    onChange={(e) => setMarksPerQuestion(e.target.value)} 
                  />
                  <ForgeSelect 
                    label="Exam Delivery Template"
                    options={EXAM_TYPES.map(t => ({ value: t.id, label: t.name }))}
                    value={examType}
                    onValueChange={setExamType}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-[var(--duration-normal)]">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] font-sans">03. Question Bank</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ForgeInput 
                    label="Total Question Count" 
                    type="number"
                    value={questionCount} 
                    onChange={(e) => setQuestionCount(e.target.value)} 
                  />
                  <ForgeInput 
                    label="Paper Sets" 
                    type="number"
                    value={sets.toString()} 
                    onChange={(e) => setSets(Number(e.target.value))} 
                  />
                  <div className="md:col-span-2 mt-4 p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface-sunken)]">
                    <ForgeSwitch 
                      label="Enable Question Randomization" 
                      description="Randomize question sequence across different candidate sessions"
                      checked={randomization}
                      onCheckedChange={setRandomization}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-[var(--duration-normal)]">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] font-sans">04. Examination Rules</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface-sunken)]">
                    <ForgeSwitch 
                      label="Negative Marking" 
                      description="Deduct partial marks for incorrect answers"
                      checked={negativeMarking}
                      onCheckedChange={setNegativeMarking}
                    />
                  </div>
                  <div className="p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface-sunken)]">
                    <ForgeSwitch 
                      label="Enforce Time Per Section" 
                      description="Candidates must spend a strict amount of time on each section before proceeding"
                      checked={timePerSection}
                      onCheckedChange={setTimePerSection}
                    />
                  </div>
                  <div className="p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface-sunken)]">
                    <ForgeSwitch 
                      label="On-Screen Calculator Allowed" 
                      description="Provide an on-screen scientific calculator during the exam"
                      checked={calculatorAllowed}
                      onCheckedChange={setCalculatorAllowed}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 animate-in fade-in duration-[var(--duration-normal)]">
                <div className="flex justify-between items-center">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] font-sans">05. Security Policies</h2>
                  <ForgeSelect 
                    className="w-48"
                    options={INTEGRITY_PACKAGES.map(p => ({ value: p.id, label: p.name }))}
                    value={integrityPackage}
                    onValueChange={setIntegrityPackage}
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-ink-secondary)] uppercase tracking-wider mb-3 font-mono">Session Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ForgeSwitch label="Device Binding" checked={securitySettings.deviceBinding} onCheckedChange={(v) => handleSecurityChange('deviceBinding', v)} />
                      <ForgeSwitch label="Browser Integrity" checked={securitySettings.browserIntegrity} onCheckedChange={(v) => handleSecurityChange('browserIntegrity', v)} />
                      <ForgeSwitch label="Fullscreen Enforcement" checked={securitySettings.fullscreenEnforcement} onCheckedChange={(v) => handleSecurityChange('fullscreenEnforcement', v)} />
                      <ForgeSwitch label="Clipboard Restriction" checked={securitySettings.clipboardRestriction} onCheckedChange={(v) => handleSecurityChange('clipboardRestriction', v)} />
                      <ForgeSwitch label="Multi-device Login" description="BLOCKED" checked={securitySettings.multiDeviceLogin} disabled />
                      <ForgeSwitch label="Session Re-authentication" checked={securitySettings.sessionReauth} onCheckedChange={(v) => handleSecurityChange('sessionReauth', v)} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-ink-secondary)] uppercase tracking-wider mb-3 font-mono">Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ForgeSwitch label="Identity Verification" description="REQUIRED" checked={securitySettings.identityVerification} disabled />
                      <ForgeSwitch label="Liveness Verification" description="REQUIRED" checked={securitySettings.livenessVerification} disabled />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-ink-secondary)] uppercase tracking-wider mb-3 font-mono">Monitoring</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ForgeSwitch label="Tab Switching Detection" checked={securitySettings.tabSwitchingDetection} onCheckedChange={(v) => handleSecurityChange('tabSwitchingDetection', v)} />
                      <ForgeSwitch label="Network Anomaly Detection" checked={securitySettings.networkAnomalyDetection} onCheckedChange={(v) => handleSecurityChange('networkAnomalyDetection', v)} />
                      <ForgeSwitch label="Device Integrity" checked={securitySettings.deviceIntegrity} onCheckedChange={(v) => handleSecurityChange('deviceIntegrity', v)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6 animate-in fade-in duration-[var(--duration-normal)]">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] font-sans">06. Designated Centres</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <ForgeInput 
                    label="Expected Candidates" 
                    type="number"
                    value={candidates.toString()} 
                    onChange={(e) => setCandidates(Number(e.target.value))} 
                  />
                  <ForgeInput 
                    label="Total Centres Capacity" 
                    type="number"
                    value={centers.toString()} 
                    onChange={(e) => setCenters(Number(e.target.value))} 
                  />
                </div>
                
                <h3 className="text-xs font-bold text-[var(--color-ink-secondary)] uppercase tracking-wider mb-3 font-mono">Select Specific Exam Hubs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CENTRE_LIST.map(centre => (
                    <div 
                      key={centre.id}
                      onClick={() => toggleCentre(centre.id)}
                      className={cn(
                        "p-4 rounded-xl border cursor-pointer transition-colors flex items-center gap-3",
                        selectedCentres.includes(centre.id) 
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-surface)] text-[var(--color-accent)]" 
                          : "border-[var(--color-border)] bg-[var(--color-surface-sunken)] hover:border-[var(--color-border-strong)] text-[var(--color-ink)]"
                      )}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedCentres.includes(centre.id)}
                        onChange={() => {}} // handled by parent onClick
                        className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                      />
                      <span className="text-sm font-medium">{centre.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-6 animate-in fade-in duration-[var(--duration-normal)]">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-ink)] font-sans">07. Review Configuration</h2>
                
                <div className="bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl p-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-ink-secondary)] uppercase tracking-wider mb-2 flex justify-between font-mono">
                      Identity & Structure
                      <button onClick={() => setStep(1)} className="text-[var(--color-accent)] hover:underline capitalize normal-case text-xs font-sans cursor-pointer">Edit</button>
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-[var(--color-ink-secondary)]">Name:</span> <span className="font-semibold text-[var(--color-ink)]">{examName}</span>
                      <span className="text-[var(--color-ink-secondary)]">Code:</span> <span className="font-mono font-semibold text-[var(--color-ink)]">{examCode}</span>
                      <span className="text-[var(--color-ink-secondary)]">Date & Duration:</span> <span className="text-[var(--color-ink)]">{examDate || "Not set"} ({duration} mins)</span>
                      <span className="text-[var(--color-ink-secondary)]">Type:</span> <span className="uppercase font-semibold text-[var(--color-ink)]">{examType}</span>
                    </div>
                  </div>

                  <div className="h-px bg-[var(--color-border)]" />
                  
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-ink-secondary)] uppercase tracking-wider mb-2 flex justify-between font-mono">
                      Rules & Security
                      <button onClick={() => setStep(4)} className="text-[var(--color-accent)] hover:underline capitalize normal-case text-xs font-sans cursor-pointer">Edit</button>
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-[var(--color-ink-secondary)]">Integrity Package:</span> <span className="capitalize font-semibold text-[var(--color-ink)]">{integrityPackage}</span>
                      <span className="text-[var(--color-ink-secondary)]">Negative Marking:</span> <span className="text-[var(--color-ink)]">{negativeMarking ? "Yes" : "No"}</span>
                      <span className="text-[var(--color-ink-secondary)]">Strict Timing:</span> <span className="text-[var(--color-ink)]">{timePerSection ? "Yes" : "No"}</span>
                    </div>
                  </div>

                  <div className="h-px bg-[var(--color-border)]" />
                  
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-ink-secondary)] uppercase tracking-wider mb-2 flex justify-between font-mono">
                      Scale
                      <button onClick={() => setStep(6)} className="text-[var(--color-accent)] hover:underline capitalize normal-case text-xs font-sans cursor-pointer">Edit</button>
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-[var(--color-ink-secondary)]">Candidates:</span> <span className="font-semibold text-[var(--color-ink)]">{candidates.toLocaleString()}</span>
                      <span className="text-[var(--color-ink-secondary)]">Centres Capacity:</span> <span className="font-semibold text-[var(--color-ink)]">{centers}</span>
                      <span className="text-[var(--color-ink-secondary)]">Selected Hubs:</span> <span className="text-[var(--color-ink)]">{selectedCentres.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-6 animate-in fade-in duration-[var(--duration-normal)] h-full flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-success-surface)] text-[var(--color-success)] border border-[var(--color-success-border)] flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-ink)] font-sans">Ready to Publish</h2>
                <p className="text-sm text-[var(--color-ink-secondary)] max-w-md mx-auto mb-8 font-sans">
                  The examination {examCode} is configured and ready for deployment. This will initialize the secure environment and lock the configuration.
                </p>
                <ForgeButton 
                  size="md" 
                  variant="primary" 
                  onClick={handleLaunch} 
                  disabled={loading}
                  className="w-full max-w-xs gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Deploy Examination Pipeline
                </ForgeButton>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-[var(--border-subtle)] mt-auto">
            <ForgeButton
              variant="secondary"
              onClick={handleBack}
              disabled={step === 1 || loading}
              className="w-32 justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </ForgeButton>
            
            {step < 8 && (
              <ForgeButton
                variant="primary"
                onClick={handleNext}
                disabled={loading}
                className="w-32 justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </ForgeButton>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreateExamPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--surface-background)] text-[var(--text-muted)] text-sm gap-3 font-sans">
        <Sparkles className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
        <span>Loading Configuration Wizard...</span>
      </div>
    }>
      <CreateExamPageInner />
    </Suspense>
  );
}
