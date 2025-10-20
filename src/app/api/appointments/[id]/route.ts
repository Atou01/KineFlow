import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, client_id, start_time, end_time, status, title, notes, created_at")
    .eq("id", params.id)
    .maybeSingle();
  
  if (error || !appointment) return new Response("Not found", { status: 404 });
  
  // Calculer duration_minutes et extraire date/time pour le frontend
  const start = new Date(appointment.start_time);
  const end = new Date(appointment.end_time);
  const duration_minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  
  return Response.json({
    ...appointment,
    duration_minutes,
    type: appointment.title,
    date: appointment.start_time
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();

  const update: any = {
    client_id: body.client_id,
    title: body.type,
    status: body.status,
    notes: body.notes,
  };

  // Calculer start_time et end_time si date/time fournis
  if (body.date && body.time) {
    const start_time = `${body.date}T${body.time}:00`;
    const duration = Number(body.duration_minutes || 30);
    update.start_time = start_time;
    update.end_time = new Date(new Date(start_time).getTime() + duration * 60000).toISOString();
  }

  const { error } = await supabase.from("appointments")
    .update(update)
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
