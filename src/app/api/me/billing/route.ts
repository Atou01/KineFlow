import { getCurrentWorkspaceBilling } from "@/lib/billing";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const b = await getCurrentWorkspaceBilling();
    return Response.json(b, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
}
