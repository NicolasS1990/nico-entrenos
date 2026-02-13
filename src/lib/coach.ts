import type { Session } from "./db";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Referencia inicial (tu Z2 aprox): 6:13/km
export const DEFAULT_Z2_PACE_SECONDS = 6 * 60 + 13;

function paceToSeconds(pace?: string): number | null {
  if (!pace) return null;
  const [m, s] = pace.split(":").map((x) => Number(x));
  if (!Number.isFinite(m) || !Number.isFinite(s)) return null;
  return m * 60 + s;
}

export function scoreSession(session: Session) {
  const kneePain = session.kneePain ?? 0;

  let parts = 0;
  let total = 0;

  // 1) Duración (0–25)
  if (session.actualMinutes && session.plannedMinutes) {
    const ratio = session.actualMinutes / session.plannedMinutes;
    const durationScore = clamp(25 - Math.abs(1 - ratio) * 40, 0, 25);
    total += durationScore;
    parts += 25;
  }

  // 2) Zona FC (0–25) (aprox para MVP)
  if (session.hrAvg) {
    let zoneScore = 18;
    if (session.plannedZone === "Z2") {
      if (session.hrAvg <= 155) zoneScore = 25;
      else if (session.hrAvg <= 160) zoneScore = 18;
      else zoneScore = 8;
    } else if (session.plannedZone === "Z3") {
      if (session.hrAvg >= 153 && session.hrAvg <= 165) zoneScore = 25;
      else zoneScore = 14;
    } else if (session.plannedZone === "Z4") {
      if (session.hrAvg >= 160) zoneScore = 25;
      else zoneScore = 12;
    } else {
      if (session.hrAvg <= 145) zoneScore = 25;
      else zoneScore = 12;
    }
    total += zoneScore;
    parts += 25;
  }

  // 3) RPE (0–25)
  if (session.rpe && session.plannedRpe) {
    const diff = Math.abs(session.rpe - session.plannedRpe);
    const rpeScore = clamp(25 - diff * 8, 0, 25);
    total += rpeScore;
    parts += 25;
  }

  // 4) Ritmo (0–25) (solo si hay)
  const paceSec = paceToSeconds(session.paceAvg);
  if (paceSec != null) {
    let paceScore = 18;
    if (session.plannedZone === "Z2") {
      const diff = paceSec - DEFAULT_Z2_PACE_SECONDS;
      if (diff <= 0) paceScore = 25;
      else if (diff <= 20) paceScore = 22;
      else if (diff <= 45) paceScore = 16;
      else paceScore = 8;
    }
    total += paceScore;
    parts += 25;
  }

  const normalized = parts > 0 ? Math.round((total / parts) * 100) : 50;

  // Bandera mínima por rodilla
  const kneeRed = kneePain >= 5;
  const kneeYellow = kneePain >= 4;

  return { score: normalized, kneeRed, kneeYellow };
}

export function summarizeWeek(sessions: Session[]) {
  const scored = sessions.map(scoreSession);
  const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b.score, 0) / scored.length) : 0;

  const kneeRed = scored.some((x) => x.kneeRed);
  const kneeYellowCount = scored.filter((x) => x.kneeYellow).length;
  const kneeRisk = kneeYellowCount >= 2;

  let light: "Verde" | "Amarillo" | "Rojo" = "Amarillo";
  if (avg >= 75 && !kneeRed && !kneeRisk) light = "Verde";
  else if (avg < 60 || kneeRed || kneeRisk) light = "Rojo";

  const adjustment =
    light === "Verde" ? "Subir 5–10% (o +10’ al largo / +1 bloque en calidad)" :
    light === "Amarillo" ? "Mantener volumen, bajar un poco la intensidad" :
    "Descarga: -20/30% y sin intensidad (solo Zona 2)";

  const coachMessage =
    light === "Verde"
      ? "Vas sólido. Si la rodilla está tranquila, metemos un poquito más: sumá 10’ al largo o una repetición extra en el trabajo de calidad."
      : light === "Amarillo"
      ? "Bien, pero hay señales de fatiga. Mantené el volumen y hacé la calidad más controlada (cambios suaves). Priorizá dormir bien."
      : "Ojo: esta semana pide descarga. Bajamos volumen y cero intensidad para llegar al siguiente bloque frescos y con la rodilla cuidada.";

  return { avgScore: avg, light, adjustment, coachMessage };
}