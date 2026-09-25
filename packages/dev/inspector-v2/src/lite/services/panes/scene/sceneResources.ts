import {
    getMaterialFamily,
    getMaterialSource,
    getRenderingContextKind,
    getRenderingContexts,
    getTextureCoordinateIndex,
    getTextureMetadata,
    getTextureTransform,
    hasTextureTransform,
    type EngineContext,
    type Material,
    type SceneContext,
    type Texture2D,
    type TextureMetadata,
} from "@babylonjs/lite";

import { GetMaterialTopologyBindings, type IMaterialTopologyBinding } from "./materialTopologyBindings";

/** A source material reachable from one or more scenes in an inspected Lite engine. @internal */
export interface IMaterialResourceRecord {
    readonly source: Material;
    readonly family: string | undefined;
    readonly displayName: string;
    readonly scenes: readonly SceneContext[];
    readonly bindings: readonly IMaterialTopologyBinding[];
}

/** One canonical material binding that consumes a texture wrapper. @internal */
export interface ITextureConsumerRecord {
    readonly material: Material;
    readonly bindingId: string;
}

/** A texture wrapper reachable from one or more indexed material bindings. @internal */
export interface ITextureResourceRecord {
    readonly entity: object;
    readonly metadata: TextureMetadata;
    readonly ordinal: number;
    readonly consumers: readonly ITextureConsumerRecord[];
}

/** Material and texture resources reachable from one Lite scene. @internal */
export interface ISceneResourceSnapshot {
    readonly scene: SceneContext;
    readonly materials: readonly IMaterialResourceRecord[];
    readonly textures: readonly ITextureResourceRecord[];
}

/** A public-state snapshot used to detect resource topology changes. @internal */
export type SceneResourceTopologySnapshot = readonly unknown[];

type MaterialDraft = {
    readonly source: Material;
    readonly family: string | undefined;
    readonly displayName: string;
    readonly scenes: SceneContext[];
    readonly bindings: readonly IMaterialTopologyBinding[];
};

type TextureDraft = {
    readonly entity: object;
    readonly metadata: TextureMetadata;
    readonly ordinal: number;
    readonly consumers: ITextureConsumerRecord[];
};

function IsObject(value: unknown): value is object {
    return typeof value === "object" && value !== null;
}

function GetSceneMaterials(scene: SceneContext): readonly Material[] {
    const sources = new Set<Material>();
    const materials: Material[] = [];
    if (!Array.isArray(scene.meshes)) {
        return materials;
    }

    for (const mesh of scene.meshes) {
        if (!IsObject(mesh) || !IsObject(mesh.material)) {
            continue;
        }
        try {
            const source = getMaterialSource(mesh.material);
            if (!sources.has(source)) {
                sources.add(source);
                materials.push(source);
            }
        } catch {
            // Stale or malformed materials are omitted until a later topology update.
        }
    }
    return materials;
}

function AppendTextureState(snapshot: unknown[], texture: object): void {
    try {
        const metadata = getTextureMetadata(texture);
        if (!metadata) {
            snapshot.push("stale-texture");
            return;
        }
        const texture2d = texture as Texture2D;
        snapshot.push(
            metadata.kind,
            metadata.name,
            metadata.origin,
            metadata.width,
            metadata.height,
            metadata.layers,
            metadata.depth,
            metadata.format,
            metadata.mipLevelCount,
            metadata.sampleType,
            metadata.colorSpace,
            metadata.invertY,
            metadata.sampler?.addressModeU,
            metadata.sampler?.addressModeV,
            metadata.sampler?.addressModeW,
            metadata.sampler?.minFilter,
            metadata.sampler?.magFilter,
            metadata.sampler?.mipmapFilter,
            metadata.sampler?.maxAnisotropy,
            metadata.capabilities.renderAttachment,
            metadata.capabilities.dynamicUpdate,
            metadata.capabilities.sampledDepth,
            getTextureCoordinateIndex(texture2d),
            hasTextureTransform(texture2d)
        );
        if (hasTextureTransform(texture2d)) {
            const transform = getTextureTransform(texture2d);
            snapshot.push(transform?.uOffset, transform?.vOffset, transform?.uScale, transform?.vScale, transform?.uAng);
        }
    } catch {
        snapshot.push("stale-texture");
    }
}

