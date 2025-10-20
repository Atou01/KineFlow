"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Download,
  Send,
  Trash2,
  CheckCircle,
  Clock,
  MoreVertical,
  Printer,
  Copy,
} from "lucide-react";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { formatCurrency } from "@/types/invoice";
import type { Invoice } from "@/types/invoice";
import toast from "react-hot-toast";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadInvoice();
    }
  }, [params.id]);

  const loadInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`);
      const result = await response.json();

      if (result.ok) {
        setInvoice(result.data);
      } else {
        toast.error("Facture introuvable");
        router.push("/app/invoices");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!confirm("Envoyer cette facture par email au client ?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${params.id}/send`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.ok) {
        toast.success("Facture envoyée par email !");
        loadInvoice();
      } else {
        toast.error(result.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      toast.error("Erreur réseau");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm("Marquer cette facture comme payée ?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${params.id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: "cash",
          paid_at: new Date().toISOString(),
        }),
      });
      const result = await response.json();

      if (result.ok) {
        toast.success("Facture marquée comme payée !");
        loadInvoice();
      } else {
        toast.error(result.error || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur réseau");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.ok) {
        toast.success("Facture supprimée");
        router.push("/app/invoices");
      } else {
        toast.error(result.error || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur réseau");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${params.id}/duplicate`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.ok) {
        toast.success("Facture dupliquée !");
        router.push(`/app/invoices/${result.data.id}/edit`);
      } else {
        toast.error(result.error || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur réseau");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Facture introuvable</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/app/invoices"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {invoice.invoice_number}
            </h1>
            <p className="text-gray-600 mt-1">
              {invoice.client?.first_name} {invoice.client?.last_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <InvoiceStatusBadge status={invoice.status} size="lg" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/app/invoices/${invoice.id}/edit`}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Modifier
        </Link>

        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Télécharger PDF
        </a>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimer
        </button>

        {invoice.status === "draft" && (
          <button
            onClick={handleSend}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Envoyer par email
          </button>
        )}

        {invoice.status !== "paid" && invoice.status !== "cancelled" && (
          <button
            onClick={handleMarkAsPaid}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Marquer comme payée
          </button>
        )}

        <button
          onClick={handleDuplicate}
          disabled={actionLoading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Copy className="w-4 h-4" />
          Dupliquer
        </button>

        <button
          onClick={handleDelete}
          disabled={actionLoading}
          className="flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </button>
      </div>

      {/* Détails de la facture */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          {/* En-tête */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Client</h3>
              <p className="font-semibold text-gray-900">
                {invoice.client?.first_name} {invoice.client?.last_name}
              </p>
              {invoice.client?.email && (
                <p className="text-gray-600">{invoice.client.email}</p>
              )}
              {invoice.client?.phone && (
                <p className="text-gray-600">{invoice.client.phone}</p>
              )}
            </div>

            <div className="text-right">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Dates</h3>
              <div className="space-y-1">
                <p className="text-gray-900">
                  <span className="text-gray-600">Émission :</span>{" "}
                  {new Date(invoice.issue_date).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-gray-900">
                  <span className="text-gray-600">Échéance :</span>{" "}
                  {new Date(invoice.due_date).toLocaleDateString("fr-FR")}
                </p>
                {invoice.paid_at && (
                  <p className="text-green-600">
                    <span className="text-gray-600">Payée le :</span>{" "}
                    {new Date(invoice.paid_at).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead className="border-b-2 border-gray-200">
                <tr>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">
                    Description
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-500">
                    Quantité
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-500">
                    Prix unitaire
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-gray-900">{item.description}</td>
                    <td className="py-3 text-right text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right text-gray-600">
                      {formatCurrency(item.unit_price_cents)}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatCurrency(item.total_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total HT</span>
                <span>{formatCurrency(invoice.subtotal_cents)}</span>
              </div>

              {invoice.discount_cents && invoice.discount_cents > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Remise</span>
                  <span>- {formatCurrency(invoice.discount_cents)}</span>
                </div>
              )}

              {invoice.tax_rate > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>TVA ({invoice.tax_rate}%)</span>
                  <span>{formatCurrency(invoice.tax_amount_cents)}</span>
                </div>
              )}

              <div className="flex justify-between text-xl font-bold border-t-2 pt-2">
                <span>Total TTC</span>
                <span className="text-blue-600">
                  {formatCurrency(invoice.total_cents)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Conditions */}
          {invoice.terms && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Conditions de paiement
              </h3>
              <p className="text-gray-700">{invoice.terms}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
