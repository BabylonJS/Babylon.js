export type RestPoseDataUpdate = Array<{ name: string; data: { position?: number[]; scaling?: number[]; quaternion?: number[] } }>;

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

async function BlobToBase64(blob: Blob): Promise<string> {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.substring(result.indexOf(",") + 1));
        };
        reader.onerror = () => reject(new Error("Failed to read blob"));
        reader.readAsDataURL(blob);
    });
}

function Base64ToBlob(base64: string): Blob {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes]);
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

    /**
     * Returns all avatars in a JSON-serializable format, including base64-encoded file data for file-based entries.
     */
    public async exportDataAsync(): Promise<Array<StoredAvatar & { fileData?: Record<string, string> }>> {
        return await Promise.all(
            this._avatars.map(async (avatar) => {
                const entry: StoredAvatar & { fileData?: Record<string, string> } = { ...avatar };
                if (avatar.source === "file" && avatar.fileNames?.length) {
                    const files = await this.getFilesAsync(avatar.id, avatar.fileNames);
                    const pairs = await Promise.all(files.map(async (file) => [file.name, await BlobToBase64(file)] as const));
                    const fileData: Record<string, string> = {};
                    for (const [name, b64] of pairs) {
                        fileData[name] = b64;
                    }
                    entry.fileData = fileData;
                }
                return entry;
            })
        );
    }

    /**
     * Imports avatars, including restoring file-based entries to IndexedDB from base64 data.
     */
    public async importDataAsync(avatars: Array<StoredAvatar & { fileData?: Record<string, string> }>, mode: "replace" | "append"): Promise<string[]> {
        const skipped: string[] = [];

        if (mode === "replace") {
            this._avatars = [];
        }

        // Sequential processing needed: each entry may depend on prior state for duplicate detection
        for (const avatar of avatars) {
            if (mode === "append" && this._avatars.some((a) => a.name === avatar.name)) {
                skipped.push(`avatar "${avatar.name}"`);
            } else {
                const newId = GenerateId();
                const { fileData, ...avatarData } = avatar;
                this._avatars.push({ ...avatarData, id: newId });

                if (avatarData.source === "file" && fileData) {
                    const fileEntries = Object.entries(fileData);
                    // eslint-disable-next-line no-await-in-loop
                    await Promise.all(
                        fileEntries.map(async ([fileName, base64]) => {
                            const blob = Base64ToBlob(base64);
                            await IdbPut(`avatar:${newId}/${fileName}`, blob);
                        })
                    );
                    this._avatars[this._avatars.length - 1].fileNames = fileEntries.map(([n]) => n);
                }
            }
        }

        this._saveToStorage();
        return skipped;
    }

    /**
     * Creates default avatar entries if the list is empty.
     */
    public createDefaults(): void {
        if (this._avatars.length > 0) {
            return;
        }
        const baseUrl = "https://assets.babylonjs.com/mixamo/Characters/";
        const defaults: { name: string; file: string; scheme: string }[] = [
            { name: "Big Vegas", file: "Big Vegas.glb", scheme: "Mixamo" },
            { name: "Mousey", file: "Ch14_nonPBR.glb", scheme: "Mixamo" },
            { name: "Goblin", file: "goblin_d_shareyko.glb", scheme: "Mixamo" },
            { name: "Ready Player Me", file: "rpm.glb", scheme: "Mixamo No Namespace" },
            { name: "White Clown", file: "Whiteclown N Hallin.glb", scheme: "Mixamo" },
        ];
        for (const d of defaults) {
            this.addAvatar({
                id: "",
                name: d.name,
                source: "url",
                url: baseUrl + d.file,
                namingScheme: d.scheme,
                rootNodeName: "__root__",
            });
        }
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
