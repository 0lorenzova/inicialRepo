export class SyncConflictError extends Error {
  constructor(message = "Los datos cambiaron en otro dispositivo. Revisa la copia pendiente antes de cargar la versión de la nube.") {
    super(message);
    this.name = "SyncConflictError";
  }
}

export type SyncState<T> = {
  data: T;
  ready: boolean;
  pending: boolean;
  status: "loading" | "synced" | "syncing" | "error" | "conflict";
  error: string | null;
  userId: string | null;
};
export type SyncRecord<T> = { data: T; revision: string };
export type SyncTransport<T> = {
  read(userId: string): Promise<SyncRecord<T> | null>;
  write(userId: string, data: T, expectedRevision: string | null): Promise<SyncRecord<T>>;
};
export type SyncSnapshot<T> = { userId: string; data: T; revision: string | null; pending: boolean };
type Cache<T> = { data: T; revision: string | null; pending: boolean };
type SyncOptions<T> = {
  initial: T;
  hydrate: (data: T) => T;
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  transport: SyncTransport<T>;
  onChange: (state: SyncState<T>) => void;
  instanceId?: string;
  previousInstanceId?: string;
};

// jsonb puede cambiar el orden de las claves sin cambiar el contenido.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
const sameData = (left: unknown, right: unknown) => canonical(left) === canonical(right);
const messageOf = (error: unknown) => error instanceof Error ? error.message : "No se pudo sincronizar. Tus cambios pendientes se conservan.";

export class FinanceSyncController<T> {
  private state: SyncState<T>;
  private revision: string | null = null;
  private generation = 0;
  private editVersion = 0;
  private baseKnown = false;
  private suppressCache = false;
  private readTask: Promise<void> | null = null;
  private writeTask: Promise<void> | null = null;
  private readonly instanceId: string;
  private readonly options: SyncOptions<T>;

  constructor(options: SyncOptions<T>) {
    this.options = options;
    this.instanceId = options.instanceId ?? crypto.randomUUID();
    this.state = { data: options.initial, ready: false, pending: false, status: "loading", error: null, userId: null };
  }

  getState(): SyncState<T> { return this.state; }

  getSnapshot(): SyncSnapshot<T> | null {
    if (!this.state.userId) return null;
    return JSON.parse(JSON.stringify({ userId: this.state.userId, data: this.state.data, revision: this.revision, pending: this.state.pending })) as SyncSnapshot<T>;
  }

  getBackup(): SyncSnapshot<T> | null {
    if (!this.state.userId) return null;
    try {
      const raw = this.options.storage.getItem(`finanzas:backup:${this.state.userId}`);
      if (!raw) return null;
      const backup = JSON.parse(raw) as SyncSnapshot<T>;
      return backup.userId === this.state.userId ? backup : null;
    } catch { return null; }
  }

  private notify(patch: Partial<SyncState<T>>) {
    this.state = { ...this.state, ...patch };
    this.options.onChange(this.state);
  }

  private cacheKey() { return `finanzas:cache:${this.state.userId}`; }
  private draftKey() { return `finanzas:draft:${this.state.userId}:${this.instanceId}`; }

  private readCache(): Cache<T> | null {
    const previous = this.options.previousInstanceId
      ? this.readStoredCache(`finanzas:draft:${this.state.userId}:${this.options.previousInstanceId}`)
      : null;
    return this.readStoredCache(this.draftKey()) ?? previous ?? this.readStoredCache(this.cacheKey());
  }

  private readStoredCache(key: string): Cache<T> | null {
    try {
      const raw = this.options.storage.getItem(key);
      if (!raw) return null;
      const value = JSON.parse(raw) as Cache<T>;
      if (typeof value.pending !== "boolean" || (value.revision !== null && typeof value.revision !== "string") || !("data" in value)) return null;
      return { ...value, data: this.options.hydrate(value.data) };
    } catch { return null; }
  }

  private saveCache() {
    if (!this.state.userId || this.suppressCache) return;
    const serialized = JSON.stringify({ data: this.state.data, revision: this.revision, pending: this.state.pending });
    // Cada pestaña conserva su propio borrador aunque otra cambie la caché común.
    if (this.state.pending) this.options.storage.setItem(this.draftKey(), serialized);
    else this.options.storage.removeItem(this.draftKey());
    this.options.storage.setItem(this.cacheKey(), serialized);
  }

  async open(userId: string): Promise<void> {
    const generation = ++this.generation;
    this.readTask = null;
    this.writeTask = null;
    this.baseKnown = false;
    this.suppressCache = false;
    this.revision = null;
    this.editVersion = 0;
    this.notify({ userId, data: this.options.initial, ready: false, pending: false, status: "loading", error: null });
    const cache = this.readCache();
    if (cache) {
      this.revision = cache.revision;
      this.notify({ data: cache.data, pending: cache.pending });
    }
    await this.startRead(generation, false);
  }

  close(): void {
    ++this.generation;
    this.readTask = null;
    this.writeTask = null;
    this.baseKnown = false;
    this.revision = null;
    this.notify({ userId: null, data: this.options.initial, ready: false, pending: false, status: "loading", error: null });
  }

