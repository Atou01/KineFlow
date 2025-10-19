import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: client, error } = await supabase
    .from("clients")
    .select("id, workspace_id, first_name, last_name, email, phone, notes, created_at")
    .eq("id", params.id)
    .maybeSingle();
  if (error || !client) return new Response("Not found", { status: 404 });

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, date, duration_minutes, status")
    .eq("client_id", params.id)
    .order("date", { ascending: false });

  return Response.json({ ...client, appointments: appointments || [] });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();

  const { error } = await supabase.from("clients")
    .update({
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      notes: body.notes ?? null
    })
    .eq("id", params.id);
  if (error) return new Response(error.message, { status: 400 });
  return new Response("ok");
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });

  const { error } = await supabase.from("clients")
    .delete()
    .eq("id", params.id);
  if (error) return new Response(error.message, { status: 400 });
  return new Response("ok");
}
