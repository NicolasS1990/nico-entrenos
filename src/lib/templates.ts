import type { WorkoutType, Session } from "./db";

export type Template = {
  key: string;
  nombre: string;
  tipo: WorkoutType;
  plannedMinutes: number;
  plannedZone: "Z1" | "Z2" | "Z3" | "Z4";
  plannedRpe: number;
};

export const TEMPLATES: Template[] = [
  { key: "rodaje50", nombre: "CRUCE – Rodaje fácil 50’", tipo: "Rodaje", plannedMinutes: 50, plannedZone: "Z2", plannedRpe: 4 },
  { key: "recup40", nombre: "CRUCE – Recuperación 40’", tipo: "Rodaje", plannedMinutes: 40, plannedZone: "Z1", plannedRpe: 2 },

  { key: "cambios6x1", nombre: "CRUCE – Cambios suaves 6×1’", tipo: "Calidad", plannedMinutes: 45, plannedZone: "Z4", plannedRpe: 7 },
  { key: "cambios8x1", nombre: "CRUCE – Cambios suaves 8×1’", tipo: "Calidad", plannedMinutes: 50, plannedZone: "Z4", plannedRpe: 7 },
  { key: "cambios10x1", nombre: "CRUCE – Cambios 10×1’", tipo: "Calidad", plannedMinutes: 55, plannedZone: "Z4", plannedRpe: 8 },

  { key: "umbral3x8", nombre: "CRUCE – Umbral 3×8’", tipo: "Calidad", plannedMinutes: 55, plannedZone: "Z3", plannedRpe: 7 },
  { key: "cuestas8", nombre: "CRUCE – Cuestas 8 repeticiones", tipo: "Cuestas", plannedMinutes: 55, plannedZone: "Z4", plannedRpe: 8 },

  { key: "largo90", nombre: "CRUCE – Largo 1h30", tipo: "Largo", plannedMinutes: 90, plannedZone: "Z2", plannedRpe: 5 },
  { key: "largo105", nombre: "CRUCE – Largo 1h45", tipo: "Largo", plannedMinutes: 105, plannedZone: "Z2", plannedRpe: 5 },
  { key: "largo120", nombre: "CRUCE – Largo 2h", tipo: "Largo", plannedMinutes: 120, plannedZone: "Z2", plannedRpe: 6 },

  { key: "gravel120", nombre: "CRUCE – Gravel 2h Zona 2", tipo: "Gravel", plannedMinutes: 120, plannedZone: "Z2", plannedRpe: 4 },
  { key: "gravel150", nombre: "CRUCE – Gravel 2h30 Zona 2", tipo: "Gravel", plannedMinutes: 150, plannedZone: "Z2", plannedRpe: 5 },
];

export function applyTemplate(form: Partial<Session>, templateKey: string): Partial<Session> {
  const t = TEMPLATES.find((x) => x.key === templateKey);
  if (!t) return form;

  return {
    ...form,
    type: t.tipo,
    workoutName: t.nombre,
    plannedMinutes: t.plannedMinutes,
    plannedZone: t.plannedZone,
    plannedRpe: t.plannedRpe,
  };
}