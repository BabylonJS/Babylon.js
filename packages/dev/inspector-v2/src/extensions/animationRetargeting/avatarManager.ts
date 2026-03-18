import type { RestPoseDataUpdate } from "./data";

const AvatarStorageKey = "BabylonInspector_AnimRetargeting_AvatarManager";
const IDBName = "BabylonInspector_AnimRetargeting";
const IDBStore = "avatarFiles";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StoredAvatar = {
    /** Unique, immutable identifier generated at creation time. Used as the IndexedDB key prefix. */
    id: string;
    name: string;
    source: "url" | "file";
    url?: string;
    fileNames?: string[];
    namingScheme: string;
    rootNodeName: string;
    restPoseUpdate?: RestPoseDataUpdate;
};

type SerializedData = {
    avatars: StoredAvatar[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function GenerateId(): string {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

async function OpenIDB(): Promise<IDBDatabase> {
    return await new Promise((resolve, reject) => {
        const request = indexedDB.open(IDBName, 2);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(IDBStore)) {
                db.createObjectStore(IDBStore);
            }
            if (!db.objectStoreNames.contains("animationFiles")) {
                db.createObjectStore("animationFiles");
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IDB open failed"));
    });
}

async function IdbPut(key: string, value: Blob): Promise<void> {
    const db = await OpenIDB();
    return await new Promise((resolve, reject) => {
        const tx = db.transaction(IDBStore, "readwrite");
        tx.objectStore(IDBStore).put(value, key);
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error ?? new Error("IDB transaction failed"));
        };
    });
}

async function IdbGet(key: string): Promise<Blob | undefined> {
    const db = await OpenIDB();
    return await new Promise((resolve, reject) => {
        const tx = db.transaction(IDBStore, "readonly");
        const req = tx.objectStore(IDBStore).get(key);
        req.onsuccess = () => {
            db.close();
            resolve(req.result as Blob | undefined);
        };
        req.onerror = () => {
            db.close();
            reject(req.error ?? new Error("IDB get failed"));
        };
    });
}

async function IdbDeletePrefix(prefix: string): Promise<void> {
    const db = await OpenIDB();
    return await new Promise((resolve, reject) => {
        const tx = db.transaction(IDBStore, "readwrite");
        const store = tx.objectStore(IDBStore);
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = () => {
            const cursor = cursorReq.result;
            if (cursor) {
                if (typeof cursor.key === "string" && cursor.key.startsWith(prefix)) {
                    cursor.delete();
                }
                cursor.continue();
            }
        };
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error ?? new Error("IDB transaction failed"));
        };
    });
}

// ─── AvatarManager ────────────────────────────────────────────────────────────

export class AvatarManager {
    private _avatars: StoredAvatar[] = [];

    public constructor() {
        this._loadFromStorage();
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    public getAllAvatars(): readonly StoredAvatar[] {
        return this._avatars;
    }

    public getAvatar(name: string): StoredAvatar | undefined {
        return this._avatars.find((a) => a.name === name);
    }

    public getAvatarById(id: string): StoredAvatar | undefined {
        return this._avatars.find((a) => a.id === id);
    }

    /**
     * Adds or replaces an avatar.
     * If the avatar has no `id`, one is generated automatically.
     * For file-based avatars, the files must already be stored in IndexedDB via `storeFilesAsync`.
     */
    public addAvatar(avatar: StoredAvatar): void {
        if (!avatar.id) {
            avatar.id = GenerateId();
        }
        const idx = this._avatars.findIndex((a) => a.id === avatar.id);
        if (idx !== -1) {
            this._avatars[idx] = avatar;
        } else {
            this._avatars.push(avatar);
        }
        this._saveToStorage();
    }

    /**
     * Removes an avatar by id and its associated files from IndexedDB.
     */
    public async removeAvatarAsync(id: string): Promise<void> {
        const avatar = this._avatars.find((a) => a.id === id);
        if (!avatar) {
            return;
        }
        if (avatar.source === "file") {
            await IdbDeletePrefix(`avatar:${id}/`);
        }
        this._avatars = this._avatars.filter((a) => a.id !== id);
        this._saveToStorage();
    }

    /**
     * Stores files in IndexedDB for a file-based avatar, keyed by its immutable id.
     * @returns The list of file names stored.
     */
    public async storeFilesAsync(avatarId: string, files: File[]): Promise<string[]> {
        const fileNames: string[] = [];
        await Promise.all(
            files.map(async (file) => {
                const key = `avatar:${avatarId}/${file.name}`;
                await IdbPut(key, file);
                fileNames.push(file.name);
            })
        );
        return fileNames;
    }

    /**
     * Retrieves files from IndexedDB for a file-based avatar and converts them to File objects.
     */
    public async getFilesAsync(avatarId: string, fileNames: string[]): Promise<File[]> {
        const results = await Promise.all(
            fileNames.map(async (fileName) => {
                const key = `avatar:${avatarId}/${fileName}`;
                const blob = await IdbGet(key);
                if (blob) {
                    return new File([blob], fileName, { type: blob.type });
                }
                return undefined;
            })
        );
        return results.filter((f): f is File => f !== undefined);
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private _loadFromStorage(): void {
        try {
            const raw = localStorage.getItem(AvatarStorageKey);
            if (!raw) {
                return;
            }
            const data: SerializedData = JSON.parse(raw);
            this._avatars = data.avatars ?? [];
        } catch {
            this._avatars = [];
        }
    }

    private _saveToStorage(): void {
        const data: SerializedData = { avatars: this._avatars };
        localStorage.setItem(AvatarStorageKey, JSON.stringify(data));
    }
}
