import { openDB, DBSchema } from "idb";

export type WorkoutType = "Rodaje" | "Calidad" | "Cuestas" | "Largo" | "Gravel" | "Gimnasio";

export type Session = {
  id: string;
  date: string; // 2026-02-23
  type: WorkoutType;
  workoutName: string;

  plannedMinutes: number;
  plannedZone: "Z1" | "Z2" | "Z3" | "Z4";
  plannedRpe?: number;

  actualMinutes?: number;
  distanceKm?: number;
  paceAvg?: string; // "6:13"
  hrAvg?: number;
  hrMax?: number;

  rpe?: number; // 1-10
  mood?: number; // 1-5
  sleep?: number; // 1-5
  kneePain?: number; // 0-10
  notes?: string;

  createdAt: number;
  updatedAt: number;
};

interface NicoDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
    indexes: { "by-date": string };
  };
}

export async function getDB() {
  return openDB<NicoDB>("nico-entrenos-db", 1, {
    upgrade(db) {
      const store = db.createObjectStore("sessions", { keyPath: "id" });
      store.createIndex("by-date", "date");
    },
  });
}

export async function upsertSession(s: Session) {
  const db = await getDB();
  await db.put("sessions", s);
}

export async function listSessions() {
  const db = await getDB();
  return db.getAll("sessions");
}

export async function deleteSession(id: string) {
  const db = await getDB();
  await db.delete("sessions", id);
}