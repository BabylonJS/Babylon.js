const StorageKey = "BabylonInspector_NamingSchemeManager";

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

// prettier-ignore
// Each entry carries the Mixamo No Namespace name, the Dude bone name, and the depth of the Dude bone.
// An empty mixamoNoNs string means no counterpart exists for that Dude bone.
const DudeRemapToMixamo: Array<{ mixamoNoNs: string; dude: string; depth: number }> = [
    { mixamoNoNs: "Hips", dude: "bone0", depth: 0 },
    { mixamoNoNs: "", dude: "bone1", depth: 0 },
    { mixamoNoNs: "Spine", dude: "bone2", depth: 1 },
    { mixamoNoNs: "Spine1", dude: "bone3", depth: 2 },
    { mixamoNoNs: "Spine2", dude: "bone4", depth: 3 },
    { mixamoNoNs: "", dude: "bone5", depth: 3 },
    { mixamoNoNs: "", dude: "bone6", depth: 3 },
    { mixamoNoNs: "Neck", dude: "bone7", depth: 4 },
    { mixamoNoNs: "", dude: "bone8", depth: 4 },
    { mixamoNoNs: "", dude: "bone9", depth: 4 },
    { mixamoNoNs: "RightEye", dude: "bone10", depth: 5 },
    { mixamoNoNs: "LeftEye", dude: "bone11", depth: 5 },
    { mixamoNoNs: "RightShoulder", dude: "bone12", depth: 4 },
    { mixamoNoNs: "RightArm", dude: "bone13", depth: 5 },
    { mixamoNoNs: "RightForeArm", dude: "bone14", depth: 6 },
    { mixamoNoNs: "RightHand", dude: "bone15", depth: 7 },
    { mixamoNoNs: "RightHandThumb1", dude: "bone16", depth: 8 },
    { mixamoNoNs: "RightHandThumb2", dude: "bone17", depth: 9 },
    { mixamoNoNs: "RightHandThumb3", dude: "bone18", depth: 10 },
    { mixamoNoNs: "RightHandIndex1", dude: "bone19", depth: 8 },
    { mixamoNoNs: "RightHandIndex2", dude: "bone20", depth: 9 },
    { mixamoNoNs: "RightHandIndex3", dude: "bone21", depth: 10 },
    { mixamoNoNs: "RightHandMiddle1", dude: "bone22", depth: 8 },
    { mixamoNoNs: "RightHandMiddle2", dude: "bone23", depth: 9 },
    { mixamoNoNs: "RightHandMiddle3", dude: "bone24", depth: 10 },
    { mixamoNoNs: "RightHandRing1", dude: "bone25", depth: 8 },
    { mixamoNoNs: "RightHandRing2", dude: "bone26", depth: 9 },
    { mixamoNoNs: "RightHandRing3", dude: "bone27", depth: 10 },
    { mixamoNoNs: "RightHandPinky1", dude: "bone28", depth: 8 },
    { mixamoNoNs: "RightHandPinky2", dude: "bone29", depth: 9 },
    { mixamoNoNs: "RightHandPinky3", dude: "bone30", depth: 10 },
    { mixamoNoNs: "LeftShoulder", dude: "bone31", depth: 4 },
    { mixamoNoNs: "LeftArm", dude: "bone32", depth: 5 },
    { mixamoNoNs: "LeftForeArm", dude: "bone33", depth: 6 },
    { mixamoNoNs: "LeftHand", dude: "bone34", depth: 7 },
    { mixamoNoNs: "LeftHandThumb1", dude: "bone35", depth: 8 },
    { mixamoNoNs: "LeftHandThumb2", dude: "bone36", depth: 9 },
    { mixamoNoNs: "LeftHandThumb3", dude: "bone37", depth: 10 },
    { mixamoNoNs: "LeftHandIndex1", dude: "bone38", depth: 8 },
    { mixamoNoNs: "LeftHandIndex2", dude: "bone39", depth: 9 },
    { mixamoNoNs: "LeftHandIndex3", dude: "bone40", depth: 10 },
    { mixamoNoNs: "LeftHandMiddle1", dude: "bone41", depth: 8 },
    { mixamoNoNs: "LeftHandMiddle2", dude: "bone42", depth: 9 },
    { mixamoNoNs: "LeftHandMiddle3", dude: "bone43", depth: 10 },
    { mixamoNoNs: "LeftHandRing1", dude: "bone44", depth: 8 },
    { mixamoNoNs: "LeftHandRing2", dude: "bone45", depth: 9 },
    { mixamoNoNs: "LeftHandRing3", dude: "bone46", depth: 10 },
    { mixamoNoNs: "LeftHandPinky1", dude: "bone47", depth: 8 },
    { mixamoNoNs: "LeftHandPinky2", dude: "bone48", depth: 9 },
    { mixamoNoNs: "LeftHandPinky3", dude: "bone49", depth: 10 },
    { mixamoNoNs: "RightUpLeg", dude: "bone50", depth: 1 },
    { mixamoNoNs: "RightLeg", dude: "bone51", depth: 2 },
    { mixamoNoNs: "RightFoot", dude: "bone52", depth: 3 },
    { mixamoNoNs: "RightToeBase", dude: "bone53", depth: 4 },
    { mixamoNoNs: "LeftUpLeg", dude: "bone54", depth: 1 },
    { mixamoNoNs: "LeftLeg", dude: "bone55", depth: 2 },
    { mixamoNoNs: "LeftFoot", dude: "bone56", depth: 3 },
    { mixamoNoNs: "LeftToeBase", dude: "bone57", depth: 4 },
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
     * Recreates any missing default naming schemes (Mixamo, Mixamo No Namespace, Dude).
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
        if (!this._schemes.has("Dude")) {
            this._schemes.set(
                "Dude",
                DudeRemapToMixamo.map((e) => ({ name: e.dude, depth: e.depth }))
            );
            changed = true;
        }
        if (changed) {
            this._saveToStorage();
        }
        return changed;
    }

    /**
     * Recreates any missing default remappings (Mixamo ↔ Mixamo No Namespace, Dude ↔ Mixamo No Namespace,
     * Dude ↔ Mixamo). Also ensures the required schemes exist, creating any that are absent.
     * Existing remappings are not modified.
     * @returns true if at least one remapping or scheme was added.
     */
    public recreateDefaultRemappings(): boolean {
        let changed = false;

        // Ensure all three default schemes exist before building remappings.
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
        if (!this._schemes.has("Dude")) {
            this._schemes.set(
                "Dude",
                DudeRemapToMixamo.map((e) => ({ name: e.dude, depth: e.depth }))
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

        // Dude → Mixamo No Namespace
        if (!this._remappings.some((r) => this._sameSchemes(r, "Dude", "Mixamo No Namespace"))) {
            const map = new Map<string, string>();
            for (const entry of DudeRemapToMixamo) {
                map.set(entry.dude, entry.mixamoNoNs);
            }
            this._remappings.push({ fromScheme: "Dude", toScheme: "Mixamo No Namespace", map });
            changed = true;
        }

        // Dude → Mixamo
        if (!this._remappings.some((r) => this._sameSchemes(r, "Dude", "Mixamo"))) {
            const map = new Map<string, string>();
            for (const entry of DudeRemapToMixamo) {
                map.set(entry.dude, entry.mixamoNoNs !== "" ? "mixamorig:" + entry.mixamoNoNs : "");
            }
            this._remappings.push({ fromScheme: "Dude", toScheme: "Mixamo", map });
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
        this._schemes.set(
            "Dude",
            DudeRemapToMixamo.map((e) => ({ name: e.dude, depth: e.depth }))
        );

        // Mixamo → Mixamo No Namespace remapping.
        const mixamoMap = new Map<string, string>();
        for (const entry of MixamoBones) {
            mixamoMap.set(entry.name, entry.name.replace("mixamorig:", ""));
        }
        this._remappings.push({ fromScheme: "Mixamo", toScheme: "Mixamo No Namespace", map: mixamoMap });

        // Dude → Mixamo No Namespace remapping.
        const dudeToNoNsMap = new Map<string, string>();
        for (const entry of DudeRemapToMixamo) {
            dudeToNoNsMap.set(entry.dude, entry.mixamoNoNs);
        }
        this._remappings.push({ fromScheme: "Dude", toScheme: "Mixamo No Namespace", map: dudeToNoNsMap });

        // Dude → Mixamo (full namespace) remapping.
        const dudeToMixamoMap = new Map<string, string>();
        for (const entry of DudeRemapToMixamo) {
            dudeToMixamoMap.set(entry.dude, entry.mixamoNoNs !== "" ? "mixamorig:" + entry.mixamoNoNs : "");
        }
        this._remappings.push({ fromScheme: "Dude", toScheme: "Mixamo", map: dudeToMixamoMap });

        this._saveToStorage();
    }
}
