import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Invoice, InvoiceFormData, InvoiceItem } from "@/types/invoice";
import { eurosToCents } from "@/types/invoice";
import { DatabaseError, NotFoundError } from "@/lib/errors/AppError";

/**
 * Génère le prochain numéro de facture
 */
export async function generateInvoiceNumber(workspaceId: string): Promise<string> {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data, error } = await supabase
    .rpc('generate_invoice_number', { p_workspace_id: workspaceId });
  
  if (error) {
    throw new DatabaseError("Erreur lors de la génération du numéro de facture", { error });
  }
  
  return data as string;
}

/**
 * Calcule le total d'une facture
 */
export function calculateInvoiceTotal(
  items: { quantity: number; unit_price: number }[],
  taxRate: number,
  discountCents: number = 0
): {
  subtotalCents: number;
  taxAmountCents: number;
  totalCents: number;
} {
  // Calculer le sous-total
  const subtotalCents = items.reduce((sum, item) => {
    return sum + eurosToCents(item.quantity * item.unit_price);
  }, 0);
  
  // Appliquer la remise
  const subtotalAfterDiscount = subtotalCents - discountCents;
  
  // Calculer la taxe
  const taxAmountCents = Math.floor(subtotalAfterDiscount * (taxRate / 100));
  
  // Calculer le total
  const totalCents = subtotalAfterDiscount + taxAmountCents;
  
  return {
    subtotalCents,
    taxAmountCents,
    totalCents,
  };
}

/**
 * Calcule la date d'échéance
 */
export function calculateDueDate(issueDate: string, dueDays: number): string {
  const date = new Date(issueDate);
  date.setDate(date.getDate() + dueDays);
  return date.toISOString().split('T')[0];
}

/**
 * Récupère les paramètres de facturation du workspace
 */
export async function getInvoiceSettings(workspaceId: string) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data, error } = await supabase
    .from('invoice_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw new DatabaseError("Erreur lors de la récupération des paramètres", { error });
  }
  
  // Si pas de paramètres, créer avec valeurs par défaut
  if (!data) {
    const { data: newSettings, error: createError } = await supabase
      .from('invoice_settings')
      .insert({ workspace_id: workspaceId })
      .select()
      .single();
    
    if (createError) {
      throw new DatabaseError("Erreur lors de la création des paramètres", { error: createError });
    }
    
    return newSettings;
  }
  
  return data;
}

/**
 * Vérifie si une facture appartient au workspace de l'utilisateur
 */
export async function verifyInvoiceAccess(invoiceId: string, workspaceId: string): Promise<void> {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data, error } = await supabase
    .from('invoices')
    .select('id')
    .eq('id', invoiceId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  
  if (error) {
    throw new DatabaseError("Erreur lors de la vérification d'accès", { error });
  }
  
  if (!data) {
    throw new NotFoundError("Facture");
  }
}

/**
 * Marque une facture comme envoyée
 */
export async function markInvoiceAsSent(invoiceId: string): Promise<void> {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', invoiceId);
  
  if (error) {
    throw new DatabaseError("Erreur lors de la mise à jour du statut", { error });
  }
}

/**
 * Marque une facture comme payée
 */
export async function markInvoiceAsPaid(
  invoiceId: string,
  paymentMethod: string,
  paidAt?: string
): Promise<void> {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      payment_method: paymentMethod,
      paid_at: paidAt || new Date().toISOString(),
    })
    .eq('id', invoiceId);
  
  if (error) {
    throw new DatabaseError("Erreur lors de l'enregistrement du paiement", { error });
  }
}
