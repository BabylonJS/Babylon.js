const StorageKey = "BabylonInspector_AnimRetargeting_NamingSchemeManager";

/**
 * A bone/node entry in a naming scheme.
 * `depth` encodes the parent-child hierarchy: a depth-N entry is a child of the nearest preceding entry with depth N-1.
 */
export type BoneEntry = { name: string; depth: number };

// prettier-ignore
const MixamoBones: BoneEntry[] = [
    { name: "mixamorig:Hips", depth: 0 },
    { name: "mixamorig:Spine", depth: 1 },
    { name: "mixamorig:Spine1", depth: 2 },
    { name: "mixamorig:Spine2", depth: 3 },
    { name: "mixamorig:Neck", depth: 4 },
    { name: "mixamorig:Head", depth: 5 },
    { name: "mixamorig:HeadTop_End", depth: 6 },
    { name: "mixamorig:HeadTop_End1", depth: 7 },
    { name: "mixamorig:Hair_Back", depth: 6 },
    { name: "mixamorig:LeftEye", depth: 6 },
    { name: "mixamorig:RightEye", depth: 6 },
    { name: "mixamorig:LeftShoulder", depth: 4 },
    { name: "mixamorig:LeftArm", depth: 5 },
    { name: "mixamorig:LeftForeArm", depth: 6 },
    { name: "mixamorig:LeftHand", depth: 7 },
    { name: "mixamorig:LeftHandThumb1", depth: 8 },
    { name: "mixamorig:LeftHandThumb2", depth: 9 },
    { name: "mixamorig:LeftHandThumb3", depth: 10 },
    { name: "mixamorig:LeftHandThumb4", depth: 11 },
    { name: "mixamorig:LeftHandIndex1", depth: 8 },
    { name: "mixamorig:LeftHandIndex2", depth: 9 },
    { name: "mixamorig:LeftHandIndex3", depth: 10 },
    { name: "mixamorig:LeftHandIndex4", depth: 11 },
    { name: "mixamorig:LeftHandMiddle1", depth: 8 },
    { name: "mixamorig:LeftHandMiddle2", depth: 9 },
    { name: "mixamorig:LeftHandMiddle3", depth: 10 },
    { name: "mixamorig:LeftHandMiddle4", depth: 11 },
    { name: "mixamorig:LeftHandRing1", depth: 8 },
    { name: "mixamorig:LeftHandRing2", depth: 9 },
    { name: "mixamorig:LeftHandRing3", depth: 10 },
    { name: "mixamorig:LeftHandRing4", depth: 11 },
    { name: "mixamorig:LeftHandPinky1", depth: 8 },
    { name: "mixamorig:LeftHandPinky2", depth: 9 },
    { name: "mixamorig:LeftHandPinky3", depth: 10 },
    { name: "mixamorig:LeftHandPinky4", depth: 11 },
    { name: "mixamorig:Left_CapeC", depth: 7 },
    { name: "mixamorig:Left_CapeC1", depth: 8 },
    { name: "mixamorig:Left_CapeB", depth: 6 },
    { name: "mixamorig:Left_CapeB1", depth: 7 },
    { name: "mixamorig:Left_CapeA", depth: 6 },
    { name: "mixamorig:Left_CapeA1", depth: 7 },
    { name: "mixamorig:RightShoulder", depth: 4 },
    { name: "mixamorig:RightArm", depth: 5 },
    { name: "mixamorig:RightForeArm", depth: 6 },
    { name: "mixamorig:RightHand", depth: 7 },
    { name: "mixamorig:RightHandThumb1", depth: 8 },
    { name: "mixamorig:RightHandThumb2", depth: 9 },
    { name: "mixamorig:RightHandThumb3", depth: 10 },
    { name: "mixamorig:RightHandThumb4", depth: 11 },
    { name: "mixamorig:RightHandIndex1", depth: 8 },
    { name: "mixamorig:RightHandIndex2", depth: 9 },
    { name: "mixamorig:RightHandIndex3", depth: 10 },
    { name: "mixamorig:RightHandIndex4", depth: 11 },
    { name: "mixamorig:RightHandMiddle1", depth: 8 },
    { name: "mixamorig:RightHandMiddle2", depth: 9 },
    { name: "mixamorig:RightHandMiddle3", depth: 10 },
    { name: "mixamorig:RightHandMiddle4", depth: 11 },
    { name: "mixamorig:RightHandRing1", depth: 8 },
    { name: "mixamorig:RightHandRing2", depth: 9 },
    { name: "mixamorig:RightHandRing3", depth: 10 },
    { name: "mixamorig:RightHandRing4", depth: 11 },
    { name: "mixamorig:RightHandPinky1", depth: 8 },
    { name: "mixamorig:RightHandPinky2", depth: 9 },
    { name: "mixamorig:RightHandPinky3", depth: 10 },
    { name: "mixamorig:RightHandPinky4", depth: 11 },
    { name: "mixamorig:Right_CapeC", depth: 7 },
    { name: "mixamorig:Right_CapeC1", depth: 7 },
    { name: "mixamorig:Right_CapeB", depth: 6 },
    { name: "mixamorig:Right_CapeB1", depth: 7 },
    { name: "mixamorig:Right_CapeA", depth: 6 },
    { name: "mixamorig:Right_CapeA1", depth: 7 },
    { name: "mixamorig:Right_Peck", depth: 4 },
    { name: "mixamorig:Left_Peck", depth: 4 },
    { name: "mixamorig:Left_Collar", depth: 4 },
    { name: "mixamorig:Left_Collar1", depth: 5 },
    { name: "mixamorig:Right_Collar", depth: 4 },
    { name: "mixamorig:Right_Collar1", depth: 5 },
    { name: "mixamorig:Belly", depth: 2 },
    { name: "mixamorig:LeftUpLeg", depth: 1 },
    { name: "mixamorig:LeftLeg", depth: 2 },
    { name: "mixamorig:LeftFoot", depth: 3 },
    { name: "mixamorig:LeftToeBase", depth: 4 },
    { name: "mixamorig:LeftToe_End", depth: 5 },
    { name: "mixamorig:RightUpLeg", depth: 1 },
    { name: "mixamorig:RightLeg", depth: 2 },
    { name: "mixamorig:RightFoot", depth: 3 },
    { name: "mixamorig:RightToeBase", depth: 4 },
    { name: "mixamorig:RightToe_End", depth: 5 },
    { name: "mixamorig:Crotch1", depth: 1 },
    { name: "mixamorig:Crotch2", depth: 2 },
    { name: "mixamorig:Crotch3", depth: 1 },
    { name: "mixamorig:Crotch4", depth: 2 },
];

