import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { withApiHandler } from "@/lib/api/apiHandler";
import { 
  AuthenticationError, 
  DatabaseError,
  ValidationError 
} from "@/lib/errors/AppError";

export const dynamic = 'force-dynamic';

// GET /api/clients
export const GET = withApiHandler(async (req: NextRequest) => {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new AuthenticationError();
  }

  // Get workspace
  const { data: wm, error: wmError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (wmError) {
    throw new DatabaseError("Erreur lors de la récupération du workspace", { error: wmError });
  }
  
  if (!wm) {
    throw new ValidationError("Aucun workspace trouvé pour cet utilisateur");
  }

  // Fetch clients
  const { data, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, email, phone, created_at")
    .eq("workspace_id", wm.workspace_id)
    .order("created_at", { ascending: false });
    
  if (error) {
    throw new DatabaseError("Erreur lors de la récupération des clients", { error });
  }

  return data || [];
});

// POST /api/clients
export const POST = withApiHandler(async (req: NextRequest) => {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();

  // Validation
  if (!body.first_name || !body.last_name) {
    throw new ValidationError("Le prénom et le nom sont obligatoires");
  }

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new AuthenticationError();
  }

  // Get workspace
  const { data: wm, error: wmError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (wmError) {
    throw new DatabaseError("Erreur lors de la récupération du workspace", { error: wmError });
  }
  
  if (!wm) {
    throw new ValidationError("Aucun workspace trouvé pour cet utilisateur");
  }

  // Insert client
  const { data, error } = await supabase
    .from("clients")
    .insert({
      workspace_id: wm.workspace_id,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email ?? null,
      phone: body.phone ?? null,
    })
    .select("id, first_name, last_name, email, phone, created_at")
    .maybeSingle();
    
  if (error) {
    throw new DatabaseError("Erreur lors de la création du client", { error });
  }

  return data;
});
