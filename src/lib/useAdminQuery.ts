import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Database } from "./database.types";

// --- Electrician stats ---

export interface ElectricianStat {
  electricianId: string;
  name: string;
  total: number;
  autoApproved: number;
  edgeCase: number;
  rejected: number;
  approved: number;
  avgScore: number;
  recentJobs: Array<{ jobId: string; status: string; createdAt: string; aiScore: number }>;
}

export type QualityRating = "good" | "mixed" | "attention";

export function qualityRating(s: ElectricianStat): QualityRating {
  if (s.total === 0) return "mixed";
  const approvalRate = s.autoApproved / s.total;
  const rejectionRate = s.rejected / s.total;
  if (approvalRate >= 0.8 && rejectionRate < 0.1) return "good";
  if (approvalRate < 0.6 || rejectionRate > 0.2) return "attention";
  return "mixed";
}

async function fetchElectricianStats(): Promise<ElectricianStat[]> {
  const { data, error } = await supabase
    .from("installations")
    .select("id, job_id, status, ai_score, created_at, electrician_id, profiles!electrician_id(full_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const map = new Map<string, ElectricianStat>();
  for (const row of data as Array<{
    id: string; job_id: string; status: string; ai_score: number | null;
    created_at: string; electrician_id: string;
    profiles: { full_name: string } | null;
  }>) {
    if (!map.has(row.electrician_id)) {
      map.set(row.electrician_id, {
        electricianId: row.electrician_id,
        name: row.profiles?.full_name ?? "Unbekannt",
        total: 0, autoApproved: 0, edgeCase: 0, rejected: 0, approved: 0,
        avgScore: 0, recentJobs: [],
      });
    }
    const s = map.get(row.electrician_id)!;
    s.total++;
    if (row.status === "auto_approved") s.autoApproved++;
    else if (row.status === "edge_case") s.edgeCase++;
    else if (row.status === "rejected") s.rejected++;
    else if (row.status === "approved") s.approved++;
    s.avgScore += row.ai_score ?? 0;
    if (s.recentJobs.length < 10) {
      s.recentJobs.push({ jobId: row.job_id, status: row.status, createdAt: row.created_at, aiScore: row.ai_score ?? 0 });
    }
  }

  for (const s of map.values()) {
    s.avgScore = s.total > 0 ? Math.round((s.avgScore / s.total) * 100) : 0;
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function useElectricianStats() {
  return useQuery({ queryKey: ["electrician-stats"], queryFn: fetchElectricianStats, refetchInterval: 60_000 });
}

export type AdminUser = Database["public"]["Tables"]["profiles"]["Row"];

async function fetchUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data as AdminUser[];
}

export function useAdminUsers() {
  return useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });
}

async function callUpdateUser(action: string, userId: string, payload: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke("update-user", {
    body: { action, userId, ...payload },
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.error) throw res.error;
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      username: string;
      fullName: string;
      password: string;
      email?: string;
      role: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-user", {
        body: params,
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => callUpdateUser("deactivate", userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => callUpdateUser("reactivate", userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      callUpdateUser("change_role", userId, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      callUpdateUser("reset_password", userId, { password }),
  });
}
