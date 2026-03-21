import type { ISettingsStore, SettingDescriptor } from "../../services/settingsStore";
import type { RestPoseDataUpdate } from "./avatarManager";

const IDBName = "BabylonInspector_AnimRetargeting";
const IDBStore = "animationFiles";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Maps an animation group (by its index in scene.animationGroups) to a user-chosen display name. */
export type AnimationGroupMapping = {
    /** The index of the AnimationGroup in scene.animationGroups — stable across reloads of the same file. */
    index: number;
    /** The original AnimationGroup.name from the file. */
    groupName: string;
    /** User-chosen display name shown in the main UI dropdown. Empty = not included. */
    displayName: string;
};

export type StoredAnimation = {
    /** Unique, immutable identifier generated at creation time. Used as the IndexedDB key prefix. */
    id: string;
    /** User-chosen name for this animation file entry (shown in the list). */
    name: string;
    source: "url" | "file" | "scene";
    url?: string;
    fileNames?: string[];
    namingScheme: string;
    /** User-selected root node for skeleton creation. */
    rootNodeName: string;
    /** One entry per animation group in the file. */
    animations: AnimationGroupMapping[];
    restPoseUpdate?: RestPoseDataUpdate;
    /** When true, this entry is transient and will be purged on next startup. */
    sessionOnly?: boolean;
};

type SerializedData = {
    animations: StoredAnimation[];
};

