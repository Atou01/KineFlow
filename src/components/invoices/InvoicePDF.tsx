import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { Invoice } from '@/types/invoice';
import { formatCurrency } from '@/types/invoice';

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '48%',
  },
  label: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    color: '#111827',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCol1: {
    width: '50%',
  },
  tableCol2: {
    width: '15%',
    textAlign: 'right',
  },
  tableCol3: {
    width: '20%',
    textAlign: 'right',
  },
  tableCol4: {
    width: '15%',
    textAlign: 'right',
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  tableCellText: {
    fontSize: 10,
    color: '#111827',
  },
  totals: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 10,
    color: '#111827',
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginTop: 8,
  },
  totalFinalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalFinalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#374151',
  },
  notesText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
  companyInfo?: {
    name?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    siret?: string;
    rpps?: string;
  };
}

export function InvoicePDF({ invoice, companyInfo }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              {companyInfo?.name || 'KineFlow'}
            </Text>
            {companyInfo?.address && (
              <Text style={styles.value}>{companyInfo.address}</Text>
            )}
            {companyInfo?.city && (
              <Text style={styles.value}>{companyInfo.city}</Text>
            )}
            {companyInfo?.phone && (
              <Text style={styles.value}>Tél: {companyInfo.phone}</Text>
            )}
            {companyInfo?.email && (
              <Text style={styles.value}>Email: {companyInfo.email}</Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceNumber}>
              {invoice.invoice_number}
            </Text>
            <Text style={styles.label}>Date d'émission</Text>
            <Text style={styles.value}>
              {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
            </Text>
            <Text style={[styles.label, { marginTop: 5 }]}>Date d'échéance</Text>
            <Text style={styles.value}>
              {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facturé à</Text>
          <Text style={styles.value}>
            {invoice.client?.first_name} {invoice.client?.last_name}
          </Text>
          {invoice.client?.email && (
            <Text style={styles.value}>{invoice.client.email}</Text>
          )}
          {invoice.client?.phone && (
            <Text style={styles.value}>{invoice.client.phone}</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableCol1]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableCol2]}>
              Quantité
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableCol3]}>
              Prix unitaire
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableCol4]}>
              Total
            </Text>
          </View>
          {invoice.items?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCellText, styles.tableCol1]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCellText, styles.tableCol2]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCellText, styles.tableCol3]}>
                {formatCurrency(item.unit_price_cents)}
              </Text>
              <Text style={[styles.tableCellText, styles.tableCol4]}>
                {formatCurrency(item.total_cents)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal_cents)}
            </Text>
          </View>

          {invoice.discount_cents && invoice.discount_cents > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#10b981' }]}>
                Remise
              </Text>
              <Text style={[styles.totalValue, { color: '#10b981' }]}>
                - {formatCurrency(invoice.discount_cents)}
              </Text>
            </View>
          )}

          {invoice.tax_rate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                TVA ({invoice.tax_rate}%)
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.tax_amount_cents)}
              </Text>
            </View>
          )}

          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalLabel}>Total TTC</Text>
            <Text style={styles.totalFinalValue}>
              {formatCurrency(invoice.total_cents)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {invoice.terms && (
          <View style={[styles.notes, { marginTop: 10 }]}>
            <Text style={styles.notesTitle}>Conditions de paiement</Text>
            <Text style={styles.notesText}>{invoice.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {companyInfo?.siret && (
            <Text>SIRET: {companyInfo.siret}</Text>
          )}
          {companyInfo?.rpps && (
            <Text>N° RPPS: {companyInfo.rpps}</Text>
          )}
          <Text style={{ marginTop: 5 }}>
            TVA non applicable, art. 293 B du CGI
          </Text>
        </View>
      </Page>
    </Document>
  );
}
