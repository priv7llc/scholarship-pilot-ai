import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  Application,
  Scholarship,
  fetchApplications,
  upsertApplication,
} from "@/lib/scholarship";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Wand2,
  Minimize2,
  Maximize2,
  RotateCcw,
  Copy,
  Check,
  Send,
} from "lucide-react";
import { toast } from "sonner";

const TONES = [
  { id: "inspirational", label: "Inspirational", desc: "Uplifting & hopeful" },
  { id: "professional", label: "Professional", desc: "Polished & confident" },
  { id: "story", label: "Personal story", desc: "Vivid & narrative-driven" },
  { id: "bold", label: "Bold / standout", desc: "Distinctive voice" },
];

type Profile = {
  full_name: string; school: string; grade: string; major: string; gpa: string;
  background: string; challenges: string; achievements: string; extracurriculars: string;
};

const EMPTY_PROFILE: Profile = {
  full_name: "", school: "", grade: "", major: "", gpa: "",
  background: "", challenges: "", achievements: "", extracurriculars: "",
};

const SCHOLARSHIP_QUESTIONS = [
  "Why do you deserve this scholarship?",
  "How does this scholarship align with your future goals?",
  "What impact do you want to make with this opportunity?",
];

export default function Apply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [s, setS] = useState<Scholarship | null>(null);
  const [app, setApp] = useState<Application | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tone, setTone] = useState("story");
  const [step, setStep] = useState(1);
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const [sch, prof, apps] = await Promise.all([
        supabase.from("scholarships").select("*").eq("id", id).maybeSingle(),
        supabase.from("user_profile").select("*").eq("user_id", user.id).maybeSingle(),
        fetchApplications(),
      ]);
      setS(sch.data as Scholarship | null);
      if (prof.data) {
        const d = prof.data as Record<string, string | null>;
        const next: Profile = { ...EMPTY_PROFILE };
        (Object.keys(EMPTY_PROFILE) as (keyof Profile)[]).forEach((k) => {
          if (typeof d[k] === "string") next[k] = d[k] as string;
        });
        setProfile(next);
      }
      const existing = apps.find((a) => a.scholarship_id === id) ?? null;
      setApp(existing);
      if (existing) {
        setAnswers(existing.answers || {});
        setTone(existing.tone || "story");
        setEssay(existing.essay || "");
        if (existing.essay) setStep(5);
      }
      setLoading(false);
    })();
  }, [id, user]);

  const totalSteps = 4;
  const progress = step <= totalSteps ? (step / totalSteps) * 100 : 100;

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from("user_profile").upsert({ user_id: user.id, ...profile }, { onConflict: "user_id" });
  };

  const persistApp = async (patch: Partial<Application> = {}) => {
    if (!user || !s) return null;
    const saved = await upsertApplication({
      user_id: user.id,
      scholarship_id: s.id,
      status: patch.status ?? app?.status ?? "in_progress",
      answers: patch.answers ?? answers,
      tone: patch.tone ?? tone,
      essay: patch.essay ?? essay ?? null,
    });
    setApp(saved);
    return saved;
  };

  const next = async () => {
    if (step === 1) await saveProfile();
    if (step === 2) await saveProfile();
    await persistApp();
    setStep((s) => s + 1);
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const generate = async (mode: "generate" | "improve" | "stronger" | "shorten" | "expand" | "regenerate") => {
    if (!s) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-essay", {
        body: {
          scholarship: { name: s.name, requirements: s.requirements, category: s.category, amount: s.amount },
          profile,
          answers,
          tone,
          mode,
          current: essay,
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      const next = (data as { essay: string }).essay;
      setEssay(next);
      await persistApp({ essay: next, status: "essay_generated" });
      setStep(5);
      toast.success("Essay updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const markSubmitted = async () => {
    await persistApp({ status: "submitted" });
    toast.success("Marked as submitted 🎉");
    navigate("/");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(essay);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const wordCount = useMemo(() => essay.trim().split(/\s+/).filter(Boolean).length, [essay]);

  if (loading) return <AppLayout><p className="text-muted-foreground">Loading…</p></AppLayout>;
  if (!s) return <AppLayout><p>Not found.</p></AppLayout>;

  return (
    <AppLayout>
      <Link to={`/scholarship/${s.id}`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Applying to</div>
      <h1 className="font-display text-2xl font-semibold">{s.name}</h1>

      <div className="mt-6 mb-8">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>Step {Math.min(step, totalSteps)} of {totalSteps}</span>
          <span>{stepTitle(step)}</span>
        </div>
        <Progress value={progress} />
      </div>

      {step === 1 && (
        <Card className="bg-gradient-card p-6 shadow-elevated">
          <h2 className="font-display text-lg font-semibold">Basic info</h2>
          <p className="text-sm text-muted-foreground">Saved to your profile and reused for every essay.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={profile.full_name} onChange={(v) => setProfile({ ...profile, full_name: v })} />
            <Field label="School" value={profile.school} onChange={(v) => setProfile({ ...profile, school: v })} />
            <Field label="Grade / year" value={profile.grade} onChange={(v) => setProfile({ ...profile, grade: v })} />
            <Field label="Intended major" value={profile.major} onChange={(v) => setProfile({ ...profile, major: v })} />
            <Field label="GPA (optional)" value={profile.gpa} onChange={(v) => setProfile({ ...profile, gpa: v })} />
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="bg-gradient-card p-6 shadow-elevated">
          <h2 className="font-display text-lg font-semibold">Personal background</h2>
          <p className="text-sm text-muted-foreground">The more specific, the stronger the essay.</p>
          <div className="mt-5 grid gap-4">
            <Area label="Tell us about yourself" value={profile.background} onChange={(v) => setProfile({ ...profile, background: v })} />
            <Area label="Key challenges you've faced" value={profile.challenges} onChange={(v) => setProfile({ ...profile, challenges: v })} />
            <Area label="Achievements & accomplishments" value={profile.achievements} onChange={(v) => setProfile({ ...profile, achievements: v })} />
            <Area label="Extracurriculars / leadership" value={profile.extracurriculars} onChange={(v) => setProfile({ ...profile, extracurriculars: v })} />
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="bg-gradient-card p-6 shadow-elevated">
          <h2 className="font-display text-lg font-semibold">Scholarship-specific questions</h2>
          <p className="text-sm text-muted-foreground">A few sentences each is plenty.</p>
          <div className="mt-5 grid gap-4">
            {SCHOLARSHIP_QUESTIONS.map((q) => (
              <Area key={q} label={q} value={answers[q] ?? ""} onChange={(v) => setAnswers({ ...answers, [q]: v })} />
            ))}
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="bg-gradient-card p-6 shadow-elevated">
          <h2 className="font-display text-lg font-semibold">Tone & style</h2>
          <p className="text-sm text-muted-foreground">How should this essay feel?</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  tone === t.id
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className="font-medium">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </button>
            ))}
          </div>
          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={generating}
            onClick={() => generate(app?.essay ? "regenerate" : "generate")}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {generating ? "Crafting your essay…" : "Generate my essay"}
          </Button>
        </Card>
      )}

      {step === 5 && (
        <Card className="bg-gradient-card p-6 shadow-elevated">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Your essay</h2>
              <p className="text-xs text-muted-foreground">{wordCount} words</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={generating} onClick={() => generate("regenerate")}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Regenerate</Button>
              <Button size="sm" variant="outline" disabled={generating} onClick={() => generate("improve")}><Wand2 className="mr-1.5 h-3.5 w-3.5" />Improve</Button>
              <Button size="sm" variant="outline" disabled={generating} onClick={() => generate("stronger")}><Sparkles className="mr-1.5 h-3.5 w-3.5" />Make stronger</Button>
              <Button size="sm" variant="outline" disabled={generating} onClick={() => generate("shorten")}><Minimize2 className="mr-1.5 h-3.5 w-3.5" />Shorten</Button>
              <Button size="sm" variant="outline" disabled={generating} onClick={() => generate("expand")}><Maximize2 className="mr-1.5 h-3.5 w-3.5" />Expand</Button>
            </div>
          </div>
          <Textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            onBlur={() => persistApp({ essay })}
            className="min-h-[480px] font-sans text-[15px] leading-relaxed"
            disabled={generating}
          />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" onClick={copy}>
              {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
              {copied ? "Copied" : "Copy to clipboard"}
            </Button>
            <Button onClick={markSubmitted}><Send className="mr-1.5 h-4 w-4" />Mark as submitted</Button>
          </div>
        </Card>
      )}

      {step <= totalSteps && (
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={prev} disabled={step === 1}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
          {step < totalSteps && (
            <Button onClick={next}>Continue<ArrowRight className="ml-1 h-4 w-4" /></Button>
          )}
        </div>
      )}
    </AppLayout>
  );
}

function stepTitle(s: number) {
  return ["", "Basic info", "Background", "Scholarship questions", "Tone & style", "Essay"][s] ?? "";
}

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);
const Area = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[110px]" />
  </div>
);