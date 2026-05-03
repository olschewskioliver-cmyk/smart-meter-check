import { useEffect, useMemo, useState } from "react";
import { Loader2, WifiOff, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Wordmark } from "@/components/shared/Wordmark";
import { StepProgress } from "@/components/check/StepProgress";
import { CompletedStepRow } from "@/components/check/CompletedStepRow";
import { ActiveStepCard } from "@/components/check/ActiveStepCard";
import { MeterNumberInput } from "@/components/check/MeterNumberInput";
import { SubmitButton } from "@/components/check/SubmitButton";
import { ResultScreen } from "@/components/check/ResultScreen";
import { InstallBanner } from "@/components/check/InstallBanner";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { PhotoCheck, STEPS, StepKey } from "@/lib/types";
import { saveInstallation } from "@/lib/saveInstallation";
import { enqueue, getAll, remove, count } from "@/lib/submissionQueue";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Phase = "capture" | "saving" | "result" | "save_error";

interface CapturedPhoto {
  step: StepKey;
  dataUrl: string;
}

export default function Check() {
  const { user, signOut } = useAuth();
  const isOnline = useNetworkStatus();
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [meterNumber, setMeterNumber] = useState("");
  const [phase, setPhase] = useState<Phase>("capture");
  const [results, setResults] = useState<PhotoCheck[] | null>(null);
  const [queued, setQueued] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Load pending count on mount
  useEffect(() => {
    count().then(setPendingCount).catch(() => {});
  }, []);

  // Auto-process queue when connection is restored
  useEffect(() => {
    if (!isOnline || !user) return;
    processQueue();
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  async function processQueue() {
    const items = await getAll().catch(() => []);
    if (items.length === 0) return;
    for (const item of items) {
      try {
        await saveInstallation({
          userId: item.userId,
          meterNumber: item.meterNumber,
          photos: item.photos,
          results: item.results,
        });
        await remove(item.id);
        setPendingCount((n) => Math.max(0, n - 1));
        toast.success("Gespeicherter Auftrag hochgeladen.");
      } catch {
        break; // Still offline or upload failed — try again next time
      }
    }
  }
  const [analyzingSteps, setAnalyzingSteps] = useState<Set<StepKey>>(new Set());
  const [photoResults, setPhotoResults] = useState<Partial<Record<StepKey, PhotoCheck>>>({});
  // Which step is showing its result and waiting for electrician to decide (retake or continue)
  const [awaitingDecision, setAwaitingDecision] = useState<StepKey | null>(null);
  // Meter number OCR'd from the nameplate photo
  const [detectedMeterNumber, setDetectedMeterNumber] = useState<string | null>(null);

  const completedFlags = useMemo(
    () => STEPS.map((s) => photos.some((p) => p.step === s.key)),
    [photos]
  );
  const remaining = STEPS.length - photos.length;
  const allPhotosTaken = remaining === 0;
  const isAnalyzing = analyzingSteps.size > 0;
  // Don't advance to the next capture card while analyzing or while a decision is pending
  const activeStep = (awaitingDecision !== null || isAnalyzing)
    ? null
    : STEPS.find((s) => !completedFlags[s.index - 1]);
  const currentStepNum = activeStep?.index ?? STEPS.length;
  const allAnalyzed = allPhotosTaken && !isAnalyzing && photos.every((p) => !!photoResults[p.step]);
  const ready = allAnalyzed && meterNumber.trim().length > 0;

  function handlePhoto(step: StepKey, dataUrl: string) {
    setPhotos((prev) => {
      const without = prev.filter((p) => p.step !== step);
      return [...without, { step, dataUrl }];
    });
    setPhotoResults((prev) => {
      const next = { ...prev };
      delete next[step];
      return next;
    });
    analyzePhoto(step, dataUrl);
  }

  async function analyzePhoto(step: StepKey, dataUrl: string) {
    setAnalyzingSteps((prev) => new Set(prev).add(step));
    try {
      const { data, error } = await supabase.functions.invoke("analyze-photos", {
        body: { photos: [{ step, dataUrl }] },
      });

      if (error) throw error;

      const r = (data.results as Array<{
        step: StepKey;
        status: "passed" | "failed";
        confidence: number;
        reasoning: string;
        details?: { zaehler_nummer?: string | null };
      }>)[0];

      setPhotoResults((prev) => ({
        ...prev,
        [step]: {
          step: r.step,
          imageUrl: dataUrl,
          status: r.status,
          confidence: r.confidence,
          reasoning: r.reasoning,
        },
      }));

      // Extract OCR'd meter number from nameplate and auto-fill if not yet entered
      if (step === "nameplate" && r.details?.zaehler_nummer) {
        const ocr = r.details.zaehler_nummer;
        setDetectedMeterNumber(ocr);
        setMeterNumber((prev) => prev.trim() || ocr);
      }
    } catch (err) {
      console.error(`AI check for ${step} failed:`, err);
      toast.error("KI-Analyse fehlgeschlagen – bitte Foto erneut aufnehmen.");
      setPhotoResults((prev) => ({
        ...prev,
        [step]: {
          step,
          imageUrl: dataUrl,
          status: "failed" as const,
          confidence: 0,
          reasoning: "Analyse fehlgeschlagen – bitte Foto erneut aufnehmen.",
        },
      }));
    } finally {
      setAnalyzingSteps((prev) => {
        const next = new Set(prev);
        next.delete(step);
        return next;
      });
      // Show the result and wait for electrician to decide
      setAwaitingDecision(step);
    }
  }

  // Retake a photo — used both from the inline decision UI and the go-back "Neu" button
  function handleRetake(step: StepKey) {
    setPhotos((prev) => prev.filter((p) => p.step !== step));
    setPhotoResults((prev) => {
      const next = { ...prev };
      delete next[step];
      return next;
    });
    // If retaking the nameplate, clear the detected number so it re-OCRs fresh
    if (step === "nameplate") {
      setDetectedMeterNumber(null);
      setMeterNumber("");
    }
    setAwaitingDecision(null);
  }

  // Electrician is happy with the current photo and wants to proceed
  function handleDecisionContinue() {
    setAwaitingDecision(null);
  }

  async function runAiCheck() {
    const computed = photos.map((p) => photoResults[p.step]!);
    setResults(computed);
    await finalize(computed);
  }

  async function finalize(computed: PhotoCheck[]) {
    setPhase("saving");

    if (!isOnline) {
      try {
        await enqueue({ userId: user!.id, meterNumber, photos, results: computed });
        setPendingCount((n) => n + 1);
        setQueued(true);
        setPhase("result");
      } catch {
        setPhase("save_error");
      }
      return;
    }

    try {
      await saveInstallation({ userId: user!.id, meterNumber, photos, results: computed });
      setQueued(false);
      setPhase("result");
    } catch (err) {
      console.error("Save failed:", err);
      // Try to queue as fallback
      try {
        await enqueue({ userId: user!.id, meterNumber, photos, results: computed });
        setPendingCount((n) => n + 1);
        setQueued(true);
        setPhase("result");
      } catch {
        setPhase("save_error");
      }
    }
  }

  function handleRestart() {
    setPhotos([]);
    setMeterNumber("");
    setResults(null);
    setPhase("capture");
    setPhotoResults({});
    setAnalyzingSteps(new Set());
    setAwaitingDecision(null);
    setDetectedMeterNumber(null);
    setQueued(false);
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-lg">
        <div className="mx-auto w-full max-w-[430px] px-5 pt-5 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <Wordmark variant="light" subtitle="Smart Meter" />
            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning">
                  {pendingCount} ausstehend
                </span>
              )}
              <button
                onClick={() => signOut()}
                className="text-xs font-medium text-white/70 hover:text-white"
              >
                Abmelden
              </button>
            </div>
          </div>
          <h1 className="text-xl font-bold">Installationscheck</h1>
          <p className="text-sm text-white/75">Bitte alle 4 Fotos aufnehmen</p>
          <div className="mt-4">
            <StepProgress currentStep={currentStepNum} completed={completedFlags} />
          </div>
        </div>
      </header>

      <InstallBanner />

      {!isOnline && (
        <div className="mx-auto w-full max-w-[430px] px-5 pt-3">
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            <WifiOff className="h-4 w-4 shrink-0" />
            Keine Internetverbindung – Fotos können nicht hochgeladen werden.
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[430px] px-5 py-5">
        {phase === "saving" && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-8 py-12 text-center">
            <Loader2 className="h-14 w-14 animate-spin text-primary" />
            <div className="text-lg font-semibold text-foreground">Wird gespeichert…</div>
            <div className="text-xs text-muted-foreground">Fotos werden hochgeladen.</div>
          </div>
        )}

        {phase === "save_error" && results && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-8 py-12 text-center animate-fade-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <WifiOff className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">Speichern fehlgeschlagen</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Fotos sind noch vorhanden. Bitte Internetverbindung prüfen und erneut versuchen.
              </div>
            </div>
            <button
              type="button"
              onClick={() => finalize(results)}
              className="flex min-h-[52px] w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <RotateCcw className="h-4 w-4" />
              Erneut versuchen
            </button>
          </div>
        )}

        {phase === "result" && results && (
          <ResultScreen
            photos={results}
            meterNumber={meterNumber}
            onRestart={handleRestart}
            queued={queued}
          />
        )}

        {phase === "capture" && (
          <div className="space-y-3">
            {STEPS.map((s) => {
              const captured = photos.find((p) => p.step === s.key);
              if (captured) {
                return (
                  <CompletedStepRow
                    key={s.key}
                    thumbnail={captured.dataUrl}
                    title={s.title}
                    aiStatus={photoResults[s.key]?.status}
                    isAnalyzing={analyzingSteps.has(s.key)}
                    reasoning={photoResults[s.key]?.reasoning}
                    awaitingDecision={awaitingDecision === s.key}
                    onRetake={() => handleRetake(s.key)}
                    onContinue={handleDecisionContinue}
                  />
                );
              }
              if (activeStep?.key === s.key) {
                return (
                  <ActiveStepCard
                    key={s.key}
                    step={s}
                    totalSteps={STEPS.length}
                    onPhotoSelected={(_file, dataUrl) => handlePhoto(s.key, dataUrl)}
                  />
                );
              }
              return null;
            })}

            {/* Meter number only appears after all photos are taken and all decisions made */}
            {allPhotosTaken && awaitingDecision === null && (
              <MeterNumberInput
                detected={detectedMeterNumber}
                value={meterNumber}
                onChange={setMeterNumber}
              />
            )}
          </div>
        )}
      </main>

      {/* Sticky submit button — hidden while a decision is pending */}
      {phase === "capture" && awaitingDecision === null && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto w-full max-w-[430px] px-5 py-3">
            <SubmitButton
              remaining={remaining}
              isAnalyzing={isAnalyzing}
              ready={ready}
              onSubmit={runAiCheck}
            />
          </div>
        </div>
      )}
    </div>
  );
}
