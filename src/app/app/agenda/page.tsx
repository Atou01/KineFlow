"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import moment from "moment";
import "moment/locale/fr";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

moment.locale("fr");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

type Appointment = {
  id: string;
  client_id: string | null;
  start_time: string;
  end_time: string;
  status: string;
  title?: string;
  client_name?: string;
};

type EventType = {
  id: string;
  title: string;
  start: Date;
  end: Date;
};

export default function AgendaPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/appointments", { cache: 'no-store' });
    const data: Appointment[] = await res.json();
    const mapped = data.map(a => ({
      id: a.id,
      title: a.title || a.client_name || "RDV",
      start: new Date(a.start_time),
      end: new Date(a.end_time)
    }));
    setEvents(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSelectSlot(slotInfo: any) {
    // Rediriger vers le formulaire de création avec la date pré-remplie
    const date = moment(slotInfo.start).format('YYYY-MM-DD');
    const time = moment(slotInfo.start).format('HH:mm');
    router.push(`/app/agenda/new?date=${date}&time=${time}`);
  }

  function handleSelectEvent(event: any) {
    // Rediriger vers le formulaire d'édition
    router.push(`/app/agenda/${event.id}/edit`);
  }

  async function handleEventDrop({ event, start, end }: any) {
    const date = moment(start).format('YYYY-MM-DD');
    const time = moment(start).format('HH:mm');
    const duration_minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    
    await fetch(`/api/appointments/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        time,
        duration_minutes,
        status: "planned"
      })
    });
    load();
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600 mt-1">{events.length} rendez-vous</p>
        </div>
        <Link
          href="/app/agenda/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau RDV
        </Link>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor={(event: any) => event.start}
          endAccessor={(event: any) => event.end}
          selectable
          style={{ height: 700 }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          messages={{
            next: "Suivant",
            previous: "Précédent",
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            agenda: "Agenda",
            date: "Date",
            time: "Heure",
            event: "Événement",
            noEventsInRange: "Aucun rendez-vous dans cette période",
          }}
        />
      </div>
    </div>
  );
}
