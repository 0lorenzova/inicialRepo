import type { SupabaseClient } from "@supabase/supabase-js";
import { SyncConflictError, type SyncTransport } from "../finance-sync";

// Compare the exact database timestamp, including its microseconds. This
// adapter works with the existing schema; no migration is needed to use it.
export function createFinanceTransport<T>(client: SupabaseClient): SyncTransport<T> {
  return {
    async read(userId) {
      const { data: row, error } = await client.from("user_finance_data")
        .select("data,updated_at").eq("user_id", userId).maybeSingle();
      if (error) throw new Error(`No se pudieron cargar tus datos: ${error.message}`);
      return row ? { data: row.data as T, revision: row.updated_at as string } : null;
    },
    async write(userId, data, expectedRevision) {
      const base = expectedRevision === null ? 0 : Date.parse(expectedRevision);
      if (!Number.isFinite(base)) throw new Error("No se pudo verificar la versión guardada. Vuelve a cargar los datos.");
      const updated_at = new Date(Math.max(Date.now(), base + 1)).toISOString();
      const table = client.from("user_finance_data");
      const request = expectedRevision === null
        ? table.insert({ user_id: userId, data, updated_at })
        : table.update({ data, updated_at }).eq("user_id", userId).eq("updated_at", expectedRevision);
      const { data: saved, error } = await request.select("data,updated_at").maybeSingle();
      if (error?.code === "23505" || (!error && !saved)) throw new SyncConflictError();
      if (error) throw new Error(`No se pudieron guardar tus cambios: ${error.message}`);
      return { data: saved!.data as T, revision: saved!.updated_at as string };
    },
  };
}