type StoredRemapping = {
    fromScheme: string;
    toScheme: string;
    map: [string, string][];
};

type StoredData = {
    schemes: { [name: string]: BoneEntry[] };
    remappings: StoredRemapping[];
};

/**
 * Manages named sets of bone/node names ("naming schemes") and the remappings between them.
 * Data is persisted to localStorage and reloaded on construction.
 *
 * A naming scheme is a name + an ordered list of bone/node name strings.
 * A remapping maps a subset of names from one scheme to names in another scheme.
 * Mapping to an empty string is valid and means "no suitable counterpart exists".
 */
export class NamingSchemeManager {
    private _schemes: Map<string, BoneEntry[]> = new Map();
    private _remappings: Array<{ fromScheme: string; toScheme: string; map: Map<string, string> }> = [];

    constructor() {
        this._loadFromStorage();
    }

    // ─── Public methods ───────────────────────────────────────────────────────

    /**
     * Creates or replaces a naming scheme.
     * @param name - Unique identifier for the scheme.
     * @param entries - Ordered list of bone/node entries (name + hierarchy depth) belonging to the scheme.
     */
    public addNamingScheme(name: string, entries: BoneEntry[]): void {
        this._schemes.set(name, [...entries]);
        this._saveToStorage();
    }

    /**
     * Returns the list of bone entries for the given scheme, or undefined if it does not exist.
     */
    public getNamingScheme(name: string): BoneEntry[] | undefined {
        const scheme = this._schemes.get(name);
        return scheme ? [...scheme] : undefined;
    }

    /**
     * Returns the names of all registered naming schemes.
     */
    public getAllSchemeNames(): string[] {
        return Array.from(this._schemes.keys());
    }

