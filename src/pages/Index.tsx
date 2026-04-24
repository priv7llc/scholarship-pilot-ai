import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowUpRight, Sparkles, Clock, DollarSign, Filter } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AppStatus,
  STATUS_LABEL,
  STATUS_TONE,
  Scholarship,
  fetchScholarships,
} from "@/lib/scholarship";
import { LocalApplication, loadApplications } from "@/lib/localStore";
import { toast } from "sonner";

export default function Index() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [apps, setApps] = useState<LocalApplication[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setApps(loadApplications());
    fetchScholarships()
      .then(setScholarships)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const appByScholarship = useMemo(() => {
    const m = new Map<string, LocalApplication>();
    for (const a of apps) m.set(a.scholarship_id, a);
    return m;
  }, [apps]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    scholarships.forEach((s) => s.category && set.add(s.category));
    return Array.from(set).sort();
  }, [scholarships]);

  const filtered = useMemo(() => {
    return scholarships.filter((s) => {
      if (q && !`${s.name} ${s.requirements} ${s.who_for}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (category !== "all" && s.category !== category) return false;
      if (status !== "all") {
        const st = appByScholarship.get(s.id)?.status ?? "not_started";
        if (st !== status) return false;
      }
      return true;
    });
  }, [scholarships, q, category, status, appByScholarship]);

  const stats = useMemo(() => {
    const total = scholarships.length;
    const inProg = apps.filter((a) => a.status === "in_progress").length;
    const ready = apps.filter((a) => a.status === "essay_generated").length;
    const submitted = apps.filter((a) => a.status === "submitted").length;
    return { total, inProg, ready, submitted };
  }, [scholarships, apps]);

  return (
    <AppLayout>
      {/* Hero / stats */}
      <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-hero p-8 text-primary-foreground shadow-elevated">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> Your Scholarship OS
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
              Find scholarships. <span className="opacity-80">Win more of them.</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm opacity-90">
              Pick a scholarship, answer a few questions, and get a tailored, human-sounding essay in seconds.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Stat label="Total" value={stats.total} />
            <Stat label="In progress" value={stats.inProg} />
            <Stat label="Ready" value={stats.ready} />
            <Stat label="Submitted" value={stats.submitted} />
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search scholarships, requirements…"
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="md:w-56"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABEL) as AppStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => {
            const app = appByScholarship.get(s.id);
            const st: AppStatus = app?.status ?? "not_started";
            return (
              <Card key={s.id} className="group relative flex flex-col gap-4 bg-gradient-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {s.priority && (
                      <Badge variant="secondary" className="mb-2 font-normal">{s.priority}</Badge>
                    )}
                    <h3 className="font-display text-lg font-semibold leading-snug">{s.name}</h3>
                    {s.category && <p className="mt-1 text-xs text-muted-foreground">{s.category}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[st]}`}>
                    {STATUS_LABEL[st]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-foreground"><DollarSign className="h-4 w-4 text-primary" />{s.amount ?? "—"}</div>
                  <div className="flex items-center gap-1.5 text-foreground"><Clock className="h-4 w-4 text-primary" />{s.deadline ?? "—"}</div>
                </div>
                {s.requirements && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{s.requirements}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <Link to={`/scholarship/${s.id}`}>
                    <Button size="sm">View / Apply <ArrowUpRight className="ml-1 h-4 w-4" /></Button>
                  </Link>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline-offset-4 hover:underline">Official site</a>
                  )}
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">No scholarships match your filters.</p>
          )}
        </div>
      )}
    </AppLayout>
  );
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl bg-primary-foreground/10 px-3 py-2 text-center backdrop-blur-sm">
    <div className="font-display text-2xl font-semibold">{value}</div>
    <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
  </div>
);
