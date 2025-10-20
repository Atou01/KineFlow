import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { enforceQuota } from "@/lib/billing";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: wm } = await supabase.from("workspace_members")
    .select("workspace_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!wm) return new Response("No workspace", { status: 400 });

  const { data, error } = await supabase.from("appointments")
    .select("id, client_id, start_time, end_time, status, title")
    .eq("workspace_id", wm.workspace_id)
    .order("start_time", { ascending: true });
  if (error) return new Response(error.message, { status: 400 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const quota = await enforceQuota("appointments", "date");
  if (!quota.allowed) {
    return Response.json(
      { error: quota.reason, upgrade_url: "/app/billing" },
      { status: 402 } // Payment Required
    );
  }

  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: wm } = await supabase.from("workspace_members")
    .select("workspace_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!wm) return new Response("No workspace", { status: 400 });

  // Calculer start_time et end_time à partir de date + time
  const start_time = `${body.date}T${body.time}:00`;
  const duration = Number(body.duration_minutes || 30);
  const end_time = new Date(new Date(start_time).getTime() + duration * 60000).toISOString();

  const { data, error } = await supabase.from("appointments").insert({
    workspace_id: wm.workspace_id,
    client_id: body.client_id,
    start_time,
    end_time,
    status: body.status ?? 'planned',
    title: body.type ?? 'Consultation',
    notes: body.notes ?? null
  }).select("id").maybeSingle();
  if (error) return new Response(error.message, { status: 400 });
  return Response.json(data);
}
