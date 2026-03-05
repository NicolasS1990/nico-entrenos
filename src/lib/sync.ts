import { supabase } from "./supabase";
import { listSessions, upsertSession, type Session } from "./db";

type RemoteRow = {
  id: string;
  user_id: string;

  date: string;
  type: string;
  workout_name: string;

  planned_minutes: number;
  planned_zone: string;
  planned_rpe: number | null;

  actual_minutes: number | null;
  distance_km: number | null;
  pace_avg: string | null;
  hr_avg: number | null;
  hr_max: number | null;

  rpe: number | null;
  mood: number | null;
  sleep: number | null;
  knee_pain: number | null;
  notes: string | null;

  created_at: number;
  updated_at: number;
};

function toRemote(s: Session, userId: string): RemoteRow {
  return {
    id: s.id,
    user_id: userId,

    date: s.date,
    type: s.type,
    workout_name: s.workoutName,

    planned_minutes: s.plannedMinutes,
    planned_zone: s.plannedZone,
    planned_rpe: s.plannedRpe ?? null,

    actual_minutes: s.actualMinutes ?? null,
    distance_km: s.distanceKm ?? null,
    pace_avg: s.paceAvg ?? null,
    hr_avg: s.hrAvg ?? null,
    hr_max: s.hrMax ?? null,

    rpe: s.rpe ?? null,
    mood: s.mood ?? null,
    sleep: s.sleep ?? null,
    knee_pain: s.kneePain ?? null,
    notes: s.notes ?? null,

    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

function toLocal(r: RemoteRow): Session {
  return {
    id: r.id,
    date: r.date,
    type: r.type as any,
    workoutName: r.workout_name,

    plannedMinutes: r.planned_minutes,
    plannedZone: r.planned_zone as any,
    plannedRpe: r.planned_rpe ?? undefined,

    actualMinutes: r.actual_minutes ?? undefined,
    distanceKm: r.distance_km ?? undefined,
    paceAvg: r.pace_avg ?? undefined,
    hrAvg: r.hr_avg ?? undefined,
    hrMax: r.hr_max ?? undefined,

    rpe: r.rpe ?? undefined,
    mood: r.mood ?? undefined,
    sleep: r.sleep ?? undefined,
    kneePain: r.knee_pain ?? undefined,
    notes: r.notes ?? undefined,

    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function syncNow() {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("No hay sesión iniciada.");

  // Subir local → remoto
  const local = await listSessions();
  if (local.length) {
    const payload = local.map((s) => toRemote(s, userId));
    const { error } = await supabase.from("sessions").upsert(payload, { onConflict: "id" });
    if (error) throw error;
  }

  // Bajar remoto → local
  const { data: remote, error: err2 } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId);

  if (err2) throw err2;

  const remoteRows = (remote ?? []) as RemoteRow[];
  const localMap = new Map(local.map((s) => [s.id, s]));

  for (const r of remoteRows) {
    const loc = localMap.get(r.id);
    if (!loc || r.updated_at > (loc.updatedAt ?? 0)) {
      await upsertSession(toLocal(r));
    }
  }

  return { pushed: local.length, pulled: remoteRows.length };
}