    /**
     * Returns all stored remappings as an array of { fromScheme, toScheme } pairs.
     * These reflect the direction in which remappings were originally added.
     */
    public getAllRemappings(): Array<{ fromScheme: string; toScheme: string }> {
        return this._remappings.map((r) => ({ fromScheme: r.fromScheme, toScheme: r.toScheme }));
    }

    /**
     * Recreates any missing default naming schemes (Mixamo, Mixamo No Namespace).
     * Existing schemes with those names are not modified.
     * @returns true if at least one scheme was added.
     */
    public recreateDefaultSchemes(): boolean {
        let changed = false;
        if (!this._schemes.has("Mixamo")) {
            this._schemes.set("Mixamo", [...MixamoBones]);
            changed = true;
        }
        if (!this._schemes.has("Mixamo No Namespace")) {
            this._schemes.set(
                "Mixamo No Namespace",
                MixamoBones.map((e) => ({ name: e.name.replace("mixamorig:", ""), depth: e.depth }))
            );
            changed = true;
        }
        if (changed) {
            this._saveToStorage();
        }
        return changed;
    }

    /**
     * Recreates any missing default remappings (Mixamo ↔ Mixamo No Namespace).
     * Also ensures the required schemes exist, creating any that are absent.
     * Existing remappings are not modified.
     * @returns true if at least one remapping or scheme was added.
     */
    public recreateDefaultRemappings(): boolean {
        let changed = false;

        // Ensure default schemes exist before building remappings.
        if (!this._schemes.has("Mixamo")) {
            this._schemes.set("Mixamo", [...MixamoBones]);
            changed = true;
        }
        if (!this._schemes.has("Mixamo No Namespace")) {
            this._schemes.set(
                "Mixamo No Namespace",
                MixamoBones.map((e) => ({ name: e.name.replace("mixamorig:", ""), depth: e.depth }))
            );
            changed = true;
        }

        // Mixamo → Mixamo No Namespace
        if (!this._remappings.some((r) => this._sameSchemes(r, "Mixamo", "Mixamo No Namespace"))) {
            const map = new Map<string, string>();
            for (const entry of MixamoBones) {
                map.set(entry.name, entry.name.replace("mixamorig:", ""));
            }
            this._remappings.push({ fromScheme: "Mixamo", toScheme: "Mixamo No Namespace", map });
            changed = true;
        }

        if (changed) {
            this._saveToStorage();
        }
        return changed;
    }

    /**
     * Removes a naming scheme and all remappings that reference it.
     * @throws Error if the scheme does not exist.
     */
    public removeNamingScheme(name: string): void {
        if (!this._schemes.has(name)) {
            throw new Error(`Naming scheme "${name}" does not exist.`);
        }
        this._schemes.delete(name);
        this._remappings = this._remappings.filter((r) => r.fromScheme !== name && r.toScheme !== name);
        this._saveToStorage();
    }

    /**
     * Adds a remapping from one naming scheme to another.
     *
     * Each key of `map` must exist in the `fromSchemeName` scheme.
     * Each value of `map` must exist in the `toSchemeName` scheme, or be an empty string
     * (indicating no suitable counterpart in the target scheme).
     *
     * Only a subset of names needs to be remapped — unmapped names are simply absent from the map.
     *
     * If a remapping between these two schemes already exists (in either direction), it is replaced.
     *
     * @throws Error if either scheme does not exist, or if any map entry violates the constraints.
     */
    public addRemapping(fromSchemeName: string, toSchemeName: string, map: Map<string, string>): void {
        const fromScheme = this._schemes.get(fromSchemeName);
        if (!fromScheme) {
            throw new Error(`Naming scheme "${fromSchemeName}" does not exist.`);
        }
        const toScheme = this._schemes.get(toSchemeName);
        if (!toScheme) {
            throw new Error(`Naming scheme "${toSchemeName}" does not exist.`);
        }

        const fromSet = new Set(fromScheme.map((e) => e.name));
        const toSet = new Set(toScheme.map((e) => e.name));

        for (const [key, value] of map) {
            if (!fromSet.has(key)) {
                throw new Error(`Key "${key}" is not in naming scheme "${fromSchemeName}".`);
            }
            if (value !== "" && !toSet.has(value)) {
                throw new Error(`Value "${value}" is not in naming scheme "${toSchemeName}".`);
            }
        }

        // Replace any existing remapping between these two schemes (either direction).
        this._remappings = this._remappings.filter((r) => !this._sameSchemes(r, fromSchemeName, toSchemeName));
        this._remappings.push({ fromScheme: fromSchemeName, toScheme: toSchemeName, map: new Map(map) });
        this._saveToStorage();
    }

