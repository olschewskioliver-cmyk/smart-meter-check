export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = "electrician" | "office";
export type InstallationStatus = "pending" | "edge_case" | "warning" | "auto_approved" | "approved" | "rejected";
export type AiPhotoType = "gateway" | "meter_wiring" | "cabinet" | "nameplate";
export type AiResult = "passed" | "failed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
        };
        Insert: {
          id: string;
          full_name: string;
          role: UserRole;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
        };
      };
      installations: {
        Row: {
          id: string;
          job_id: string;
          electrician_id: string;
          meter_number: string;
          notes: string | null;
          address: string | null;
          status: InstallationStatus;
          ai_score: number | null;
          ai_feedback: string | null;
          ai_result_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          electrician_id: string;
          meter_number: string;
          notes?: string | null;
          address?: string | null;
          status?: InstallationStatus;
          ai_score?: number | null;
          ai_feedback?: string | null;
          ai_result_json?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          electrician_id?: string;
          meter_number?: string;
          notes?: string | null;
          address?: string | null;
          status?: InstallationStatus;
          ai_score?: number | null;
          ai_feedback?: string | null;
          ai_result_json?: Json | null;
          created_at?: string;
        };
      };
      installation_photos: {
        Row: {
          id: string;
          installation_id: string;
          photo_number: number;
          storage_path: string;
          ai_type: AiPhotoType;
          ai_result: AiResult | null;
          ai_confidence: number | null;
          ai_reasoning: string | null;
          electrician_override: boolean;
        };
        Insert: {
          id?: string;
          installation_id: string;
          photo_number: number;
          storage_path: string;
          ai_type: AiPhotoType;
          ai_result?: AiResult | null;
          ai_confidence?: number | null;
          ai_reasoning?: string | null;
          electrician_override?: boolean;
        };
        Update: {
          id?: string;
          installation_id?: string;
          photo_number?: number;
          storage_path?: string;
          ai_type?: AiPhotoType;
          ai_result?: AiResult | null;
          ai_confidence?: number | null;
          ai_reasoning?: string | null;
          electrician_override?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
