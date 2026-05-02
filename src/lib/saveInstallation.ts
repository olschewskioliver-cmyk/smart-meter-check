import { supabase } from "./supabase";
import { STEPS } from "./types";
import type { PhotoCheck, StepKey } from "./types";

interface SaveParams {
  userId: string;
  meterNumber: string;
  photos: Array<{ step: StepKey; dataUrl: string }>;
  results: PhotoCheck[];
}

export async function saveInstallation({
  userId,
  meterNumber,
  photos,
  results,
}: SaveParams): Promise<string> {
  // Generate sequential job_id
  const { count } = await supabase
    .from("installations")
    .select("*", { count: "exact", head: true });
  const jobId = `INST-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const installationId = crypto.randomUUID();
  const anyFailed = results.some((r) => r.status === "failed");
  const avgScore = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  // Create installation record first
  const { error: installError } = await supabase.from("installations").insert({
    id: installationId,
    job_id: jobId,
    electrician_id: userId,
    meter_number: meterNumber,
    status: anyFailed ? "edge_case" : "auto_approved",
    ai_score: Math.round(avgScore * 100) / 100,
    ai_result_json: results as unknown as import("./database.types").Json,
  });
  if (installError) throw installError;

  // Upload all photos and create photo records in parallel
  await Promise.all(
    results.map(async (result) => {
      const photo = photos.find((p) => p.step === result.step)!;
      const blob = await fetch(photo.dataUrl).then((r) => r.blob());
      const storagePath = `${userId}/${installationId}/${result.step}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(storagePath, blob, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const stepDef = STEPS.find((s) => s.key === result.step)!;
      const { error: photoError } = await supabase.from("installation_photos").insert({
        installation_id: installationId,
        photo_number: stepDef.index,
        storage_path: storagePath,
        ai_type: result.step,
        ai_result: result.status,
        ai_confidence: result.confidence,
        ai_reasoning: result.reasoning,
      });
      if (photoError) throw photoError;
    })
  );

  return jobId;
}
