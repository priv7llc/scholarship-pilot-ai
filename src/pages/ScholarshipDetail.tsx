import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Clock, DollarSign, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Application, Scholarship, STATUS_LABEL, STATUS_TONE, AppStatus } from "@/lib/scholarship";
import { toast } from "sonner";

export default function ScholarshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [s, setS] = useState<Scholarship | null>(null);
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [sch, ap] = await Promise.all([
        supabase.from("scholarships").select("*").eq("id", id).maybeSingle(),
        supabase.from("applications").select("*").eq("scholarship_id", id).maybeSingle(),
      ]);
      if (sch.error) toast.error(sch.error.message);
      setS(sch.data as Scholarship | null);
      setApp(ap.data as Application | null);
      setLoading(false);
    })();
  }, [id]);

  const reqList = (s?.requirements ?? "").split(/[;.•]\s+/).map((r) => r.trim()).filter(Boolean);

  if (loading) return <AppLayout><p className="text-muted-foreground">Loading…</p></AppLayout>;
  if (!s) return <AppLayout><p>Not found.</p></AppLayout>;

  const st: AppStatus = app?.status ?? "not_started";

  return (
    <AppLayout>
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="bg-gradient-card p-7 shadow-elevated">
            <div className="flex items-start justify-between gap-4">
              <div>
                {s.priority && <Badge variant="secondary" className="mb-3">{s.priority}</Badge>}
                <h1 className="font-display text-3xl font-semibold leading-tight">{s.name}</h1>
                {s.category && <p className="mt-2 text-sm text-muted-foreground">{s.category}</p>}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_TONE[st]}`}>{STATUS_LABEL[st]}</span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Info icon={<DollarSign className="h-4 w-4" />} label="Award" value={s.amount} />
              <Info icon={<Clock className="h-4 w-4" />} label="Deadline" value={s.deadline} />
              <Info icon={<Users className="h-4 w-4" />} label="Who it's for" value={s.who_for} />
            </div>

            {reqList.length > 0 && (
              <div className="mt-7">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Requirements</h2>
                <ul className="space-y-2">
                  {reqList.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        <Card className="h-fit bg-gradient-card p-6 shadow-elevated">
          <h2 className="font-display text-lg font-semibold">Ready to apply?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll guide you step-by-step and write a tailored essay for this scholarship.
          </p>
          <Button size="lg" className="mt-5 w-full" onClick={() => navigate(`/scholarship/${s.id}/apply`)}>
            {app ? "Continue application" : "Start application"}
          </Button>
          {s.url && (
            <a href={s.url} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Visit official site <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

const Info = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) => (
  <div className="rounded-xl border border-border bg-background/50 p-4">
    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
    <div className="mt-1 text-sm font-medium">{value ?? "—"}</div>
  </div>
);