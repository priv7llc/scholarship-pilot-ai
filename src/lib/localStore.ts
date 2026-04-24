import { AppStatus } from "./scholarship";

const PROFILE_KEY = "sa.profile";
const APPS_KEY = "sa.applications";

export type LocalProfile = {
  full_name: string; school: string; grade: string; major: string; gpa: string;
  background: string; challenges: string; achievements: string; extracurriculars: string;
};
export const EMPTY_PROFILE: LocalProfile = {
  full_name: "", school: "", grade: "", major: "", gpa: "",
  background: "", challenges: "", achievements: "", extracurriculars: "",
};

export type LocalApplication = {
  scholarship_id: string;
  status: AppStatus;
  answers: Record<string, string>;
  tone: string | null;
  essay: string | null;
  updated_at: string;
};

export const loadProfile = (): LocalProfile => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...EMPTY_PROFILE };
    return { ...EMPTY_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_PROFILE };
  }
};
export const saveProfile = (p: LocalProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
};

export const loadApplications = (): LocalApplication[] => {
  try {
    const raw = localStorage.getItem(APPS_KEY);
    return raw ? (JSON.parse(raw) as LocalApplication[]) : [];
  } catch {
    return [];
  }
};
export const saveApplications = (apps: LocalApplication[]) => {
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
};
export const upsertApplication = (a: Omit<LocalApplication, "updated_at">): LocalApplication => {
  const apps = loadApplications();
  const idx = apps.findIndex((x) => x.scholarship_id === a.scholarship_id);
  const next: LocalApplication = { ...a, updated_at: new Date().toISOString() };
  if (idx >= 0) apps[idx] = { ...apps[idx], ...next };
  else apps.push(next);
  saveApplications(apps);
  return next;
};
export const getApplication = (scholarship_id: string): LocalApplication | null =>
  loadApplications().find((a) => a.scholarship_id === scholarship_id) ?? null;