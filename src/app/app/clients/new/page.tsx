"use client";

import { ClientForm } from "@/components/forms/ClientForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/app/clients"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau client</h1>
          <p className="text-gray-600 mt-1">Créer une nouvelle fiche client</p>
        </div>
      </div>

      {/* Form */}
      <ClientForm mode="create" />
    </div>
  );
}
