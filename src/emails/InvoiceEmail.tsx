import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import type { Invoice } from '@/types/invoice';
import { formatCurrency } from '@/types/invoice';

interface InvoiceEmailProps {
  invoice: Invoice;
  companyName?: string;
}

export function InvoiceEmail({ invoice, companyName = 'KineFlow' }: InvoiceEmailProps) {
  const previewText = `Facture ${invoice.invoice_number} - ${formatCurrency(invoice.total_cents)}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Heading style={h1}>{companyName}</Heading>
          
          {/* Greeting */}
          <Text style={text}>
            Bonjour {invoice.client?.first_name} {invoice.client?.last_name},
          </Text>
          
          <Text style={text}>
            Veuillez trouver ci-joint votre facture <strong>{invoice.invoice_number}</strong>.
          </Text>

          {/* Invoice Details */}
          <Section style={detailsSection}>
            <table style={detailsTable}>
              <tr>
                <td style={detailsLabel}>Numéro de facture :</td>
                <td style={detailsValue}>{invoice.invoice_number}</td>
              </tr>
              <tr>
                <td style={detailsLabel}>Date d'émission :</td>
                <td style={detailsValue}>
                  {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                </td>
              </tr>
              <tr>
                <td style={detailsLabel}>Date d'échéance :</td>
                <td style={detailsValue}>
                  {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                </td>
              </tr>
              <tr>
                <td style={detailsLabel}>Montant total :</td>
                <td style={{...detailsValue, ...totalAmount}}>
                  {formatCurrency(invoice.total_cents)}
                </td>
              </tr>
            </table>
          </Section>

          {/* Items Summary */}
          <Section style={itemsSection}>
            <Heading as="h2" style={h2}>
              Détails de la facture
            </Heading>
            <table style={itemsTable}>
              <thead>
                <tr style={itemsHeaderRow}>
                  <th style={itemsHeaderCell}>Description</th>
                  <th style={{...itemsHeaderCell, textAlign: 'right'}}>Quantité</th>
                  <th style={{...itemsHeaderCell, textAlign: 'right'}}>Prix unitaire</th>
                  <th style={{...itemsHeaderCell, textAlign: 'right'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => (
                  <tr key={index} style={itemsRow}>
                    <td style={itemsCell}>{item.description}</td>
                    <td style={{...itemsCell, textAlign: 'right'}}>{item.quantity}</td>
                    <td style={{...itemsCell, textAlign: 'right'}}>
                      {formatCurrency(item.unit_price_cents)}
                    </td>
                    <td style={{...itemsCell, textAlign: 'right'}}>
                      {formatCurrency(item.total_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Hr style={hr} />

          {/* Payment Terms */}
          {invoice.terms && (
            <Text style={{...text, fontSize: '14px', color: '#666'}}>
              <strong>Conditions de paiement :</strong> {invoice.terms}
            </Text>
          )}

          {/* Notes */}
          {invoice.notes && (
            <Section style={notesSection}>
              <Text style={{...text, fontSize: '14px', color: '#666'}}>
                <strong>Notes :</strong>
              </Text>
              <Text style={{...text, fontSize: '14px', color: '#666'}}>
                {invoice.notes}
              </Text>
            </Section>
          )}

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            Merci pour votre confiance.
            <br />
            Pour toute question, n'hésitez pas à nous contacter.
          </Text>

          <Text style={{...footer, fontSize: '12px', color: '#999', marginTop: '20px'}}>
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#2563eb',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 30px',
  padding: '0',
  lineHeight: '1.4',
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const detailsSection = {
  margin: '30px 0',
  padding: '20px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
};

const detailsTable = {
  width: '100%',
};

const detailsLabel = {
  color: '#666',
  fontSize: '14px',
  padding: '8px 0',
};

const detailsValue = {
  color: '#333',
  fontSize: '14px',
  fontWeight: '500',
  padding: '8px 0',
  textAlign: 'right' as const,
};

const totalAmount = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#2563eb',
};

const itemsSection = {
  margin: '30px 0',
};

const itemsTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const itemsHeaderRow = {
  borderBottom: '2px solid #e5e7eb',
};

const itemsHeaderCell = {
  color: '#666',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  padding: '12px 8px',
  textAlign: 'left' as const,
};

const itemsRow = {
  borderBottom: '1px solid #f3f4f6',
};

const itemsCell = {
  color: '#333',
  fontSize: '14px',
  padding: '12px 8px',
};

const notesSection = {
  margin: '20px 0',
  padding: '15px',
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  borderLeft: '4px solid #f59e0b',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '30px 0',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
};

export default InvoiceEmail;
