import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save } from "lucide-react";

type Profile = {
  full_name: string; school: string; grade: string; major: string; gpa: string;
  background: string; challenges: string; achievements: string; extracurriculars: string;
};
const EMPTY: Profile = {
  full_name: "", school: "", grade: "", major: "", gpa: "",
  background: "", challenges: "", achievements: "", extracurriculars: "",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [p, setP] = useState<Profile>(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_profile").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      const d = data as Record<string, string | null>;
      const next: Profile = { ...EMPTY };
      (Object.keys(EMPTY) as (keyof Profile)[]).forEach((k) => {
        if (typeof d[k] === "string") next[k] = d[k] as string;
      });
      setP(next);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("user_profile").upsert({ user_id: user.id, ...p }, { onConflict: "user_id" });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved — future essays will reuse this.");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-semibold">Your profile</h1>
        <p className="text-sm text-muted-foreground">Reused across every scholarship — fill it once, win more.</p>
        <Card className="mt-6 bg-gradient-card p-6 shadow-elevated">
          <div className="grid gap-4 sm:grid-cols-2">
            <F l="Full name" v={p.full_name} on={(v) => setP({ ...p, full_name: v })} />
            <F l="School" v={p.school} on={(v) => setP({ ...p, school: v })} />
            <F l="Grade / year" v={p.grade} on={(v) => setP({ ...p, grade: v })} />
            <F l="Intended major" v={p.major} on={(v) => setP({ ...p, major: v })} />
            <F l="GPA" v={p.gpa} on={(v) => setP({ ...p, gpa: v })} />
          </div>
          <div className="mt-4 grid gap-4">
            <A l="About you" v={p.background} on={(v) => setP({ ...p, background: v })} />
            <A l="Challenges you've faced" v={p.challenges} on={(v) => setP({ ...p, challenges: v })} />
            <A l="Achievements" v={p.achievements} on={(v) => setP({ ...p, achievements: v })} />
            <A l="Extracurriculars / leadership" v={p.extracurriculars} on={(v) => setP({ ...p, extracurriculars: v })} />
          </div>
          <Button className="mt-6" onClick={save} disabled={busy}>
            <Save className="mr-1.5 h-4 w-4" /> {busy ? "Saving…" : "Save profile"}
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
}

const F = ({ l, v, on }: { l: string; v: string; on: (v: string) => void }) => (
  <div className="space-y-1.5"><Label>{l}</Label><Input value={v} onChange={(e) => on(e.target.value)} /></div>
);
const A = ({ l, v, on }: { l: string; v: string; on: (v: string) => void }) => (
  <div className="space-y-1.5"><Label>{l}</Label><Textarea value={v} onChange={(e) => on(e.target.value)} className="min-h-[110px]" /></div>
);