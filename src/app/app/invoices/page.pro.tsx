"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Send, 
  MoreVertical,
  TrendingUp,
  DollarSign,
  FileText,
  AlertCircle,
} from "lucide-react";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { InvoiceFilters, type InvoiceFilterState } from "@/components/invoices/InvoiceFilters";
import { formatCurrency } from "@/types/invoice";
import type { Invoice } from "@/types/invoice";
import toast from "react-hot-toast";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InvoiceFilterState>({ search: "" });
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalRevenue: 0,
  });

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.fromDate) params.append('from_date', filters.fromDate);
      if (filters.toDate) params.append('to_date', filters.toDate);
      if (filters.clientId) params.append('client_id', filters.clientId);

      const response = await fetch(`/api/invoices?${params.toString()}`, {
        cache: 'no-store',
      });
      const result = await response.json();

      if (result.ok) {
        setInvoices(result.data);
        calculateStats(result.data);
      } else {
        toast.error(result.error || "Erreur lors du chargement");
      }
    } catch (error) {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const calculateStats = (data: Invoice[]) => {
    const stats = data.reduce(
      (acc, inv) => {
        acc.total++;
        if (inv.status === 'paid') {
          acc.paid++;
          acc.totalRevenue += inv.total_cents;
        } else if (inv.status === 'overdue') {
          acc.overdue++;
        } else if (inv.status === 'sent') {
          acc.pending++;
        }
        return acc;
      },
      { total: 0, paid: 0, pending: 0, overdue: 0, totalRevenue: 0 }
    );
    setStats(stats);
  };

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.ok) {
        toast.success("Facture supprimée");
        loadInvoices();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSend = async (id: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}/send`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.ok) {
        toast.success("Facture envoyée par email");
        loadInvoices();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Factures</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos factures et suivez vos paiements
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/api/export/invoices.csv'}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Exporter
          </button>
          <Link
            href="/app/invoices/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle facture
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total factures"
          value={stats.total.toString()}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Revenus"
          value={formatCurrency(stats.totalRevenue)}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Payées"
          value={stats.paid.toString()}
          color="green"
        />
        <StatCard
          icon={AlertCircle}
          label="En retard"
          value={stats.overdue.toString()}
          color="red"
        />
      </div>

      {/* Filters */}
      <InvoiceFilters onFilterChange={setFilters} />

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Échéance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Aucune facture</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Créez votre première facture pour commencer
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.client?.first_name} {invoice.client?.last_name}
                      </div>
                      {invoice.client?.email && (
                        <div className="text-sm text-gray-500">
                          {invoice.client.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.total_cents)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/app/invoices/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/app/invoices/${invoice.id}/edit`}
                          className="text-gray-600 hover:text-gray-900"
                          title="Éditer"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => handleSend(invoice.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Envoyer"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Composant StatCard
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'red' | 'gray';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
