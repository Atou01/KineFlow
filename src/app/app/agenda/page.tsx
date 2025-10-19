"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useState, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import moment from "moment";
import "moment/locale/fr";

moment.locale("fr");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

type Appointment = {
  id: string;
  client_id: string | null;
  date: string;
  duration_minutes: number;
  status: string;
  client_name?: string;
};

type EventType = {
  id: string;
  title: string;
  start: Date;
  end: Date;
};

export default function AgendaPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/appointments");
    const data: Appointment[] = await res.json();
    const mapped = data.map(a => ({
      id: a.id,
      title: a.client_name || "RDV",
      start: new Date(a.date),
      end: new Date(new Date(a.date).getTime() + a.duration_minutes * 60000)
    }));
    setEvents(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSelectSlot(slotInfo: any) {
    const date = slotInfo.start;
    await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: null,
        date,
        duration_minutes: 30,
        status: "planned"
      })
    });
    load();
  }

  async function handleEventDrop({ event, start }: any) {
    await fetch(`/api/appointments/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: start,
        duration_minutes: 30,
        status: "planned"
      })
    });
    load();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Agenda</h1>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor={(event: any) => event.start}
          endAccessor={(event: any) => event.end}
          selectable
          style={{ height: 700, background: "white", borderRadius: "1rem", padding: "1rem" }}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
        />
      )}
    </div>
  );
}
