-- Migration: Système de facturation professionnel
-- Date: 2025-01-20
-- Description: Tables invoices, invoice_items, invoice_settings

-- ============================================
-- 1. TABLE: invoices
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  
  -- Numérotation
  invoice_number TEXT NOT NULL,
  
  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  
  -- Montants (en centimes pour éviter les erreurs de précision)
  subtotal_cents BIGINT NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  tax_amount_cents BIGINT NOT NULL DEFAULT 0,
  discount_cents BIGINT DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  
  -- Paiement
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'check', 'other')),
  paid_at TIMESTAMPTZ,
  
  -- Métadonnées
  notes TEXT,
  internal_notes TEXT, -- Notes privées, non visibles sur la facture
  terms TEXT, -- Conditions de paiement
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Contrainte unique sur le numéro de facture par workspace
  CONSTRAINT unique_invoice_number_per_workspace UNIQUE (workspace_id, invoice_number)
);

-- ============================================
-- 2. TABLE: invoice_items
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Détails de l'item
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents >= 0),
  
  -- Calculs
  total_cents BIGINT NOT NULL,
  
  -- Ordre d'affichage
  position INT NOT NULL DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. TABLE: invoice_settings (paramètres par workspace)
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Numérotation
  invoice_prefix TEXT DEFAULT 'FAC',
  invoice_counter INT NOT NULL DEFAULT 1,
  invoice_number_format TEXT DEFAULT '{prefix}-{year}-{counter:04d}', -- FAC-2025-0001
  
  -- Paramètres par défaut
  default_tax_rate DECIMAL(5,2) DEFAULT 0.00,
  default_payment_terms TEXT DEFAULT 'Paiement à réception',
  default_due_days INT DEFAULT 30,
  
  -- Informations cabinet (pour PDF)
  company_name TEXT,
  company_address TEXT,
  company_postal_code TEXT,
  company_city TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_siret TEXT,
  company_rpps TEXT,
  company_logo_url TEXT,
  
  -- Mentions légales
  legal_mentions TEXT DEFAULT 'TVA non applicable, art. 293 B du CGI',
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. INDEXES pour performance
-- ============================================
CREATE INDEX idx_invoices_workspace ON invoices(workspace_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_position ON invoice_items(invoice_id, position);

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Fonction pour générer le prochain numéro de facture
CREATE OR REPLACE FUNCTION generate_invoice_number(p_workspace_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_settings RECORD;
  v_number TEXT;
  v_year TEXT;
  v_counter TEXT;
BEGIN
  -- Récupérer les paramètres
  SELECT * INTO v_settings
  FROM invoice_settings
  WHERE workspace_id = p_workspace_id;
  
  -- Si pas de paramètres, créer avec valeurs par défaut
  IF NOT FOUND THEN
    INSERT INTO invoice_settings (workspace_id)
    VALUES (p_workspace_id)
    RETURNING * INTO v_settings;
  END IF;
  
  -- Générer le numéro
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_counter := LPAD(v_settings.invoice_counter::TEXT, 4, '0');
  
  v_number := REPLACE(v_settings.invoice_number_format, '{prefix}', v_settings.invoice_prefix);
  v_number := REPLACE(v_number, '{year}', v_year);
  v_number := REPLACE(v_number, '{counter:04d}', v_counter);
  
  -- Incrémenter le compteur
  UPDATE invoice_settings
  SET invoice_counter = invoice_counter + 1,
      updated_at = NOW()
  WHERE workspace_id = p_workspace_id;
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le total d'une facture
CREATE OR REPLACE FUNCTION calculate_invoice_total(p_invoice_id UUID)
RETURNS void AS $$
DECLARE
  v_subtotal BIGINT;
  v_tax_rate DECIMAL(5,2);
  v_tax_amount BIGINT;
  v_discount BIGINT;
  v_total BIGINT;
BEGIN
  -- Récupérer le sous-total des items
  SELECT COALESCE(SUM(total_cents), 0)
  INTO v_subtotal
  FROM invoice_items
  WHERE invoice_id = p_invoice_id;
  
  -- Récupérer le taux de taxe et la remise
  SELECT tax_rate, COALESCE(discount_cents, 0)
  INTO v_tax_rate, v_discount
  FROM invoices
  WHERE id = p_invoice_id;
  
  -- Calculer la taxe
  v_tax_amount := FLOOR((v_subtotal - v_discount) * v_tax_rate / 100);
  
  -- Calculer le total
  v_total := v_subtotal - v_discount + v_tax_amount;
  
  -- Mettre à jour la facture
  UPDATE invoices
  SET subtotal_cents = v_subtotal,
      tax_amount_cents = v_tax_amount,
      total_cents = v_total,
      updated_at = NOW()
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_settings_updated_at
  BEFORE UPDATE ON invoice_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour recalculer le total après modification des items
CREATE OR REPLACE FUNCTION recalculate_invoice_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_invoice_total(OLD.invoice_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_invoice_total(NEW.invoice_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_invoice_after_item_insert
  AFTER INSERT ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_invoice_on_item_change();

CREATE TRIGGER recalculate_invoice_after_item_update
  AFTER UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_invoice_on_item_change();

CREATE TRIGGER recalculate_invoice_after_item_delete
  AFTER DELETE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_invoice_on_item_change();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent gérer les factures de leur workspace
CREATE POLICY "Users can manage workspace invoices"
  ON invoices FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent gérer les items de factures de leur workspace
CREATE POLICY "Users can manage workspace invoice items"
  ON invoice_items FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE workspace_id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Les utilisateurs peuvent gérer les paramètres de leur workspace
CREATE POLICY "Users can manage workspace invoice settings"
  ON invoice_settings FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 8. COMMENTAIRES
-- ============================================

COMMENT ON TABLE invoices IS 'Factures émises par les praticiens';
COMMENT ON TABLE invoice_items IS 'Lignes de facturation (prestations)';
COMMENT ON TABLE invoice_settings IS 'Paramètres de facturation par workspace';

COMMENT ON COLUMN invoices.subtotal_cents IS 'Sous-total en centimes (avant taxe et remise)';
COMMENT ON COLUMN invoices.total_cents IS 'Total TTC en centimes';
COMMENT ON COLUMN invoices.status IS 'draft=brouillon, sent=envoyée, paid=payée, overdue=en retard, cancelled=annulée';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
