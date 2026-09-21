import {
    getRenderingContextKind,
    getRenderingContexts,
    inspectMaterial,
    inspectTexture,
    type EngineContext,
    type Material,
    type MaterialInspection,
    type MaterialTextureBinding,
    type MaterialTextureBindingId,
    type SceneContext,
    type TextureInspection,
} from "@babylonjs/lite";

/**
 * A source material reachable from one or more scenes in an inspected Lite engine.
 * @internal
 */
export interface ILiteMaterialResourceRecord {
    /** The exact source material identity. */
    readonly source: Material;
    /** A safe immutable inspection snapshot for the source. */
    readonly inspection: MaterialInspection;
    /** Every indexed scene that references the source. */
    readonly scenes: readonly SceneContext[];
    /** Canonical material bindings in public API order. */
    readonly bindings: readonly MaterialTextureBinding[];
}

/**
 * One canonical material binding that consumes a texture wrapper.
 * @internal
 */
export interface ILiteTextureConsumerRecord {
    /** The exact source material identity. */
    readonly material: Material;
    /** The canonical semantic binding identifier. */
    readonly bindingId: MaterialTextureBindingId;
}

/**
 * A texture wrapper reachable from one or more indexed material bindings.
 * @internal
 */
export interface ILiteTextureResourceRecord {
    /** The exact Lite texture wrapper identity. */
    readonly entity: object;
    /** A safe immutable inspection snapshot for the wrapper. */
    readonly inspection: TextureInspection;
    /** The stable per-index ordinal assigned when the wrapper is first observed. */
    readonly ordinal: number;
    /** Every canonical binding edge that consumes the wrapper. */
    readonly consumers: readonly ILiteTextureConsumerRecord[];
}

/**
 * Material and texture resources reachable from one Lite scene.
 * @internal
 */
export interface ILiteSceneResourceSnapshot {
    /** The scene represented by this snapshot. */
    readonly scene: SceneContext;
    /** Source materials in first mesh-reference order. */
    readonly materials: readonly ILiteMaterialResourceRecord[];
    /** Exact texture wrappers in first material and canonical binding order. */
    readonly textures: readonly ILiteTextureResourceRecord[];
}

/**
 * A public-state snapshot used to detect resource topology changes.
 * @internal
 */
export type LiteSceneResourceTopologySnapshot = readonly unknown[];

type MaterialDraft = {
    readonly source: Material;
    readonly inspection: MaterialInspection;
    readonly scenes: SceneContext[];
};

type TextureDraft = {
    readonly entity: object;
    readonly inspection: TextureInspection;
    readonly ordinal: number;
    readonly consumers: ILiteTextureConsumerRecord[];
};

function IsObject(value: unknown): value is object {
    return typeof value === "object" && value !== null;
}

function IsMaterialInspection(value: unknown): value is MaterialInspection {
    return IsObject(value) && "source" in value && IsObject(value.source) && "textureBindings" in value && Array.isArray(value.textureBindings);
}

function GetPresentTextureEntity(binding: MaterialTextureBinding): object | undefined {
    if (!IsObject(binding) || !("value" in binding) || !IsObject(binding.value) || binding.value.state !== "present" || !("value" in binding.value)) {
        return undefined;
    }

    const value = binding.value.value;
    return IsObject(value) && "entity" in value && IsObject(value.entity) ? value.entity : undefined;
}

function AppendInspectionValue(snapshot: unknown[], value: unknown): void {
    if (!IsObject(value) || !("state" in value)) {
        snapshot.push("invalid");
        return;
    }

    snapshot.push(value.state);
    if ("reason" in value) {
        snapshot.push(value.reason);
    }
    if ("value" in value) {
        const inspectionValue = value.value;
        if (Array.isArray(inspectionValue)) {
            snapshot.push(...inspectionValue);
        } else if (IsObject(inspectionValue)) {
            snapshot.push(
                "uScale" in inspectionValue ? inspectionValue.uScale : undefined,
                "vScale" in inspectionValue ? inspectionValue.vScale : undefined,
                "uOffset" in inspectionValue ? inspectionValue.uOffset : undefined,
                "vOffset" in inspectionValue ? inspectionValue.vOffset : undefined,
                "uAng" in inspectionValue ? inspectionValue.uAng : undefined
            );
        } else {
            snapshot.push(inspectionValue);
        }
    }
}