  setData(next: T | ((previous: T) => T)): void {
    if (!this.state.ready || !this.state.userId) throw new Error("Espera a que se carguen los datos de tu usuario antes de modificarlos.");
    const data = typeof next === "function" ? (next as (previous: T) => T)(this.state.data) : next;
    if (sameData(data, this.state.data)) return;
    ++this.editVersion;
    this.suppressCache = false;
    this.notify({ data, pending: true, status: this.state.status === "conflict" ? "conflict" : "syncing", error: this.state.status === "conflict" ? this.state.error : null });
    try { this.saveCache(); } catch { this.notify({ status: "error", error: "No se pudo guardar la copia en este navegador. Conserva esta pestaña abierta y vuelve a sincronizar." }); }
  }

  async flush(): Promise<void> {
    const generation = this.generation;
    if (this.readTask) await this.readTask;
    if (generation !== this.generation) return;
    if (this.writeTask) return this.writeTask;
    if (!this.state.userId || !this.state.ready || !this.baseKnown || this.state.status === "conflict" || !this.state.pending) return;
    const task = this.writePending(generation);
    this.writeTask = task;
    try { await task; } finally { if (this.writeTask === task) this.writeTask = null; }
  }

  private async writePending(generation: number): Promise<void> {
    while (generation === this.generation && this.state.pending && this.state.userId && this.baseKnown) {
      const userId = this.state.userId;
      const sent = this.state.data;
      const version = this.editVersion;
      this.notify({ status: "syncing", error: null });
      try {
        const saved = await this.options.transport.write(userId, sent, this.revision);
        if (generation !== this.generation) return;
        this.revision = saved.revision;
        const changedMeanwhile = version !== this.editVersion;
        this.notify({ data: changedMeanwhile ? this.state.data : sent, pending: changedMeanwhile, status: changedMeanwhile ? "syncing" : "synced", error: null });
        this.saveCache();
      } catch (error) {
        if (generation !== this.generation) return;
        if (error instanceof SyncConflictError) this.baseKnown = false;
        this.notify({ status: error instanceof SyncConflictError ? "conflict" : "error", error: messageOf(error) });
        return;
      }
    }
  }

  async refresh(): Promise<void> {
    const generation = this.generation;
    if (!this.state.userId) return;
    if (this.readTask) return this.readTask;
    if (this.writeTask) await this.writeTask;
    if (generation !== this.generation) return;
    if (this.readTask) return this.readTask;
    await this.startRead(generation, false);
  }

  private async startRead(generation: number, replacePending: boolean): Promise<void> {
    const task = this.readRemote(generation, replacePending);
    this.readTask = task;
    try { await task; } finally { if (this.readTask === task) this.readTask = null; }
  }

  private async readRemote(generation: number, replacePending: boolean): Promise<void> {
    const userId = this.state.userId;
    if (!userId) return;
    try {
      const remote = await this.options.transport.read(userId);
      if (generation !== this.generation) return;
      const remoteRevision = remote?.revision ?? null;
      if (!replacePending && this.state.ready && !this.state.pending && remote && this.revision === remoteRevision) {
        this.baseKnown = true;
        this.notify({ status: "synced", error: null });
        this.saveCache();
        return;
      }
      if (this.state.pending && !replacePending) {
        if (remote && sameData(remote.data, this.state.data)) {
          this.revision = remoteRevision;
          this.baseKnown = true;
          this.notify({ ready: true, pending: false, status: "synced", error: null });
        } else if (this.revision !== remoteRevision) {
          this.baseKnown = false;
          this.notify({ ready: true, status: "conflict", error: new SyncConflictError().message });
        } else {
          this.baseKnown = true;
          this.notify({ ready: true, status: "syncing", error: null });
        }
      } else {
        this.revision = remoteRevision;
        this.baseKnown = true;
        const remoteData = remote ? this.options.hydrate(remote.data) : this.options.initial;
        this.notify({ data: remoteData, ready: true, pending: !remote, status: remote ? "synced" : "syncing", error: null });
      }
      this.saveCache();
    } catch (error) {
      if (generation !== this.generation) return;
      this.notify({ status: "error", error: messageOf(error) });
    }
  }

  clearCache(): boolean {
    if (!this.state.userId || this.state.status !== "synced" || this.state.pending) return false;
    try {
      this.options.storage.removeItem(this.cacheKey());
      this.suppressCache = true;
      return true;
    } catch {
      this.notify({ error: "No se pudo eliminar la copia de este navegador." });
      return false;
    }
  }

  async reloadFromCloud(): Promise<void> {
    const generation = this.generation;
    if (!this.state.userId) return;
    if (this.writeTask) await this.writeTask;
    if (this.readTask) await this.readTask;
    if (generation !== this.generation) return;
    if (this.state.pending) {
      try {
        const snapshot = JSON.stringify(this.getSnapshot());
        // Keep older conflict backups recoverable after another recovery.
        this.options.storage.setItem(`finanzas:backup:${this.state.userId}:${crypto.randomUUID()}`, snapshot);
        this.options.storage.setItem(`finanzas:backup:${this.state.userId}`, snapshot);
      }
      catch {
        this.notify({ status: "error", error: "No se pudo respaldar la copia pendiente. Descárgala antes de reemplazarla." });
        return;
      }
    }
    const wasReady = this.state.ready;
    this.notify({ ready: false, status: "loading", error: null });
    await this.startRead(generation, true);
    if (generation === this.generation && this.state.status === "error") this.notify({ ready: wasReady });
  }
}