const AnimationSettingDescriptor: SettingDescriptor<SerializedData> = {
    key: "AnimRetargeting/Animations",
    defaultValue: { animations: [] },
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

    public constructor(private readonly _settingsStore: ISettingsStore) {
        this._loadFromStorage();
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    public getAllAnimations(): readonly StoredAnimation[] {
        return this._animations;
    }

    /** Returns all non-empty display names across all stored animation files. */
    public getAllDisplayNames(): string[] {
        const names: string[] = [];
        for (const entry of this._animations) {
            for (const mapping of entry.animations) {
                if (mapping.displayName) {
                    names.push(mapping.displayName);
                }
            }
        }
        return names;
    }

    /** Finds the stored animation file and specific mapping for a given display name. */
    public getByDisplayName(displayName: string): { entry: StoredAnimation; mapping: AnimationGroupMapping } | undefined {
        if (!displayName) {
            return undefined;
        }
        for (const entry of this._animations) {
            for (const mapping of entry.animations) {
                if (mapping.displayName === displayName) {
                    return { entry, mapping };
                }
            }
        }
        return undefined;
    }

    public getAnimationById(id: string): StoredAnimation | undefined {
        return this._animations.find((a) => a.id === id);
    }

    /** Checks whether a display name is already used by any animation (optionally excluding a specific file id). */
    public isDisplayNameUsed(displayName: string, excludeFileId?: string): boolean {
        for (const entry of this._animations) {
            if (excludeFileId && entry.id === excludeFileId) {
                continue;
            }
            for (const mapping of entry.animations) {
                if (mapping.displayName === displayName) {
                    return true;
                }
            }
        }
        return false;
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

    /**
     * Returns all animations in a JSON-serializable format, including base64-encoded file data for file-based entries.
     * Session-only entries are excluded from the export.
     */
    public async exportDataAsync(): Promise<Array<StoredAnimation & { fileData?: Record<string, string> }>> {
        return await Promise.all(
            this._animations
                .filter((animation) => !animation.sessionOnly)
                .map(async (animation) => {
                    const entry: StoredAnimation & { fileData?: Record<string, string> } = { ...animation };
                    if (animation.source === "file" && animation.fileNames?.length) {
                        const files = await this.getFilesAsync(animation.id, animation.fileNames);
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
     * Imports animations, including restoring file-based entries to IndexedDB from base64 data.
     */
    public async importDataAsync(animations: Array<StoredAnimation & { fileData?: Record<string, string> }>, mode: "replace" | "append"): Promise<string[]> {
        const skipped: string[] = [];

        if (mode === "replace") {
            this._animations = [];
        }

        // Sequential processing needed: each entry may depend on prior state for duplicate detection
        for (const animation of animations) {
            if (mode === "append" && this._animations.some((a) => a.name === animation.name)) {
                skipped.push(`animation "${animation.name}"`);
            } else {
                const newId = GenerateId();
                const { fileData, ...animData } = animation;
                this._animations.push({ ...animData, id: newId });

                if (animData.source === "file" && fileData) {
                    const fileEntries = Object.entries(fileData);
                    // eslint-disable-next-line no-await-in-loop
                    await Promise.all(
                        fileEntries.map(async ([fileName, base64]) => {
                            const blob = Base64ToBlob(base64);
                            await IdbPut(`animation:${newId}/${fileName}`, blob);
                        })
                    );
                    this._animations[this._animations.length - 1].fileNames = fileEntries.map(([n]) => n);
                }
            }
        }

        this._saveToStorage();
        return skipped;
    }

    /**
     * Creates default animation entries if the list is empty.
     */
    public createDefaults(): void {
        if (this._animations.length > 0) {
            return;
        }
        const baseUrl = "https://assets.babylonjs.com/mixamo/Animations/";
        const defaults: { name: string; file: string; scheme: string; displayName: string; rootNode: string }[] = [
            { name: "Rumba Dancing", file: "Rumba Dancing.glb", scheme: "Mixamo", displayName: "Rumba Dancing", rootNode: "mixamorig:Hips" },
            { name: "Hip Hop Dancing", file: "Hip Hop Dancing.glb", scheme: "Mixamo", displayName: "Hip Hop Dancing", rootNode: "mixamorig:Hips" },
            { name: "Sitting Clap", file: "Sitting Clap.glb", scheme: "Mixamo", displayName: "Sitting Clap", rootNode: "mixamorig:Hips" },
            { name: "Walking", file: "Walking.glb", scheme: "Mixamo", displayName: "Walking", rootNode: "mixamorig:Hips" },
            { name: "Catwalk Walking", file: "Catwalk Walking.glb", scheme: "Mixamo", displayName: "Catwalk Walking", rootNode: "mixamorig:Hips" },
            { name: "Praying", file: "Praying.glb", scheme: "Mixamo", displayName: "Praying", rootNode: "mixamorig:Hips" },
            { name: "Mousey Walking", file: "Mousey_walking.glb", scheme: "Mixamo", displayName: "Mousey Walking", rootNode: "mixamorig:Hips" },
        ];
        for (const d of defaults) {
            this.addAnimation({
                id: "",
                name: d.name,
                source: "url",
                url: baseUrl + d.file,
                namingScheme: d.scheme,
                rootNodeName: d.rootNode,
                animations: [{ index: 0, groupName: d.displayName, displayName: d.displayName }],
            });
        }
    }

    /**
     * Removes all session-only entries and saves the updated list.
     */
    public purgeSessionOnly(): void {
        const before = this._animations.length;
        this._animations = this._animations.filter((a) => !a.sessionOnly);
        if (this._animations.length !== before) {
            this._saveToStorage();
        }
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private _loadFromStorage(): void {
        try {
            const data = this._settingsStore.readSetting(AnimationSettingDescriptor);
            // Migrate old format: entries with `animationGroupName` but no `animations` array
            this._animations = (data.animations ?? []).map((entry: StoredAnimation & { animationGroupName?: string }) => {
                if (!entry.animations) {
                    entry.animations = [];
                    if (entry.animationGroupName) {
                        entry.animations.push({
                            index: 0,
                            groupName: entry.animationGroupName,
                            displayName: entry.name || entry.animationGroupName,
                        });
                    }
                    if (!entry.name) {
                        entry.name = entry.animationGroupName ?? "Unnamed";
                    }
                    delete entry.animationGroupName;
                }
                if (!entry.name) {
                    entry.name = "Unnamed";
                }
                if (!entry.rootNodeName) {
                    entry.rootNodeName = "";
                }
                return entry as StoredAnimation;
            });
        } catch {
            this._animations = [];
        }
    }

    private _saveToStorage(): void {
        const data: SerializedData = { animations: this._animations };
        this._settingsStore.writeSetting(AnimationSettingDescriptor, data);
    }
}