function AppendTextureInspection(snapshot: unknown[], inspection: TextureInspection | undefined): void {
    if (!inspection) {
        snapshot.push("stale-texture");
        return;
    }

    snapshot.push(inspection.kind, inspection.width, inspection.height, inspection.sampleCategory, inspection.colorSpace);
    AppendInspectionValue(snapshot, inspection.displayName);
    AppendInspectionValue(snapshot, inspection.origin);
    AppendInspectionValue(snapshot, inspection.depthOrLayers);
    AppendInspectionValue(snapshot, inspection.format);
    AppendInspectionValue(snapshot, inspection.mipLevelCount);
    AppendInspectionValue(snapshot, inspection.invertY);
    AppendInspectionValue(snapshot, inspection.transform);
    AppendInspectionValue(snapshot, inspection.sampler.addressModeU);
    AppendInspectionValue(snapshot, inspection.sampler.addressModeV);
    AppendInspectionValue(snapshot, inspection.sampler.addressModeW);
    AppendInspectionValue(snapshot, inspection.sampler.minFilter);
    AppendInspectionValue(snapshot, inspection.sampler.magFilter);
    AppendInspectionValue(snapshot, inspection.sampler.mipmapFilter);
    AppendInspectionValue(snapshot, inspection.sampler.maxAnisotropy);
    AppendInspectionValue(snapshot, inspection.capabilities.dynamicUpdate);
    AppendInspectionValue(snapshot, inspection.capabilities.htmlReadiness);
    AppendInspectionValue(snapshot, inspection.capabilities.renderAttachment);
    AppendInspectionValue(snapshot, inspection.capabilities.released);
    snapshot.push(inspection.capabilities.sampledDepth);
}

function GetSceneMaterialInspections(scene: SceneContext): readonly MaterialInspection[] {
    const sources = new Set<Material>();
    const inspections: MaterialInspection[] = [];
    if (!Array.isArray(scene.meshes)) {
        return inspections;
    }

    for (const mesh of scene.meshes) {
        if (!IsObject(mesh) || !IsObject(mesh.material)) {
            continue;
        }

        try {
            const inspection = inspectMaterial(mesh.material);
            if (IsMaterialInspection(inspection) && !sources.has(inspection.source)) {
                sources.add(inspection.source);
                inspections.push(inspection);
            }
        } catch {
            // Ignore malformed or stale materials that the Lite inspection API cannot inspect.
        }
    }
    return inspections;
}

/**
 * Maintains deterministic, Inspector-owned resource records for one Lite engine.
 * @internal
 */
export class LiteSceneResourceIndex {
    private _sceneSnapshots = new Map<SceneContext, ILiteSceneResourceSnapshot>();
    private _materialRecords = new Map<Material, ILiteMaterialResourceRecord>();
    private _textureRecords = new Map<object, ILiteTextureResourceRecord>();
    private _textureOrdinals = new WeakMap<object, number>();
    private _nextTextureOrdinal = 1;

    /**
     * Creates an index for an inspected engine and captures its current resources.
     * @param _engine The Lite engine owned by this Inspector instance.
     */
    public constructor(private readonly _engine: EngineContext) {
        this.refresh();
    }

