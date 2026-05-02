import { useMemo, useState } from "react";
import { Wordmark } from "@/components/shared/Wordmark";
import { StepProgress } from "@/components/check/StepProgress";
import { CompletedStepRow } from "@/components/check/CompletedStepRow";
import { ActiveStepCard } from "@/components/check/ActiveStepCard";
import { MeterNumberInput } from "@/components/check/MeterNumberInput";
import { SubmitButton } from "@/components/check/SubmitButton";
import { LoadingScreen } from "@/components/check/LoadingScreen";
import { ResultScreen } from "@/components/check/ResultScreen";
import { RetakeModal } from "@/components/check/RetakeModal";
import { PhotoCheck, STEPS, StepKey } from "@/lib/types";
import { installationsStore } from "@/lib/installationsStore";

type Phase = "capture" | "loading" | "result";

interface CapturedPhoto {
  step: StepKey;
  dataUrl: string;
}

export default function Check() {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [meterNumber, setMeterNumber] = useState("");
  const [phase, setPhase] = useState<Phase>("capture");
  const [results, setResults] = useState<PhotoCheck[] | null>(null);
  const [showRetakeModal, setShowRetakeModal] = useState(false);

  const completedFlags = useMemo(
    () => STEPS.map((s) => photos.some((p) => p.step === s.key)),
    [photos]
  );
  const activeStep = STEPS.find((s) => !completedFlags[s.index - 1]);
  const currentStepNum = activeStep?.index ?? STEPS.length;
  const remaining = STEPS.length - photos.length;
  const allPhotosTaken = remaining === 0;
  const ready = allPhotosTaken && meterNumber.trim().length > 0;

  function handlePhoto(step: StepKey, dataUrl: string) {
    setPhotos((prev) => {
      const without = prev.filter((p) => p.step !== step);
      return [...without, { step, dataUrl }];
    });
  }

  function handleRetake(step: StepKey) {
    setPhotos((prev) => prev.filter((p) => p.step !== step));
  }

  function runSimulatedCheck() {
    setPhase("loading");
    // SIMULATION: replace with real AI call to vision/OCR endpoint
    setTimeout(() => {
      const computed: PhotoCheck[] = STEPS.map((s) => {
        const photo = photos.find((p) => p.step === s.key)!;
        // ~85% chance to pass; deterministic per step + count for repeatability
        const seed = (s.index * 7 + photos.length * 3) % 10;
        const passed = seed !== 0 && seed !== 1;
        return {
          step: s.key,
          imageUrl: photo.dataUrl,
          status: passed ? "passed" : "failed",
          confidence: passed ? 0.92 + (seed % 5) / 100 : 0.4 + (seed % 3) / 10,
          reasoning: passed
            ? "Bild scharf, alle relevanten Merkmale klar erkennbar."
            : failureReasonFor(s.key),
        };
      });
      setResults(computed);
      const anyFailed = computed.some((c) => c.status === "failed");
      if (anyFailed) {
        setShowRetakeModal(true);
      } else {
        finalize(computed);
      }
    }, 6000);
  }

  function finalize(computed: PhotoCheck[]) {
    const anyFailed = computed.some((c) => c.status === "failed");
    const installation = {
      id: installationsStore.nextId(),
      electrician: "Markus Weber", // demo user
      createdAt: new Date().toISOString(),
      meterNumber,
      status: anyFailed ? ("edge_case" as const) : ("auto_approved" as const),
      photos: computed,
    };
    installationsStore.add(installation);
    setShowRetakeModal(false);
    setPhase("result");
  }

  function handleRetakeFromModal() {
    if (!results) return;
    const failedSteps = results.filter((r) => r.status === "failed").map((r) => r.step);
    setPhotos((prev) => prev.filter((p) => !failedSteps.includes(p.step)));
    setResults(null);
    setShowRetakeModal(false);
    setPhase("capture");
  }

  function handleContinueFromModal() {
    if (results) finalize(results);
  }

  function handleRestart() {
    setPhotos([]);
    setMeterNumber("");
    setResults(null);
    setPhase("capture");
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-lg">
        <div className="mx-auto w-full max-w-[430px] px-5 pt-5 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <Wordmark variant="light" subtitle="Smart Meter" />
            <button className="text-xs font-medium text-white/70 hover:text-white">
              Abmelden
            </button>
          </div>
          <h1 className="text-xl font-bold">Installationscheck</h1>
          <p className="text-sm text-white/75">Bitte alle 4 Fotos aufnehmen</p>
          <div className="mt-4">
            <StepProgress currentStep={currentStepNum} completed={completedFlags} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[430px] px-5 py-5">
        {phase === "loading" && (
          <div className="flex min-h-[60vh] flex-col">
            <LoadingScreen />
          </div>
        )}

        {phase === "result" && results && (
          <ResultScreen
            photos={results}
            meterNumber={meterNumber}
            onRestart={handleRestart}
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
                    onRetake={() => handleRetake(s.key)}
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

            {allPhotosTaken && (
              <MeterNumberInput
                detected={null}
                value={meterNumber}
                onChange={setMeterNumber}
              />
            )}
          </div>
        )}
      </main>

      {/* Sticky bottom CTA – only during capture */}
      {phase === "capture" && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto w-full max-w-[430px] px-5 py-3">
            <SubmitButton
              remaining={remaining}
              ready={ready}
              onSubmit={runSimulatedCheck}
            />
          </div>
        </div>
      )}

      {showRetakeModal && results && (
        <RetakeModal
          failedStepNumbers={results
            .filter((r) => r.status === "failed")
            .map((r) => STEPS.find((s) => s.key === r.step)!.index)}
          onRetake={handleRetakeFromModal}
          onContinue={handleContinueFromModal}
        />
      )}
    </div>
  );
}

function failureReasonFor(step: StepKey): string {
  switch (step) {
    case "gateway":
      return "LED-Status nicht eindeutig erkennbar – Bild bitte erneut aufnehmen.";
    case "meter_wiring":
      return "Verkabelung nicht vollständig im Bild.";
    case "cabinet":
      return "Zählerschrank nicht vollständig sichtbar.";
    case "nameplate":
      return "Zählernummer unscharf oder verdeckt.";
  }
}
