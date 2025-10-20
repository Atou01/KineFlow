"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import type { InvoiceFormData } from "@/types/invoice";
import toast from "react-hot-toast";

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await fetch("/api/clients");
      const result = await response.json();
      
      if (result.ok || Array.isArray(result)) {
        const clientsData = result.ok ? result.data : result;
        setClients(clientsData);
      } else {
        toast.error("Erreur lors du chargement des clients");
      }
    } catch (error) {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: InvoiceFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success("Facture créée avec succès !");
        router.push(`/app/invoices/${result.data.id}`);
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async (data: InvoiceFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "draft" }),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success("Brouillon sauvegardé !");
        router.push("/app/invoices");
      } else {
        toast.error(result.error || "Erreur lors de la sauvegarde");
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Nouvelle facture
            </h1>
            <p className="text-gray-600 mt-1">
              Créez une nouvelle facture pour vos clients
            </p>
          </div>
        </div>
      </div>

      {/* Alert si pas de clients */}
      {clients.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600">⚠️</div>
            <div>
              <h3 className="font-medium text-yellow-900">Aucun client trouvé</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Vous devez d'abord créer un client avant de pouvoir émettre une facture.
              </p>
              <Link
                href="/app/clients/new"
                className="inline-block mt-2 text-sm font-medium text-yellow-900 underline hover:text-yellow-800"
              >
                Créer un client →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {clients.length > 0 && (
        <InvoiceForm
          clients={clients}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          submitLabel="Créer la facture"
          isLoading={submitting}
        />
      )}
    </div>
  );
}
