import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();

  const { error } = await supabase.from("appointments")
    .update({
      date: body.date,
      duration_minutes: body.duration_minutes ?? 30,
      status: body.status ?? 'planned'
    })
    .eq("id", params.id);
  if (error) return new Response(error.message, { status: 400 });
  return new Response("ok");
}
