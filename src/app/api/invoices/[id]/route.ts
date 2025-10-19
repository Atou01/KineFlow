import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { paid } = await req.json();

  const { error } = await supabase.from("invoices")
    .update({ paid: !!paid })
    .eq("id", params.id);
  if (error) return new Response(error.message, { status: 400 });
  return new Response("ok");
}
