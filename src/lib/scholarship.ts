import { supabase } from "@/integrations/supabase/client";

export type Scholarship = {
  id: string;
  name: string;
  who_for: string | null;
  amount: string | null;
  deadline: string | null;
  url: string | null;
  requirements: string | null;
  category: string | null;
  priority: string | null;
};

export type AppStatus = "not_started" | "in_progress" | "essay_generated" | "submitted";

export type Application = {
  id: string;
  user_id: string;
  scholarship_id: string;
  status: AppStatus;
  answers: Record<string, string>;
  tone: string | null;
  essay: string | null;
};

export const STATUS_LABEL: Record<AppStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  essay_generated: "Essay ready",
  submitted: "Submitted",
};

export const STATUS_TONE: Record<AppStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/15 text-warning",
  essay_generated: "bg-info/15 text-info",
  submitted: "bg-success/15 text-success",
};

export async function fetchScholarships() {
  const { data, error } = await supabase
    .from("scholarships")
    .select("*")
    .order("priority", { ascending: true })
    .order("name");
  if (error) throw error;
  return data as Scholarship[];
}

export async function fetchApplications() {
  const { data, error } = await supabase.from("applications").select("*");
  if (error) throw error;
  return data as Application[];
}

export async function upsertApplication(input: {
  scholarship_id: string;
  user_id: string;
  status?: AppStatus;
  answers?: Record<string, string>;
  tone?: string | null;
  essay?: string | null;
}) {
  const { data, error } = await supabase
    .from("applications")
    .upsert(input, { onConflict: "user_id,scholarship_id" })
    .select()
    .single();
  if (error) throw error;
  return data as Application;
}