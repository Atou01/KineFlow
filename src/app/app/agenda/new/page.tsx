"use client";

import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewAppointmentPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Nouveau rendez-vous</h1>
          <p className="text-gray-600 mt-1">Planifier un nouveau rendez-vous</p>
        </div>
      </div>

      {/* Form */}
      <AppointmentForm mode="create" />
    </div>
  );
}
