"use client";

import { useEffect, useMemo, useState } from "react";
import { listSessions, upsertSession, deleteSession, type Session, type WorkoutType } from "@/lib/db";
import { summarizeWeek } from "@/lib/coach";
import { TEMPLATES, applyTemplate } from "@/lib/templates";
import { exportBackup, importBackup } from "@/lib/backup";

function uid() {
  return crypto.randomUUID();
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TYPES: WorkoutType[] = ["Rodaje", "Calidad", "Cuestas", "Largo", "Gravel", "Gimnasio"];

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [form, setForm] = useState<Partial<Session>>({
    date: todayISO(),
    type: "Rodaje",
    workoutName: "CRUCE – Rodaje fácil",
    plannedMinutes: 50,
    plannedZone: "Z2",
    plannedRpe: 4,
  });
  const [selectedMonth, setSelectedMonth] = useState(() => todayISO().slice(0, 7)); // "YYYY-MM"
 useEffect(() => {
  if (process.env.NODE_ENV !== "production") return;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}, []);
  useEffect(() => {
    (async () => setSessions(await listSessions()))();
  }, []);

  // Calcula el lunes de la semana seleccionada (según la fecha del formulario)
  const weekStartISO = useMemo(() => {
    const d = new Date(form.date ?? todayISO());
    const day = d.getDay(); // 0 dom ... 6 sáb
    const diffToMon = (day + 6) % 7; // lunes = 0
    d.setDate(d.getDate() - diffToMon);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }, [form.date]);

  // Filtra sesiones que caen dentro de esa semana
  const weekSessions = useMemo(() => {
  const start = new Date(weekStartISO);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const endISO = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

  return sessions
    .filter((s) => s.date >= weekStartISO && s.date <= endISO)
    .sort((a, b) => a.date.localeCompare(b.date));
}, [sessions, weekStartISO]);
const monthSessions = useMemo(() => {
  const prefix = selectedMonth + "-"; // "YYYY-MM-"
  return sessions
    .filter((s) => s.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date));
}, [sessions, selectedMonth]);

  const summary = useMemo(() => summarizeWeek(weekSessions), [weekSessions]);

  async function save() {
    const now = Date.now();

    const s: Session = {
      id: (form.id as string) ?? uid(),
      date: form.date ?? todayISO(),
      type: (form.type as WorkoutType) ?? "Rodaje",
      workoutName: form.workoutName ?? "",

      plannedMinutes: Number(form.plannedMinutes ?? 0),
      plannedZone: (form.plannedZone as any) ?? "Z2",
      plannedRpe: form.plannedRpe ? Number(form.plannedRpe) : undefined,

      actualMinutes: form.actualMinutes ? Number(form.actualMinutes) : undefined,
      distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
      paceAvg: form.paceAvg,
      hrAvg: form.hrAvg ? Number(form.hrAvg) : undefined,
      hrMax: form.hrMax ? Number(form.hrMax) : undefined,

      rpe: form.rpe ? Number(form.rpe) : undefined,
      mood: form.mood ? Number(form.mood) : undefined,
      sleep: form.sleep ? Number(form.sleep) : undefined,
      kneePain: form.kneePain ? Number(form.kneePain) : undefined,
      notes: form.notes,

      createdAt: (form.createdAt as number) ?? now,
      updatedAt: now,
    };

    await upsertSession(s);
    setSessions(await listSessions());

    // resetea el formulario
    setForm({
      date: todayISO(),
      type: "Rodaje",
      workoutName: "CRUCE – Rodaje fácil",
      plannedMinutes: 50,
      plannedZone: "Z2",
      plannedRpe: 4,
    });
  }

  async function remove(id: string) {
    await deleteSession(id);
    setSessions(await listSessions());
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>Diario de entrenamientos (offline)</h1>
      <section style={{ display: "flex", gap: 8, margin: "12px 0" }}>
  <button
    onClick={async () => {
      const text = await exportBackup();
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `nico-entrenos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();

      URL.revokeObjectURL(url);
    }}
    style={{ padding: 10, borderRadius: 10, border: "1px solid #333", cursor: "pointer" }}
  >
    Exportar backup
  </button>

  <label style={{ padding: 10, borderRadius: 10, border: "1px solid #333", cursor: "pointer" }}>
    Importar backup
    <input
      type="file"
      accept="application/json"
      style={{ display: "none" }}
     onChange={async (e) => {
  const input = e.currentTarget; // guardamos referencia
  const file = input.files?.[0];
  if (!file) return;

  const text = await file.text();
  await importBackup(text);

  // recargar sesiones (sin import dinámico)
  const sessions = await listSessions();
setSessions(sessions);
input.value = "";
alert("Backup importado ✅");
}}
    />
  </label>
</section>
      <p style={{ marginTop: -8, opacity: 0.75 }}>
        Cargás objetivo vs real + sensaciones. La app calcula semáforo semanal y ajuste sugerido.
      </p>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 12,
        }}
      >
        <div>
          <label>Fecha</label>
          <input
            type="date"
            value={form.date ?? ""}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>Tipo</label>
          <select
            value={(form.type as string) ?? "Rodaje"}
            onChange={(e) => setForm({ ...form, type: e.target.value as any })}
            style={{ width: "100%" }}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
            <div style={{ gridColumn: "1 / -1" }}>
  <label>Plantilla (opcional)</label>
  <select
    defaultValue=""
    onChange={(e) => {
      const key = e.target.value;
      if (!key) return;
      setForm((prev) => applyTemplate(prev, key));
      // resetea el select a vacío para que puedas elegir otra sin lío
      e.currentTarget.value = "";
    }}
    style={{ width: "100%" }}
  >
    <option value="">— Elegir plantilla —</option>
    {TEMPLATES.map((t) => (
      <option key={t.key} value={t.key}>
        {t.nombre}
      </option>
    ))}
  </select>
</div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Nombre del entrenamiento</label>
          <input
            value={form.workoutName ?? ""}
            onChange={(e) => setForm({ ...form, workoutName: e.target.value })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>Minutos objetivo</label>
          <input
            type="number"
            value={form.plannedMinutes ?? 0}
            onChange={(e) => setForm({ ...form, plannedMinutes: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>Zona objetivo</label>
          <select
            value={(form.plannedZone as string) ?? "Z2"}
            onChange={(e) => setForm({ ...form, plannedZone: e.target.value as any })}
            style={{ width: "100%" }}
          >
            {["Z1", "Z2", "Z3", "Z4"].map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>RPE esperado (1–10)</label>
          <input
            type="number"
            value={form.plannedRpe ?? ""}
            onChange={(e) => setForm({ ...form, plannedRpe: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div />
        <hr style={{ gridColumn: "1 / -1" }} />

        <div>
          <label>Minutos reales</label>
          <input
            type="number"
            value={form.actualMinutes ?? ""}
            onChange={(e) => setForm({ ...form, actualMinutes: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>Kilómetros</label>
          <input
            type="number"
            value={form.distanceKm ?? ""}
            onChange={(e) => setForm({ ...form, distanceKm: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>Ritmo medio (mm:ss)</label>
          <input
            placeholder="6:13"
            value={form.paceAvg ?? ""}
            onChange={(e) => setForm({ ...form, paceAvg: e.target.value })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>FC media</label>
          <input
            type="number"
            value={form.hrAvg ?? ""}
            onChange={(e) => setForm({ ...form, hrAvg: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>FC máx</label>
          <input
            type="number"
            value={form.hrMax ?? ""}
            onChange={(e) => setForm({ ...form, hrMax: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>RPE real (1–10)</label>
          <input
            type="number"
            value={form.rpe ?? ""}
            onChange={(e) => setForm({ ...form, rpe: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>Ánimo (1–5)</label>
          <input
            type="number"
            value={form.mood ?? ""}
            onChange={(e) => setForm({ ...form, mood: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>Sueño (1–5)</label>
          <input
            type="number"
            value={form.sleep ?? ""}
            onChange={(e) => setForm({ ...form, sleep: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>Dolor rodilla (0–10)</label>
          <input
            type="number"
            value={form.kneePain ?? ""}
            onChange={(e) => setForm({ ...form, kneePain: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label>Notas</label>
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            style={{ width: "100%", minHeight: 60 }}
          />
        </div>

        <button
          onClick={save}
          style={{
            gridColumn: "1 / -1",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #333",
            cursor: "pointer",
          }}
        >
          Guardar sesión
        </button>
      </section>

      <section style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2>Mes seleccionado: {selectedMonth}</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
  <label><b>Mes:</b></label>
  <input
    type="month"
    value={selectedMonth}
    onChange={(e) => setSelectedMonth(e.target.value)}
    style={{ padding: 6, borderRadius: 8, border: "1px solid #333" }}
  />
  <span style={{ opacity: 0.8 }}>
    <b>Sesiones en el mes:</b> {monthSessions.length} · <b>Total guardadas:</b> {sessions.length}
  </span>
</div>
        <p>
          <b>Semáforo:</b> {summary.light} — <b>Puntaje:</b> {summary.avgScore}
        </p>
        <p>
          <b>Ajuste sugerido:</b> {summary.adjustment}
        </p>
        <p>
          <b>Entrenador:</b> {summary.coachMessage}
        </p>

        {monthSessions.length === 0 ? (
          <p>No hay sesiones guardadas en este mes.</p>
        ) : (
          <ul>
            {monthSessions.map((s) => (
              <li key={s.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
  <div>
    <b>{s.date}</b> — {s.type} — {s.workoutName} — Obj {s.plannedMinutes}’ {s.plannedZone} / Real{" "}
    {s.actualMinutes ?? "—"}’ FC {s.hrAvg ?? "—"}
  </div>

  {s.notes ? (
    <div style={{ marginTop: 4, opacity: 0.8 }}>
      <b>Notas:</b> {s.notes}
    </div>
  ) : null}
</div>
                <button
                  onClick={() => remove(s.id)}
                  style={{ border: "1px solid #c00", borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}
                >
                  Borrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}