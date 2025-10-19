import { getCurrentWorkspaceBilling } from "@/lib/billing";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const b = await getCurrentWorkspaceBilling();
    return Response.json(b);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
}
