"use client";

import { ClientForm } from "@/components/forms/ClientForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditClientPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setClient(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du client:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center text-red-600 p-8">
        Client non trouvé
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/app/clients/${clientId}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier le client</h1>
          <p className="text-gray-600 mt-1">{client.first_name} {client.last_name}</p>
        </div>
      </div>

      {/* Form */}
      <ClientForm 
        mode="edit" 
        clientId={clientId}
        initialData={client}
      />
    </div>
  );
}
