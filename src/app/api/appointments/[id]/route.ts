import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, client_id, date, duration_minutes, status, type, notes, created_at")
    .eq("id", params.id)
    .maybeSingle();
  
  if (error || !appointment) return new Response("Not found", { status: 404 });
  return Response.json(appointment);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();

  const { error } = await supabase.from("appointments")
    .update({
      client_id: body.client_id,
      date: body.date,
      duration_minutes: body.duration_minutes ?? 30,
      status: body.status ?? 'planned',
      type: body.type ?? null,
      notes: body.notes ?? null
    })
    .eq("id", params.id);
  if (error) return new Response(error.message, { status: 400 });
  return Response.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });

  const { error } = await supabase.from("appointments")
    .delete()
    .eq("id", params.id);
  
  if (error) return new Response(error.message, { status: 400 });
  return Response.json({ success: true });
}
