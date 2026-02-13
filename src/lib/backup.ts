import { listSessions, upsertSession, type Session } from "./db";

export async function exportBackup(): Promise<string> {
  const sessions = await listSessions();
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions,
  };
  return JSON.stringify(payload, null, 2);
}

export async function importBackup(jsonText: string) {
  const parsed = JSON.parse(jsonText) as { version: number; sessions: Session[] };

  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.sessions)) {
    throw new Error("Backup inválido (versión o formato).");
  }

  for (const s of parsed.sessions) {
    // Normaliza por si falta algo
    const now = Date.now();
    await upsertSession({
      ...s,
      createdAt: s.createdAt ?? now,
      updatedAt: now,
    });
  }
}