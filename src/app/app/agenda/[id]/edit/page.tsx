"use client";

import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditAppointmentPage() {
  const params = useParams();
  const appointmentId = params.id as string;
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const res = await fetch(`/api/appointments/${appointmentId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          
          // Extraire date et heure du timestamp ISO
          const dateObj = new Date(data.date);
          const date = dateObj.toISOString().split('T')[0];
          const time = dateObj.toTimeString().slice(0, 5);
          
          setAppointment({
            ...data,
            date,
            time,
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement du rendez-vous:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center text-red-600 p-8">
        Rendez-vous non trouvé
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/app/agenda"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier le rendez-vous</h1>
          <p className="text-gray-600 mt-1">
            {new Date(appointment.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Form */}
      <AppointmentForm 
        mode="edit" 
        appointmentId={appointmentId}
        initialData={appointment}
      />
    </div>
  );
}
