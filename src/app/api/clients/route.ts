import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: wm } = await supabase.from("workspace_members")
    .select("workspace_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!wm) return new Response("No workspace", { status: 400 });

  const { data, error } = await supabase.from("clients")
    .select("id, first_name, last_name, email, phone, created_at")
    .eq("workspace_id", wm.workspace_id)
    .order("created_at", { ascending: false });
  if (error) return new Response(error.message, { status: 400 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: wm } = await supabase.from("workspace_members")
    .select("workspace_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!wm) return new Response("No workspace", { status: 400 });

  const { data, error } = await supabase.from("clients").insert({
    workspace_id: wm.workspace_id,
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email ?? null,
    phone: body.phone ?? null,
    notes: body.notes ?? null
  }).select("id").maybeSingle();
  if (error) return new Response(error.message, { status: 400 });
  return Response.json(data);
}