    /**
     * Rebuilds the resource topology from current public scene and binding state.
     */
    public refresh(): void {
        const scenes = this._getScenes();
        const sceneMaterials = new Map<SceneContext, readonly Material[]>();
        const materialDrafts = new Map<Material, MaterialDraft>();

        for (const scene of scenes) {
            const inspections = GetSceneMaterialInspections(scene);
            sceneMaterials.set(
                scene,
                inspections.map((inspection) => inspection.source)
            );
            for (const inspection of inspections) {
                let draft = materialDrafts.get(inspection.source);
                if (!draft) {
                    draft = { source: inspection.source, inspection, scenes: [] };
                    materialDrafts.set(inspection.source, draft);
                }
                draft.scenes.push(scene);
            }
        }

        const materialRecords = new Map<Material, ILiteMaterialResourceRecord>();
        for (const draft of materialDrafts.values()) {
            materialRecords.set(draft.source, {
                source: draft.source,
                inspection: draft.inspection,
                scenes: draft.scenes,
                bindings: draft.inspection.textureBindings,
            });
        }

        const textureDrafts = new Map<object, TextureDraft>();
        for (const material of materialRecords.values()) {
            for (const binding of material.bindings) {
                const entity = GetPresentTextureEntity(binding);
                if (!entity || typeof binding.id !== "string") {
                    continue;
                }

                let texture = textureDrafts.get(entity);
                if (!texture) {
                    let inspection: TextureInspection | undefined;
                    try {
                        inspection = inspectTexture(entity);
                    } catch {
                        continue;
                    }
                    if (!inspection) {
                        continue;
                    }
                    texture = {
                        entity,
                        inspection,
                        ordinal: this._getTextureOrdinal(entity),
                        consumers: [],
                    };
                    textureDrafts.set(entity, texture);
                }
                texture.consumers.push({ material: material.source, bindingId: binding.id });
            }
        }

        const textureRecords = new Map<object, ILiteTextureResourceRecord>();
        for (const draft of textureDrafts.values()) {
            textureRecords.set(draft.entity, {
                entity: draft.entity,
                inspection: draft.inspection,
                ordinal: draft.ordinal,
                consumers: draft.consumers,
            });
        }

        const sceneSnapshots = new Map<SceneContext, ILiteSceneResourceSnapshot>();
        for (const scene of scenes) {
            const materials = (sceneMaterials.get(scene) ?? []).flatMap((source) => {
                const record = materialRecords.get(source);
                return record ? [record] : [];
            });
            const seenTextures = new Set<object>();
            const textures: ILiteTextureResourceRecord[] = [];
            for (const material of materials) {
                for (const binding of material.bindings) {
                    const entity = GetPresentTextureEntity(binding);
                    if (!entity) {
                        continue;
                    }
                    const record = textureRecords.get(entity);
                    if (record && !seenTextures.has(entity)) {
                        seenTextures.add(entity);
                        textures.push(record);
                    }
                }
            }
            sceneSnapshots.set(scene, { scene, materials, textures });
        }

        this._sceneSnapshots = sceneSnapshots;
        this._materialRecords = materialRecords;
        this._textureRecords = textureRecords;
    }

