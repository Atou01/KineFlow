"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import type { InvoiceFormData, Invoice } from "@/types/invoice";
import { centsToEuros } from "@/types/invoice";
import toast from "react-hot-toast";

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([loadInvoice(), loadClients()]);
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
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch("/api/clients");
      const result = await response.json();
      
      if (result.ok || Array.isArray(result)) {
        const clientsData = result.ok ? result.data : result;
        setClients(clientsData);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: InvoiceFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success("Facture mise à jour !");
        router.push(`/app/invoices/${params.id}`);
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur réseau");
    } finally {
      setSubmitting(false);
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

  // Préparer les données initiales pour le formulaire
  const initialData = {
    client_id: invoice.client_id,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    tax_rate: invoice.tax_rate,
    discount_cents: invoice.discount_cents,
    notes: invoice.notes,
    internal_notes: invoice.internal_notes,
    terms: invoice.terms,
    items: invoice.items?.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: centsToEuros(item.unit_price_cents),
    })) || [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/app/invoices/${params.id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Modifier {invoice.invoice_number}
            </h1>
            <p className="text-gray-600 mt-1">
              Modifiez les informations de la facture
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <InvoiceForm
        initialData={initialData}
        clients={clients}
        onSubmit={handleSubmit}
        submitLabel="Enregistrer les modifications"
        isLoading={submitting}
      />
    </div>
  );
}