    /**
     * Returns the remapping from `fromSchemeName` to `toSchemeName`.
     *
     * Remappings are treated as **bidirectional** (a→b is the same edge as b→a) and **transitive**:
     * if no direct remapping exists, the method searches for a path through intermediate schemes
     * uses Breadth-First Search (BFS) and composes the maps along the path.
     *
     * For example, if a→b and b→c are stored, `getRemapping("a","c")` composes them.
     * Likewise, since a→b implies b→a, `getRemapping("c","a")` is also derivable.
     *
     * @returns A Map from names in `fromSchemeName` to names in `toSchemeName`, or undefined if
     *          no path exists between the two schemes.
     */
    public getRemapping(fromSchemeName: string, toSchemeName: string): Map<string, string> | undefined {
        // Breadth-First Search (BFS) to find the shortest path in the undirected remapping graph.
        const visited = new Set<string>([fromSchemeName]);
        const queue: string[][] = [[fromSchemeName]];

        while (queue.length > 0) {
            const path = queue.shift()!;
            const current = path[path.length - 1];

            for (const r of this._remappings) {
                let neighbor: string | null = null;
                if (r.fromScheme === current && !visited.has(r.toScheme)) {
                    neighbor = r.toScheme;
                } else if (r.toScheme === current && !visited.has(r.fromScheme)) {
                    neighbor = r.fromScheme;
                }
                if (neighbor === null) {
                    continue;
                }
                const newPath = [...path, neighbor];
                if (neighbor === toSchemeName) {
                    return this._composePath(newPath);
                }
                visited.add(neighbor);
                queue.push(newPath);
            }
        }
        return undefined;
    }

    /** Returns the single-step map from one scheme to an adjacent one (forward or inverse). */
    private _getDirectMap(fromScheme: string, toScheme: string): Map<string, string> | undefined {
        for (const r of this._remappings) {
            if (r.fromScheme === fromScheme && r.toScheme === toScheme) {
                return new Map(r.map);
            }
            if (r.fromScheme === toScheme && r.toScheme === fromScheme) {
                const inverse = new Map<string, string>();
                for (const [k, v] of r.map) {
                    if (v !== "") {
                        inverse.set(v, k);
                    }
                }
                return inverse;
            }
        }
        return undefined;
    }

    /** Composes the per-step maps along a BFS (Breadth-First Search) path into a single from→to map. */
    private _composePath(path: string[]): Map<string, string> | undefined {
        let result = this._getDirectMap(path[0], path[1]);
        if (!result) {
            return undefined;
        }
        for (let i = 1; i < path.length - 1; i++) {
            const next = this._getDirectMap(path[i], path[i + 1]);
            if (!next) {
                return undefined;
            }
            const composed = new Map<string, string>();
            for (const [k, v] of result) {
                composed.set(k, v !== "" ? (next.get(v) ?? "") : "");
            }
            result = composed;
        }
        return result;
    }

    /**
     * Returns all naming schemes and remappings in a JSON-serializable format.
     */
    public exportData(): { schemes: Record<string, BoneEntry[]>; remappings: Array<{ fromScheme: string; toScheme: string; map: [string, string][] }> } {
        const schemes: Record<string, BoneEntry[]> = {};
        for (const [name, entries] of this._schemes) {
            schemes[name] = [...entries];
        }
        const remappings: Array<{ fromScheme: string; toScheme: string; map: [string, string][] }> = [];
        for (const r of this._remappings) {
            remappings.push({
                fromScheme: r.fromScheme,
                toScheme: r.toScheme,
                map: Array.from(r.map.entries()),
            });
        }
        return { schemes, remappings };
    }

