import { corsHeaders } from "@supabase/supabase-js/cors";

interface Body {
  scholarship: {
    name: string;
    requirements?: string;
    category?: string;
    amount?: string;
  };
  profile: Record<string, string>;
  answers: Record<string, string>;
  tone: string;
  mode?: "generate" | "improve" | "stronger" | "shorten" | "expand" | "regenerate";
  current?: string;
}

const TONE_GUIDE: Record<string, string> = {
  inspirational: "uplifting, hopeful, emotionally resonant",
  professional: "polished, articulate, confident",
  story: "personal-story driven, vivid scenes, sensory detail",
  bold: "bold, standout, distinctive voice that surprises",
};

const SYSTEM = `You are a world-class scholarship essay coach. You write essays that win.

Rules — non-negotiable:
- 500–750 words unless told otherwise.
- Open with a strong, specific hook (a scene, image, or moment — never a definition or cliché).
- Tell ONE focused personal story. Show, don't tell. Concrete details over generalities.
- Connect the story to the scholarship's mission and the student's future goals.
- Authentic, human voice. No buzzwords ("passionate", "diverse perspective", "make a difference").
- End with a memorable closing line that echoes the hook.
- Output the essay only — no headings, no commentary, no markdown.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const tone = TONE_GUIDE[body.tone] ?? body.tone;
    const mode = body.mode ?? "generate";

    const profileText = Object.entries(body.profile || {})
      .filter(([, v]) => v && String(v).trim())
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    const answersText = Object.entries(body.answers || {})
      .filter(([, v]) => v && String(v).trim())
      .map(([k, v]) => `Q: ${k}\nA: ${v}`)
      .join("\n\n");

    let userPrompt = "";
    if (mode === "generate" || mode === "regenerate") {
      userPrompt = `Write a scholarship essay for: ${body.scholarship.name}
Award: ${body.scholarship.amount ?? "n/a"}
What they look for: ${body.scholarship.requirements ?? "n/a"}
Category: ${body.scholarship.category ?? "n/a"}

Tone: ${tone}

About the student:
${profileText || "(none)"}

The student's answers:
${answersText || "(none)"}

Write the full essay (500–750 words).`;
    } else {
      const instr: Record<string, string> = {
        improve: "Improve this essay — sharpen the hook, deepen the personal story, replace generic lines with specifics, tighten the closing. Same length.",
        stronger: "Make this essay stronger and more memorable. Bolder voice, more vivid details, higher emotional stakes. Same length.",
        shorten: "Tighten this essay to ~450 words. Cut filler, keep the strongest scenes and the hook/closing.",
        expand: "Expand this essay to ~750 words. Add depth to the personal story with one more vivid scene or detail. Don't pad.",
      };
      userPrompt = `${instr[mode] ?? "Improve this essay."}\n\nScholarship: ${body.scholarship.name}\nTone: ${tone}\n\nCurrent essay:\n"""\n${body.current ?? ""}\n"""\n\nReturn the revised essay only.`;
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const essay = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ essay }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});