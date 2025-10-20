"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const appointmentSchema = z.object({
  client_id: z.string().min(1, "Veuillez sélectionner un client"),
  date: z.string().min(1, "Date requise"),
  time: z.string().min(1, "Heure requise"),
  duration_minutes: z.number().min(15, "Durée minimale : 15 min").max(240, "Durée maximale : 4h"),
  type: z.string().min(1, "Type de séance obligatoire"),
  status: z.enum(["planned", "completed", "cancelled"]),
  notes: z.string().optional().or(z.literal("")),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  initialData?: Partial<AppointmentFormData & { id: string }>;
  appointmentId?: string;
  mode: "create" | "edit";
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

export function AppointmentForm({ initialData, appointmentId, mode }: AppointmentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // Pré-sélection via query params
  const preselectedClientId = searchParams?.get("clientId");
  const preselectedDate = searchParams?.get("date");
  const preselectedTime = searchParams?.get("time");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      client_id: preselectedClientId || initialData?.client_id || "",
      date: preselectedDate || initialData?.date || "",
      time: preselectedTime || initialData?.time || "",
      duration_minutes: initialData?.duration_minutes || 30,
      type: initialData?.type || "",
      status: (initialData?.status as "planned" | "completed" | "cancelled") || "planned",
      notes: initialData?.notes || "",
    },
  });

  // Charger la liste des clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/clients", { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (error) {
        console.error("Erreur chargement clients:", error);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);

    try {
      // Combiner date et heure en ISO string
      const dateTime = `${data.date}T${data.time}:00`;

      const payload = {
        client_id: data.client_id,
        date: dateTime,
        duration_minutes: data.duration_minutes,
        status: data.status,
        type: data.type,
        notes: data.notes || null,
      };

      const url = mode === "create" ? "/api/appointments" : `/api/appointments/${appointmentId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402) {
          toast.error(errorData.error || "Quota atteint. Veuillez upgrader votre plan.");
          router.push("/app/billing");
          return;
        }
        throw new Error(errorData.error || "Erreur lors de l'enregistrement");
      }

      toast.success(
        mode === "create"
          ? "Rendez-vous créé avec succès !"
          : "Rendez-vous mis à jour avec succès !"
      );

      router.push("/app/agenda");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue. Veuillez réessayer.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Informations du rendez-vous
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client */}
          <div className="md:col-span-2">
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
              Client <span className="text-red-500">*</span>
            </label>
            {loadingClients ? (
              <div className="text-sm text-gray-500">Chargement des clients...</div>
            ) : (
              <select
                {...register("client_id")}
                id="client_id"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.client_id ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Sélectionner un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            )}
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              {...register("date")}
              type="date"
              id="date"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.date ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Heure */}
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
              Heure <span className="text-red-500">*</span>
            </label>
            <input
              {...register("time")}
              type="time"
              id="time"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.time ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.time && (
              <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
            )}
          </div>

          {/* Durée */}
          <div>
            <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-2">
              Durée (minutes) <span className="text-red-500">*</span>
            </label>
            <input
              {...register("duration_minutes", { valueAsNumber: true })}
              type="number"
              id="duration_minutes"
              min="15"
              max="240"
              step="15"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.duration_minutes ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="30"
            />
            {errors.duration_minutes && (
              <p className="mt-1 text-sm text-red-600">{errors.duration_minutes.message}</p>
            )}
          </div>

          {/* Type de séance */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type de séance <span className="text-red-500">*</span>
            </label>
            <select
              {...register("type")}
              id="type"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.type ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Sélectionner un type</option>
              <option value="Consultation initiale">Consultation initiale</option>
              <option value="Rééducation">Rééducation</option>
              <option value="Massage">Massage</option>
              <option value="Drainage lymphatique">Drainage lymphatique</option>
              <option value="Suivi">Suivi</option>
              <option value="Autre">Autre</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Statut */}
          {mode === "edit" && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                {...register("status")}
                id="status"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="planned">Planifié</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              {...register("notes")}
              id="notes"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Notes sur la séance, observations..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Enregistrement..." : mode === "create" ? "Créer le RDV" : "Mettre à jour"}
        </button>
      </div>
    </form>
  );
}
