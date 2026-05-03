import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Installation, InstallationComment, InstallationStatus, PhotoCheck, StepKey } from "./types";

// ─── helpers ────────────────────────────────────────────────────────────────

type RawInstallation = {
  id: string;
  job_id: string;
  meter_number: string;
  status: string;
  created_at: string;
  review_comment: string | null;
  reviewed_at: string | null;
  profiles: { full_name: string } | null;
  reviewer: { full_name: string } | null;
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
    dbId: row.id,
    electrician: row.profiles?.full_name ?? "Unbekannt",
    createdAt: row.created_at,
    meterNumber: row.meter_number,
    status: row.status as InstallationStatus,
    photos,
    reviewComment: row.review_comment ?? undefined,
    reviewedBy: row.reviewer?.full_name ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
  };
}

// ─── fetchers ────────────────────────────────────────────────────────────────

async function fetchList(): Promise<Installation[]> {
  const { data, error } = await supabase
    .from("installations")
    .select(`
      id, job_id, meter_number, status, created_at,
      review_comment, reviewed_at,
      profiles!electrician_id ( full_name ),
      reviewer:profiles!reviewed_by ( full_name )
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
      review_comment, reviewed_at,
      profiles!electrician_id ( full_name ),
      reviewer:profiles!reviewed_by ( full_name ),
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

  const signedUrls: string[] = [];
  if (rawPhotos.length > 0) {
    const { data: signed, error: signedError } = await supabase.storage
      .from("photos")
      .createSignedUrls(rawPhotos.map((p) => p.storage_path), 3600);
    if (signedError) throw signedError;
    // Use index-based mapping — safer than matching by path string
    rawPhotos.forEach((_, i) => {
      signedUrls.push(signed?.[i]?.signedUrl ?? "");
    });
  }

  const photos: PhotoCheck[] = rawPhotos.map((p, i) => ({
    step: p.ai_type as StepKey,
    imageUrl: signedUrls[i] ?? "",
    status: (p.ai_result ?? "passed") as "passed" | "failed",
    confidence: p.ai_confidence ?? 0,
    reasoning: p.ai_reasoning ?? "",
  }));

  return toInstallation(data as unknown as RawInstallation, photos);
}

async function fetchComments(installationDbId: string): Promise<InstallationComment[]> {
  const { data, error } = await supabase
    .from("installation_comments")
    .select(`id, body, created_at, profiles!author_id ( full_name )`)
    .eq("installation_id", installationDbId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as unknown as { id: string; body: string; created_at: string; profiles: { full_name: string } | null }[]).map((row) => ({
    id: row.id,
    body: row.body,
    authorName: row.profiles?.full_name ?? "Unbekannt",
    createdAt: row.created_at,
  }));
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

export function useInstallationComments(installationDbId: string | undefined) {
  return useQuery({
    queryKey: ["comments", installationDbId],
    queryFn: () => fetchComments(installationDbId!),
    enabled: !!installationDbId,
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      jobId,
      status,
      reviewComment,
      reviewedBy,
    }: {
      jobId: string;
      status: InstallationStatus;
      reviewComment?: string;
      reviewedBy?: string;
    }) => {
      const { error } = await supabase
        .from("installations")
        .update({
          status,
          ...(reviewedBy ? { reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() } : {}),
          ...(reviewComment !== undefined ? { review_comment: reviewComment || null } : {}),
        })
        .eq("job_id", jobId);
      if (error) throw error;
    },
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["installations"] });
      queryClient.invalidateQueries({ queryKey: ["installation", jobId] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      installationDbId,
      authorId,
      body,
    }: {
      installationDbId: string;
      authorId: string;
      body: string;
    }) => {
      const { error } = await supabase
        .from("installation_comments")
        .insert({ installation_id: installationDbId, author_id: authorId, body });
      if (error) throw error;
    },
    onSuccess: (_data, { installationDbId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", installationDbId] });
    },
  });
}