/**
 * Maintains deterministic, Inspector-owned resource records for one Lite engine.
 * @internal
 */
export class SceneResourceIndex {
    private _sceneSnapshots = new Map<SceneContext, ISceneResourceSnapshot>();
    private _materialRecords = new Map<Material, IMaterialResourceRecord>();
    private _textureRecords = new Map<object, ITextureResourceRecord>();
    private _textureOrdinals = new WeakMap<object, number>();
    private _nextTextureOrdinal = 1;

    public constructor(private readonly _engine: EngineContext) {
        this.refresh();
    }

    /** Rebuilds the resource topology from current public scene and binding state. */
    public refresh(): void {
        const scenes = this._getScenes();
        const sceneMaterials = new Map<SceneContext, readonly Material[]>();
        const materialDrafts = new Map<Material, MaterialDraft>();

        for (const scene of scenes) {
            const materials = GetSceneMaterials(scene);
            sceneMaterials.set(scene, materials);
            for (const source of materials) {
                let draft = materialDrafts.get(source);
                if (!draft) {
                    draft = {
                        source,
                        family: getMaterialFamily(source),
                        displayName: source.name || "Material",
                        scenes: [],
                        bindings: GetMaterialTopologyBindings(source),
                    };
                    materialDrafts.set(source, draft);
                }
                draft.scenes.push(scene);
            }
        }

        const materialRecords = new Map<Material, IMaterialResourceRecord>();
        for (const draft of materialDrafts.values()) {
            materialRecords.set(draft.source, draft);
        }

        const textureDrafts = new Map<object, TextureDraft>();
        for (const material of materialRecords.values()) {
            for (const binding of material.bindings) {
                let texture = textureDrafts.get(binding.entity);
                if (!texture) {
                    try {
                        const metadata = getTextureMetadata(binding.entity);
                        if (!metadata) {
                            continue;
                        }
                        texture = {
                            entity: binding.entity,
                            metadata,
                            ordinal: this._getTextureOrdinal(binding.entity),
                            consumers: [],
                        };
                    } catch {
                        continue;
                    }
                    textureDrafts.set(binding.entity, texture);
                }
                texture.consumers.push({ material: material.source, bindingId: binding.id });
            }
        }

        const textureRecords = new Map<object, ITextureResourceRecord>();
        for (const draft of textureDrafts.values()) {
            textureRecords.set(draft.entity, draft);
        }

        const sceneSnapshots = new Map<SceneContext, ISceneResourceSnapshot>();
        for (const scene of scenes) {
            const materials = (sceneMaterials.get(scene) ?? []).flatMap((source) => {
                const record = materialRecords.get(source);
                return record ? [record] : [];
            });
            const seenTextures = new Set<object>();
            const textures: ITextureResourceRecord[] = [];
            for (const material of materials) {
                for (const binding of material.bindings) {
                    const record = textureRecords.get(binding.entity);
                    if (record && !seenTextures.has(binding.entity)) {
                        seenTextures.add(binding.entity);
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
     * Captures the public identities and values that drive index and Properties refresh.
     * @returns A deterministic topology snapshot.
     */
    public getTopologySnapshot(): SceneResourceTopologySnapshot {
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
                    try {
                        const source = getMaterialSource(mesh.material);
                        const bindings = GetMaterialTopologyBindings(source);
                        snapshot.push(mesh.material, source, getMaterialFamily(source), source.name, bindings.length);
                        for (const binding of bindings) {
                            snapshot.push(binding.id, binding.entity);
                            AppendTextureState(snapshot, binding.entity);
                        }
                    } catch {
                        snapshot.push("stale-material");
                    }
                }
            }
        }
        return snapshot;
    }

    public static AreTopologySnapshotsEqual(left: SceneResourceTopologySnapshot, right: SceneResourceTopologySnapshot): boolean {
        return left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
    }

    public getSceneSnapshot(scene: SceneContext): ISceneResourceSnapshot {
        return this._sceneSnapshots.get(scene) ?? { scene, materials: [], textures: [] };
    }

    public getMaterialRecord(material: Material): IMaterialResourceRecord | undefined {
        return this._materialRecords.get(material);
    }

    public getTextureRecord(texture: object): ITextureResourceRecord | undefined {
        return this._textureRecords.get(texture);
    }

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
