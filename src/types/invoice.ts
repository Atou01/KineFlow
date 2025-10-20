// Types pour le système de facturation

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'other';

export interface Invoice {
  id: string;
  workspace_id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  
  // Montants (en centimes)
  subtotal_cents: number;
  tax_rate: number;
  tax_amount_cents: number;
  discount_cents?: number;
  total_cents: number;
  
  // Paiement
  payment_method?: PaymentMethod;
  paid_at?: string;
  
  // Métadonnées
  notes?: string;
  internal_notes?: string;
  terms?: string;
  
  // Tracking
  sent_at?: string;
  viewed_at?: string;
  reminder_sent_at?: string;
  
  // Audit
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relations (populated via joins)
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  position: number;
  created_at: string;
}

export interface InvoiceSettings {
  id: string;
  workspace_id: string;
  
  // Numérotation
  invoice_prefix: string;
  invoice_counter: number;
  invoice_number_format: string;
  
  // Paramètres par défaut
  default_tax_rate: number;
  default_payment_terms: string;
  default_due_days: number;
  
  // Informations cabinet
  company_name?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_phone?: string;
  company_email?: string;
  company_siret?: string;
  company_rpps?: string;
  company_logo_url?: string;
  
  // Mentions légales
  legal_mentions: string;
  
  // Audit
  created_at: string;
  updated_at: string;
}

// Types pour les formulaires
export interface InvoiceFormData {
  client_id: string;
  issue_date: string;
  due_date: string;
  tax_rate: number;
  discount_cents?: number;
  notes?: string;
  internal_notes?: string;
  terms?: string;
  items: InvoiceItemFormData[];
}

export interface InvoiceItemFormData {
  description: string;
  quantity: number;
  unit_price: number; // En euros (converti en centimes côté API)
}

// Types pour les statistiques
export interface InvoiceStats {
  total_invoices: number;
  total_revenue_cents: number;
  paid_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
  average_invoice_cents: number;
  revenue_by_month: {
    month: string;
    revenue_cents: number;
  }[];
}

// Helpers pour conversion euros <-> centimes
export const eurosToCents = (euros: number): number => Math.round(euros * 100);
export const centsToEuros = (cents: number): number => cents / 100;

// Helper pour formater les montants
export const formatCurrency = (cents: number, locale = 'fr-FR'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(centsToEuros(cents));
};

// Helper pour calculer le statut
export const getInvoiceStatus = (invoice: Invoice): InvoiceStatus => {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
    return invoice.status;
  }
  
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  
  if (invoice.status === 'sent' && dueDate < today) {
    return 'overdue';
  }
  
  return invoice.status;
};

// Helper pour obtenir la couleur du statut
export const getStatusColor = (status: InvoiceStatus): string => {
  const colors: Record<InvoiceStatus, string> = {
    draft: 'gray',
    sent: 'blue',
    paid: 'green',
    overdue: 'red',
    cancelled: 'gray',
  };
  return colors[status];
};

// Helper pour obtenir le label du statut
export const getStatusLabel = (status: InvoiceStatus): string => {
  const labels: Record<InvoiceStatus, string> = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée',
  };
  return labels[status];
};
