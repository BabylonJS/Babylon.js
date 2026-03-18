import type { RestPoseDataUpdate } from "./data";

const AnimationStorageKey = "BabylonInspector_AnimRetargeting_AnimationManager";
const IDBName = "BabylonInspector_AnimRetargeting";
const IDBStore = "animationFiles";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StoredAnimation = {
    /** Unique, immutable identifier generated at creation time. Used as the IndexedDB key prefix. */
    id: string;
    name: string;
    source: "url" | "file";
    url?: string;
    fileNames?: string[];
    namingScheme: string;
    animationGroupName: string;
    restPoseUpdate?: RestPoseDataUpdate;
};

type SerializedData = {
    animations: StoredAnimation[];
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
            if (!db.objectStoreNames.contains("avatarFiles")) {
                db.createObjectStore("avatarFiles");
            }
            if (!db.objectStoreNames.contains(IDBStore)) {
                db.createObjectStore(IDBStore);
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

// ─── AnimationManager ─────────────────────────────────────────────────────────

export class AnimationManager {
    private _animations: StoredAnimation[] = [];

    public constructor() {
        this._loadFromStorage();
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    public getAllAnimations(): readonly StoredAnimation[] {
        return this._animations;
    }

    public getAnimation(name: string): StoredAnimation | undefined {
        return this._animations.find((a) => a.name === name);
    }

    public getAnimationById(id: string): StoredAnimation | undefined {
        return this._animations.find((a) => a.id === id);
    }

    /**
     * Adds or replaces an animation.
     * If the animation has no `id`, one is generated automatically.
     * For file-based animations, the files must already be stored in IndexedDB via `storeFilesAsync`.
     */
    public addAnimation(animation: StoredAnimation): void {
        if (!animation.id) {
            animation.id = GenerateId();
        }
        const idx = this._animations.findIndex((a) => a.id === animation.id);
        if (idx !== -1) {
            this._animations[idx] = animation;
        } else {
            this._animations.push(animation);
        }
        this._saveToStorage();
    }

    /**
     * Removes an animation by id and its associated files from IndexedDB.
     */
    public async removeAnimationAsync(id: string): Promise<void> {
        const animation = this._animations.find((a) => a.id === id);
        if (!animation) {
            return;
        }
        if (animation.source === "file") {
            await IdbDeletePrefix(`animation:${id}/`);
        }
        this._animations = this._animations.filter((a) => a.id !== id);
        this._saveToStorage();
    }

    /**
     * Stores files in IndexedDB for a file-based animation, keyed by its immutable id.
     * @returns The list of file names stored.
     */
    public async storeFilesAsync(animationId: string, files: File[]): Promise<string[]> {
        const fileNames: string[] = [];
        await Promise.all(
            files.map(async (file) => {
                const key = `animation:${animationId}/${file.name}`;
                await IdbPut(key, file);
                fileNames.push(file.name);
            })
        );
        return fileNames;
    }

    /**
     * Retrieves files from IndexedDB for a file-based animation and converts them to File objects.
     */
    public async getFilesAsync(animationId: string, fileNames: string[]): Promise<File[]> {
        const results = await Promise.all(
            fileNames.map(async (fileName) => {
                const key = `animation:${animationId}/${fileName}`;
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
            const raw = localStorage.getItem(AnimationStorageKey);
            if (!raw) {
                return;
            }
            const data: SerializedData = JSON.parse(raw);
            this._animations = data.animations ?? [];
        } catch {
            this._animations = [];
        }
    }

    private _saveToStorage(): void {
        const data: SerializedData = { animations: this._animations };
        localStorage.setItem(AnimationStorageKey, JSON.stringify(data));
    }
}
