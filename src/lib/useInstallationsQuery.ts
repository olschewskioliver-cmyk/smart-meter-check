import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Installation, InstallationStatus, PhotoCheck, StepKey } from "./types";

// ─── helpers ────────────────────────────────────────────────────────────────

type RawInstallation = {
  id: string;
  job_id: string;
  meter_number: string;
  status: string;
  created_at: string;
  profiles: { full_name: string } | null;
};

type RawPhoto = {
  photo_number: number;
  storage_path: string;
  ai_type: string;
  ai_result: string | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
};

function toInstallation(row: RawInstallation, photos: PhotoCheck[] = []): Installation {
  return {
    id: row.job_id,
    electrician: row.profiles?.full_name ?? "Unbekannt",
    createdAt: row.created_at,
    meterNumber: row.meter_number,
    status: row.status as InstallationStatus,
    photos,
  };
}

// ─── fetchers ────────────────────────────────────────────────────────────────

async function fetchList(): Promise<Installation[]> {
  const { data, error } = await supabase
    .from("installations")
    .select(`
      id, job_id, meter_number, status, created_at,
      profiles!electrician_id ( full_name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as RawInstallation[]).map((row) => toInstallation(row));
}

async function fetchDetail(jobId: string): Promise<Installation> {
  const { data, error } = await supabase
    .from("installations")
    .select(`
      id, job_id, meter_number, status, created_at,
      profiles!electrician_id ( full_name ),
      installation_photos (
        photo_number, storage_path,
        ai_type, ai_result, ai_confidence, ai_reasoning
      )
    `)
    .eq("job_id", jobId)
    .single();

  if (error) throw error;

  const rawPhotos = ((data as unknown as { installation_photos: RawPhoto[] }).installation_photos ?? [])
    .sort((a, b) => a.photo_number - b.photo_number);

  // Generate signed Storage URLs for all photos in one call
  let urlMap: Record<string, string> = {};
  if (rawPhotos.length > 0) {
    const { data: signed } = await supabase.storage
      .from("photos")
      .createSignedUrls(rawPhotos.map((p) => p.storage_path), 3600);
    urlMap = Object.fromEntries(
      (signed ?? []).map(({ path, signedUrl }) => [path, signedUrl ?? ""])
    );
  }

  const photos: PhotoCheck[] = rawPhotos.map((p) => ({
    step: p.ai_type as StepKey,
    imageUrl: urlMap[p.storage_path] ?? "",
    status: (p.ai_result ?? "passed") as "passed" | "failed",
    confidence: p.ai_confidence ?? 0,
    reasoning: p.ai_reasoning ?? "",
  }));

  return toInstallation(data as unknown as RawInstallation, photos);
}

// ─── hooks ───────────────────────────────────────────────────────────────────

export function useInstallationsList() {
  return useQuery({
    queryKey: ["installations"],
    queryFn: fetchList,
    refetchInterval: 30_000,
  });
}

export function useInstallationDetail(jobId: string | undefined) {
  return useQuery({
    queryKey: ["installation", jobId],
    queryFn: () => fetchDetail(jobId!),
    enabled: !!jobId,
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: InstallationStatus }) => {
      const { error } = await supabase
        .from("installations")
        .update({ status })
        .eq("job_id", jobId);
      if (error) throw error;
    },
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["installations"] });
      queryClient.invalidateQueries({ queryKey: ["installation", jobId] });
    },
  });
}
