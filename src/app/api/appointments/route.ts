import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { enforceQuota } from "@/lib/billing";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: wm } = await supabase.from("workspace_members")
    .select("workspace_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!wm) return new Response("No workspace", { status: 400 });

  const { data, error } = await supabase.from("appointments")
    .select("id, client_id, date, duration_minutes, status")
    .eq("workspace_id", wm.workspace_id)
    .order("date", { ascending: true });
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

  const { data, error } = await supabase.from("appointments").insert({
    workspace_id: wm.workspace_id,
    client_id: body.client_id,
    date: body.date,
    duration_minutes: body.duration_minutes ?? 30,
    status: body.status ?? 'planned'
  }).select("id").maybeSingle();
  if (error) return new Response(error.message, { status: 400 });
  return Response.json(data);
}
