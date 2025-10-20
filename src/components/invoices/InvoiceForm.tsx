"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Calculator, Save, Send } from "lucide-react";
import { formatCurrency, eurosToCents, centsToEuros } from "@/types/invoice";
import type { InvoiceFormData } from "@/types/invoice";
import toast from "react-hot-toast";

// Schema de validation
const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description requise"),
  quantity: z.number().positive("Quantité doit être > 0"),
  unit_price: z.number().nonnegative("Prix doit être ≥ 0"),
});

const invoiceSchema = z.object({
  client_id: z.string().uuid("Client requis"),
  issue_date: z.string().min(1, "Date d'émission requise"),
  due_date: z.string().min(1, "Date d'échéance requise"),
  tax_rate: z.number().min(0).max(100, "TVA entre 0 et 100%"),
  discount_cents: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Au moins un item requis"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormValues>;
  clients: Array<{ id: string; first_name: string; last_name: string }>;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onSaveDraft?: (data: InvoiceFormData) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

export function InvoiceForm({
  initialData,
  clients,
  onSubmit,
  onSaveDraft,
  submitLabel = "Créer la facture",
  isLoading = false,
}: InvoiceFormProps) {
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: initialData?.client_id || "",
      issue_date: initialData?.issue_date || new Date().toISOString().split("T")[0],
      due_date: initialData?.due_date || "",
      tax_rate: initialData?.tax_rate || 0,
      discount_cents: initialData?.discount_cents || 0,
      notes: initialData?.notes || "",
      internal_notes: initialData?.internal_notes || "",
      terms: initialData?.terms || "Paiement à réception",
      items: initialData?.items || [
        { description: "", quantity: 1, unit_price: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch pour calculs automatiques
  const watchItems = watch("items");
  const watchTaxRate = watch("tax_rate");
  const watchDiscountCents = watch("discount_cents");
  const watchIssueDate = watch("issue_date");

  // Calculs automatiques
  useEffect(() => {
    const items = watchItems || [];
    
    // Sous-total
    const subtotalEuros = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      return sum + qty * price;
    }, 0);
    
    const subtotalCents = eurosToCents(subtotalEuros);
    setSubtotal(subtotalCents);
    
    // Remise
    const discountCents = Number(watchDiscountCents) || 0;
    
    // Taxe
    const taxRate = Number(watchTaxRate) || 0;
    const subtotalAfterDiscount = subtotalCents - discountCents;
    const taxAmountCents = Math.floor(subtotalAfterDiscount * (taxRate / 100));
    setTaxAmount(taxAmountCents);
    
    // Total
    const totalCents = subtotalAfterDiscount + taxAmountCents;
    setTotal(totalCents);
  }, [watchItems, watchTaxRate, watchDiscountCents]);

  // Auto-calculer date d'échéance (30 jours par défaut)
  useEffect(() => {
    if (watchIssueDate && !initialData?.due_date) {
      const issueDate = new Date(watchIssueDate);
      issueDate.setDate(issueDate.getDate() + 30);
      setValue("due_date", issueDate.toISOString().split("T")[0]);
    }
  }, [watchIssueDate, setValue, initialData]);

  const handleFormSubmit = async (data: InvoiceFormValues) => {
    try {
      await onSubmit(data as InvoiceFormData);
    } catch (error) {
      toast.error("Erreur lors de la création de la facture");
    }
  };

  const handleSaveDraft = async () => {
    const data = watch();
    try {
      if (onSaveDraft) {
        await onSaveDraft(data as InvoiceFormData);
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde du brouillon");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Section Client & Dates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Informations générales
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client *
            </label>
            <select
              {...register("client_id")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner un client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="text-red-600 text-sm mt-1">{errors.client_id.message}</p>
            )}
          </div>

          {/* Date d'émission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date d'émission *
            </label>
            <input
              type="date"
              {...register("issue_date")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.issue_date && (
              <p className="text-red-600 text-sm mt-1">{errors.issue_date.message}</p>
            )}
          </div>

          {/* Date d'échéance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date d'échéance *
            </label>
            <input
              type="date"
              {...register("due_date")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.due_date && (
              <p className="text-red-600 text-sm mt-1">{errors.due_date.message}</p>
            )}
          </div>

          {/* Taux de TVA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taux de TVA (%)
            </label>
            <input
              type="number"
              step="0.01"
              {...register("tax_rate", { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.tax_rate && (
              <p className="text-red-600 text-sm mt-1">{errors.tax_rate.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Prestations / Articles
          </h2>
          <button
            type="button"
            onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                  Quantité
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                  Prix unitaire
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                  Total
                </th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fields.map((field, index) => {
                const quantity = Number(watch(`items.${index}.quantity`)) || 0;
                const unitPrice = Number(watch(`items.${index}.unit_price`)) || 0;
                const itemTotal = quantity * unitPrice;

                return (
                  <tr key={field.id}>
                    <td className="px-4 py-3">
                      <input
                        {...register(`items.${index}.description`)}
                        placeholder="Description de la prestation"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.items[index]?.description?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {itemTotal.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {errors.items && (
          <p className="text-red-600 text-sm mt-2">
            {typeof errors.items === 'object' && 'message' in errors.items 
              ? errors.items.message 
              : "Vérifiez les items"}
          </p>
        )}
      </div>

      {/* Section Calculs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Totaux</h2>
        </div>

        <div className="space-y-3 max-w-md ml-auto">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Sous-total HT</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          {watchDiscountCents && watchDiscountCents > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Remise</span>
              <span>- {formatCurrency(watchDiscountCents)}</span>
            </div>
          )}

          {watchTaxRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TVA ({watchTaxRate}%)</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold border-t pt-3">
            <span>Total TTC</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Section Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Notes et conditions
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (visibles sur la facture)
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="Notes pour le client..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes internes (privées)
            </label>
            <textarea
              {...register("internal_notes")}
              rows={2}
              placeholder="Notes privées, non visibles sur la facture..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conditions de paiement
            </label>
            <input
              {...register("terms")}
              placeholder="Ex: Paiement à réception"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onSaveDraft && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Sauvegarder brouillon
          </button>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
          {isLoading ? "Création..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