    /**
     * Captures the public identities and binding states that determine the index topology.
     * @returns A snapshot suitable for comparison with {@link AreTopologySnapshotsEqual}.
     */
    public getTopologySnapshot(): LiteSceneResourceTopologySnapshot {
        const snapshot: unknown[] = [];
        for (const surface of this._engine.surfaces) {
            snapshot.push(surface);
            for (const context of getRenderingContexts(surface)) {
                snapshot.push(context);
                if (getRenderingContextKind(context) !== "scene") {
                    continue;
                }

                const scene = context as SceneContext;
                if (!Array.isArray(scene.meshes)) {
                    snapshot.push("invalid-meshes");
                    continue;
                }

                snapshot.push(scene.meshes.length);
                for (const mesh of scene.meshes) {
                    snapshot.push(mesh);
                    if (!IsObject(mesh) || !IsObject(mesh.material)) {
                        snapshot.push(mesh?.material);
                        continue;
                    }

                    snapshot.push(mesh.material);
                    try {
                        const inspection = inspectMaterial(mesh.material);
                        if (!IsMaterialInspection(inspection)) {
                            snapshot.push("invalid-material");
                            continue;
                        }

                        snapshot.push(inspection.source, inspection.family, inspection.displayName, inspection.textureBindings.length);
                        for (const binding of inspection.textureBindings) {
                            snapshot.push(
                                binding.id,
                                binding.label,
                                ...binding.acceptedKinds,
                                binding.sampleCategory,
                                binding.viewCategory,
                                ...binding.directions,
                                binding.mutation.access
                            );
                            if (binding.mutation.access === "read-write") {
                                snapshot.push(binding.mutation.mutation, binding.mutation.postMutation);
                            } else {
                                snapshot.push(binding.mutation.reason);
                            }
                            AppendInspectionValue(snapshot, binding.value);
                            AppendInspectionValue(snapshot, binding.transform);
                            const entity = GetPresentTextureEntity(binding);
                            snapshot.push(entity);
                            if (entity) {
                                try {
                                    AppendTextureInspection(snapshot, inspectTexture(entity));
                                } catch {
                                    AppendTextureInspection(snapshot, undefined);
                                }
                            }
                        }
                    } catch {
                        snapshot.push("stale-material");
                    }
                }
            }
        }
        return snapshot;
    }

    /**
     * Compares two topology snapshots by ordered value identity.
     * @param left The earlier snapshot.
     * @param right The later snapshot.
     * @returns Whether the snapshots represent the same resource topology.
     */
    public static AreTopologySnapshotsEqual(left: LiteSceneResourceTopologySnapshot, right: LiteSceneResourceTopologySnapshot): boolean {
        if (left.length !== right.length) {
            return false;
        }

        for (let index = 0; index < left.length; index++) {
            if (!Object.is(left[index], right[index])) {
                return false;
            }
        }
        return true;
    }

    /**
     * Gets the last captured resources for a scene.
     * @param scene The scene whose resources are requested.
     * @returns Its indexed snapshot, or an empty snapshot when it is not owned by the engine.
     */
    public getSceneSnapshot(scene: SceneContext): ILiteSceneResourceSnapshot {
        return this._sceneSnapshots.get(scene) ?? { scene, materials: [], textures: [] };
    }

    /**
     * Gets the current record for a source material.
     * @param material The source material identity.
     * @returns The material record, if currently reachable.
     */
    public getMaterialRecord(material: Material): ILiteMaterialResourceRecord | undefined {
        return this._materialRecords.get(material);
    }

    /**
     * Gets the current record for an exact texture wrapper.
     * @param texture The texture wrapper identity.
     * @returns The texture record, if currently reachable.
     */
    public getTextureRecord(texture: object): ILiteTextureResourceRecord | undefined {
        return this._textureRecords.get(texture);
    }

    /**
     * Releases all strong resource records owned by this index.
     */
    public dispose(): void {
        this._sceneSnapshots.clear();
        this._materialRecords.clear();
        this._textureRecords.clear();
        this._textureOrdinals = new WeakMap<object, number>();
    }

    private _getTextureOrdinal(texture: object): number {
        let ordinal = this._textureOrdinals.get(texture);
        if (ordinal === undefined) {
            ordinal = this._nextTextureOrdinal++;
            this._textureOrdinals.set(texture, ordinal);
        }
        return ordinal;
    }

    private _getScenes(): readonly SceneContext[] {
        const scenes: SceneContext[] = [];
        const seen = new Set<SceneContext>();
        for (const surface of this._engine.surfaces) {
            for (const context of getRenderingContexts(surface)) {
                if (getRenderingContextKind(context) === "scene" && !seen.has(context as SceneContext)) {
                    const scene = context as SceneContext;
                    seen.add(scene);
                    scenes.push(scene);
                }
            }
        }
        return scenes;
    }
}
