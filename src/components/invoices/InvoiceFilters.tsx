"use client";

import { useState } from "react";
import { Search, Filter, X, Calendar } from "lucide-react";
import type { InvoiceStatus } from "@/types/invoice";

interface InvoiceFiltersProps {
  onFilterChange: (filters: InvoiceFilterState) => void;
}

export interface InvoiceFilterState {
  search: string;
  status?: InvoiceStatus;
  fromDate?: string;
  toDate?: string;
  clientId?: string;
}

export function InvoiceFilters({ onFilterChange }: InvoiceFiltersProps) {
  const [filters, setFilters] = useState<InvoiceFilterState>({
    search: "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (key: keyof InvoiceFilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: InvoiceFilterState = { search: "" };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setShowAdvanced(false);
  };

  const hasActiveFilters = filters.status || filters.fromDate || filters.toDate || filters.clientId;

  return (
    <div className="space-y-4">
      {/* Barre de recherche principale */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro, client..."
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors
            ${showAdvanced || hasActiveFilters
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }
          `}
        >
          <Filter className="w-5 h-5" />
          Filtres
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {[filters.status, filters.fromDate, filters.toDate, filters.clientId].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Filtres avancés */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) => handleChange("status", e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyée</option>
              <option value="paid">Payée</option>
              <option value="overdue">En retard</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>

          {/* Date de début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date de début
            </label>
            <input
              type="date"
              value={filters.fromDate || ""}
              onChange={(e) => handleChange("fromDate", e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date de fin
            </label>
            <input
              type="date"
              value={filters.toDate || ""}
              onChange={(e) => handleChange("toDate", e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Filtres rapides (chips) */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Brouillons", status: "draft" as InvoiceStatus },
          { label: "Envoyées", status: "sent" as InvoiceStatus },
          { label: "Payées", status: "paid" as InvoiceStatus },
          { label: "En retard", status: "overdue" as InvoiceStatus },
        ].map((chip) => (
          <button
            key={chip.status}
            onClick={() => handleChange("status", filters.status === chip.status ? undefined : chip.status)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filters.status === chip.status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