    /**
     * Imports naming schemes and remappings.
     * @param data - The data to import, in the same format as `exportData` returns.
     * @param mode - "replace" clears all existing data first. "append" skips entries with duplicate names.
     * @returns List of skipped entry descriptions (for "append" mode).
     */
    public importData(
        data: { schemes?: Record<string, BoneEntry[]>; remappings?: Array<{ fromScheme: string; toScheme: string; map: [string, string][] }> },
        mode: "replace" | "append"
    ): string[] {
        const skipped: string[] = [];

        if (mode === "replace") {
            this._schemes.clear();
            this._remappings = [];
        }

        if (data.schemes) {
            for (const [name, entries] of Object.entries(data.schemes)) {
                if (mode === "append" && this._schemes.has(name)) {
                    skipped.push(`scheme "${name}"`);
                } else {
                    this._schemes.set(name, [...entries]);
                }
            }
        }

        if (data.remappings) {
            for (const r of data.remappings) {
                if (mode === "append" && this._remappings.some((existing) => this._sameSchemes(existing, r.fromScheme, r.toScheme))) {
                    skipped.push(`remapping "${r.fromScheme}" ↔ "${r.toScheme}"`);
                } else {
                    if (mode === "append") {
                        // Remove any existing remapping between these schemes before adding.
                        this._remappings = this._remappings.filter((existing) => !this._sameSchemes(existing, r.fromScheme, r.toScheme));
                    }
                    this._remappings.push({ fromScheme: r.fromScheme, toScheme: r.toScheme, map: new Map(r.map) });
                }
            }
        }

        this._saveToStorage();
        return skipped;
    }

    /**
     * Removes the remapping between the two given schemes (regardless of the direction it was stored in).
     * @throws Error if no such remapping exists.
     */
    public removeRemapping(schemeAName: string, schemeBName: string): void {
        const before = this._remappings.length;
        this._remappings = this._remappings.filter((r) => !this._sameSchemes(r, schemeAName, schemeBName));
        if (this._remappings.length === before) {
            throw new Error(`No remapping found between "${schemeAName}" and "${schemeBName}".`);
        }
        this._saveToStorage();
    }

    // ─── Private methods ──────────────────────────────────────────────────────

    private _sameSchemes(r: { fromScheme: string; toScheme: string }, a: string, b: string): boolean {
        return (r.fromScheme === a && r.toScheme === b) || (r.fromScheme === b && r.toScheme === a);
    }

    private _saveToStorage(): void {
        const data: StoredData = {
            schemes: {},
            remappings: [],
        };
        for (const [name, names] of this._schemes) {
            data.schemes[name] = names;
        }
        for (const r of this._remappings) {
            data.remappings.push({
                fromScheme: r.fromScheme,
                toScheme: r.toScheme,
                map: Array.from(r.map.entries()),
            });
        }
        try {
            localStorage.setItem(StorageKey, JSON.stringify(data));
        } catch {
            // Storage may be unavailable (e.g. private browsing quota exceeded).
        }
    }

    private _loadFromStorage(): void {
        try {
            const raw = localStorage.getItem(StorageKey);
            if (!raw) {
                this._createDefaultSchemes();
                return;
            }
            const data: StoredData = JSON.parse(raw);
            for (const [name, entries] of Object.entries(data.schemes)) {
                this._schemes.set(name, entries as BoneEntry[]);
            }
            for (const { fromScheme, toScheme, map } of data.remappings) {
                this._remappings.push({ fromScheme, toScheme, map: new Map(map) });
            }
        } catch {
            // Ignore corrupted or missing storage data.
        }
    }

    private _createDefaultSchemes(): void {
        this._schemes.set("Mixamo", [...MixamoBones]);
        this._schemes.set(
            "Mixamo No Namespace",
            MixamoBones.map((e) => ({ name: e.name.replace("mixamorig:", ""), depth: e.depth }))
        );

        // Mixamo → Mixamo No Namespace remapping.
        const mixamoMap = new Map<string, string>();
        for (const entry of MixamoBones) {
            mixamoMap.set(entry.name, entry.name.replace("mixamorig:", ""));
        }
        this._remappings.push({ fromScheme: "Mixamo", toScheme: "Mixamo No Namespace", map: mixamoMap });

        this._saveToStorage();
    }
}
