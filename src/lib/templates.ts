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
  // Largos extra (muy usados)
{ key: "largo135", nombre: "CRUCE – Largo 2h15", tipo: "Largo", plannedMinutes: 135, plannedZone: "Z2", plannedRpe: 6 },
{ key: "largo150", nombre: "CRUCE – Largo 2h30", tipo: "Largo", plannedMinutes: 150, plannedZone: "Z2", plannedRpe: 6 },
{ key: "largo165", nombre: "CRUCE – Largo 2h45", tipo: "Largo", plannedMinutes: 165, plannedZone: "Z2", plannedRpe: 7 },
{ key: "largo180", nombre: "CRUCE – Largo 3h", tipo: "Largo", plannedMinutes: 180, plannedZone: "Z2", plannedRpe: 7 },
{ key: "largo210", nombre: "CRUCE – Largo 3h30", tipo: "Largo", plannedMinutes: 210, plannedZone: "Z2", plannedRpe: 8 },

// Gravel extra
{ key: "gravel90", nombre: "CRUCE – Gravel 1h30 Zona 2", tipo: "Gravel", plannedMinutes: 90, plannedZone: "Z2", plannedRpe: 3 },
{ key: "gravel180", nombre: "CRUCE – Gravel 3h Zona 2", tipo: "Gravel", plannedMinutes: 180, plannedZone: "Z2", plannedRpe: 5 },

// Tempo / Z3 controlado (para jueves)
{ key: "tempo30", nombre: "CRUCE – Tempo controlado 30’", tipo: "Calidad", plannedMinutes: 60, plannedZone: "Z3", plannedRpe: 7 },
{ key: "tempo40", nombre: "CRUCE – Tempo controlado 40’", tipo: "Calidad", plannedMinutes: 70, plannedZone: "Z3", plannedRpe: 8 },

// Cuestas variantes
{ key: "cuestas10", nombre: "CRUCE – Cuestas 10 repeticiones", tipo: "Cuestas", plannedMinutes: 60, plannedZone: "Z4", plannedRpe: 8 },
{ key: "cuestas6largas", nombre: "CRUCE – Cuestas largas 6 repeticiones", tipo: "Cuestas", plannedMinutes: 60, plannedZone: "Z3", plannedRpe: 8 },

// Rodaje corto (turno noche / recuperación)
{ key: "rodaje35", nombre: "CRUCE – Rodaje fácil 35’", tipo: "Rodaje", plannedMinutes: 35, plannedZone: "Z2", plannedRpe: 3 },
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