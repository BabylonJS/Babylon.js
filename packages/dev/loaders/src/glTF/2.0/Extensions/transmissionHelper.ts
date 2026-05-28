import { type Nullable } from "core/types";
import { type Material } from "core/Materials/material";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { type Scene } from "core/scene";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type SubMesh } from "core/Meshes/subMesh";
import { type Texture } from "core/Materials/Textures/texture";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { type Observer, Observable } from "core/Misc/observable";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools";
import { type Color4 } from "core/Maths/math.color";
import { type IMaterialLoadingAdapter } from "../materialLoadingAdapter";
import { type GLTFLoader } from "../glTFLoader";

/**
 * Describes a material class and its corresponding loading adapter.
 * Passed to TransmissionHelper so it can classify and interact with materials
 * independently of any specific loader instance.
 */
export interface ITransmissionHelperMaterialImpl {
    /** The material class constructor */
    materialClass: typeof Material;
    /** The adapter class constructor */
    adapterClass: new (material: Material) => IMaterialLoadingAdapter;
}

/**
 * @internal
 */
export interface ITransmissionHelperHolder {
    /** The transmission helper instance, if created on the scene */
    _transmissionHelper: TransmissionHelper | undefined;
}

/**
 * Options for the TransmissionHelper.
 */
export interface ITransmissionHelperOptions {
    /**
     * The size of the render buffers (default: 1024)
     */
    renderSize: number;

    /**
     * The number of samples to use when generating the render target texture for opaque meshes (default: 4)
     */
    samples: number;

    /**
     * Scale to apply when selecting the LOD level to sample the refraction texture (default: 1)
     */
    lodGenerationScale: number;

    /**
     * Offset to apply when selecting the LOD level to sample the refraction texture (default: -4)
     */
    lodGenerationOffset: number;

    /**
     * Type of the refraction render target texture (default: TEXTURETYPE_HALF_FLOAT)
     */
    renderTargetTextureType: number;

    /**
     * Defines if the mipmaps for the refraction render target texture must be generated (default: true)
     */
    generateMipmaps: boolean;

    /**
     * Clear color of the opaque texture. If not provided, use the scene clear color (which will be converted to linear space).
     * If provided, should be in linear space
     */
    clearColor?: Color4;
}

/**
 * A class to handle setting up the rendering of opaque objects to be shown through transmissive objects.
 * @internal
 */
export class TransmissionHelper {
    /**
     * Creates the default options for the helper.
     * @returns the default options
     */
    private static _GetDefaultOptions(): ITransmissionHelperOptions {
        return {
            renderSize: 1024,
            samples: 4,
            lodGenerationScale: 1,
            lodGenerationOffset: -4,
            renderTargetTextureType: Constants.TEXTURETYPE_HALF_FLOAT,
            generateMipmaps: true,
        };
    }

    private readonly _scene: Scene & ITransmissionHelperHolder;

    private _options: ITransmissionHelperOptions;

    private _opaqueRenderTarget: Nullable<RenderTargetTexture> = null;
    private _opaqueMeshesCache: AbstractMesh[] = [];
    private _transparentMeshesCache: AbstractMesh[] = [];
    private _materialObservers: { [id: string]: Nullable<Observer<AbstractMesh>> } = {};
    private _newMeshObserver: Nullable<Observer<AbstractMesh>> = null;
    private _removedMeshObserver: Nullable<Observer<AbstractMesh>> = null;
    private _disposed = false;

    // Material implementations registered by loaders. Each entry maps a material class
    // to its adapter class so the helper can classify and interact with materials
    // independently of whichever loader originally created them.
    private readonly _materialImpls: ITransmissionHelperMaterialImpl[] = [];
    private readonly _adapterCache: WeakMap<Material, IMaterialLoadingAdapter> = new WeakMap();

    /**
     * This observable will be notified with any error during the creation of the environment,
     * mainly texture creation errors.
     */
    public onErrorObservable: Observable<{ message?: string; exception?: any }>;

    // For MultiMaterial meshes with mixed opaque/translucent sub-materials:
    // maps mesh → set of materialIndex values that are translucent.
    private _translucentMaterialIndices: Map<AbstractMesh, Set<number>> = new Map();
    // Precomputed opaque-only submesh arrays for mixed meshes, swapped in
    // during the opaque RT render to avoid per-frame allocations.
    private _opaqueOnlySubMeshes: Map<AbstractMesh, SubMesh[]> = new Map();
    private _savedSubMeshes: Map<AbstractMesh, SubMesh[]> = new Map();

    /**
     * constructor
     * @param options Defines the options we want to customize the helper
     * @param scene The scene to add the material to
     */
    constructor(options: Partial<ITransmissionHelperOptions>, scene: Scene) {
        this._options = {
            ...TransmissionHelper._GetDefaultOptions(),
            ...options,
        };
        this._scene = scene as any;
        this._scene._transmissionHelper = this;

        this.onErrorObservable = new Observable();
        this._scene.onDisposeObservable.addOnce(() => {
            this.dispose();
        });

        this._parseScene();
        this._setupRenderTargets();
    }

    /**
     * Registers a material implementation with the helper so it can classify and create
     * adapters for materials of that type. Safe to call multiple times with the same
     * implementation — duplicates are ignored.
     * @param impl The material implementation to register
     */
    public addMaterialImpl(impl: ITransmissionHelperMaterialImpl): void {
        if (!this._materialImpls.some((i) => i.materialClass === impl.materialClass)) {
            this._materialImpls.push(impl);
        }
    }

    /**
     * Updates the helper options.
     * @param options the options to update
     */
    public updateOptions(options: Partial<ITransmissionHelperOptions>) {
        // First check if any options are actually being changed. If not, exit.
        const newValues = Object.keys(options).filter((key: string) => (this._options as any)[key] !== (options as any)[key]);
        if (!newValues.length) {
            return;
        }

        const newOptions = {
            ...this._options,
            ...options,
        };

        const oldOptions = this._options;
        this._options = newOptions;

        // If size changes, recreate everything
        if (
            newOptions.renderSize !== oldOptions.renderSize ||
            newOptions.renderTargetTextureType !== oldOptions.renderTargetTextureType ||
            newOptions.generateMipmaps !== oldOptions.generateMipmaps ||
            !this._opaqueRenderTarget
        ) {
            this._setupRenderTargets();
        } else {
            this._opaqueRenderTarget.samples = newOptions.samples;
            this._opaqueRenderTarget.lodGenerationScale = newOptions.lodGenerationScale;
            this._opaqueRenderTarget.lodGenerationOffset = newOptions.lodGenerationOffset;
        }
    }

    /**
     * @returns the opaque render target texture or null if not available.
     */
    public getOpaqueTarget(): Nullable<Texture> {
        return this._opaqueRenderTarget;
    }

    private _getOrCreateAdapter(material: Material): IMaterialLoadingAdapter | undefined {
        let adapter = this._adapterCache.get(material);
        if (!adapter) {
            for (const impl of this._materialImpls) {
                if (material instanceof impl.materialClass) {
                    adapter = new impl.adapterClass(material);
                    this._adapterCache.set(material, adapter);
                    break;
                }
            }
        }
        return adapter;
    }

    /**
     * Classify a mesh's materials as transparent, opaque, or mixed.
     * Sets the refraction background texture on any translucent materials found.
     * For mixed MultiMaterial meshes, populates _translucentMaterialIndices so
     * their translucent submeshes can be excluded from the opaque render target.
     * @param mesh - The mesh to classify
     * @returns 'transparent' if all materials are translucent, 'opaque' if none are, 'mixed' if both
     */
    private _classifyMeshMaterials(mesh: AbstractMesh): "transparent" | "opaque" | "mixed" {
        const material = mesh.material;
        if (!material) {
            return "opaque";
        }

        // Single material case
        if (!(material instanceof MultiMaterial)) {
            const adapter = this._getOrCreateAdapter(material);
            if (!adapter) {
                return "opaque";
            }
            if (adapter.isTranslucent()) {
                adapter.refractionBackgroundTexture = this._opaqueRenderTarget;
                return "transparent";
            }
            return "opaque";
        }

        // MultiMaterial case: check each sub-material individually
        let hasTranslucent = false;
        let hasOpaque = false;
        const translucentIndices = new Set<number>();

        for (let i = 0; i < material.subMaterials.length; i++) {
            const subMat = material.subMaterials[i];
            if (!subMat) {
                hasOpaque = true;
                continue;
            }
            const adapter = this._getOrCreateAdapter(subMat);
            if (adapter) {
                if (adapter.isTranslucent()) {
                    adapter.refractionBackgroundTexture = this._opaqueRenderTarget;
                    hasTranslucent = true;
                    translucentIndices.add(i);
                } else {
                    hasOpaque = true;
                }
            } else {
                hasOpaque = true;
            }
        }

        if (hasTranslucent && hasOpaque) {
            this._translucentMaterialIndices.set(mesh, translucentIndices);
            this._rebuildOpaqueOnlySubMeshes(mesh, translucentIndices);
            return "mixed";
        }
        this._translucentMaterialIndices.delete(mesh);
        this._opaqueOnlySubMeshes.delete(mesh);
        return hasTranslucent ? "transparent" : "opaque";
    }

    /**
     * Rebuild the cached opaque-only submesh array for a mixed mesh.
     * Called when classification changes so the per-frame swap is allocation-free.
     * @param mesh - The mesh to rebuild for
     * @param translucentIndices - Set of materialIndex values that are translucent
     */
    private _rebuildOpaqueOnlySubMeshes(mesh: AbstractMesh, translucentIndices: Set<number>): void {
        if (mesh.subMeshes) {
            this._opaqueOnlySubMeshes.set(
                mesh,
                mesh.subMeshes.filter((sm: SubMesh) => !translucentIndices.has(sm.materialIndex))
            );
        }
    }

    private _addMesh(mesh: AbstractMesh): void {
        this._materialObservers[mesh.uniqueId] = mesh.onMaterialChangedObservable.add(this._onMeshMaterialChanged.bind(this));

        // we need to defer the processing because _addMesh may be called as part as an instance mesh creation, in which case some
        // internal properties are not setup yet, like _sourceMesh (needed when doing mesh.material below)
        Tools.SetImmediate(() => {
            // Guard: skip if the helper was disposed before this deferred callback fires.
            // Without this, a disposed helper with a null _opaqueRenderTarget would stamp
            // null onto transmission materials, overriding any texture already assigned by
            // an active frame graph or other external code.
            if (this._disposed) {
                return;
            }
            if (mesh.material) {
                const classification = this._classifyMeshMaterials(mesh);
                if (classification === "transparent") {
                    if (this._transparentMeshesCache.indexOf(mesh) === -1) {
                        this._transparentMeshesCache.push(mesh);
                    }
                } else {
                    // Both 'opaque' and 'mixed' go in the opaque cache.
                    // For 'mixed', the translucent submeshes are temporarily
                    // excluded during the opaque render target render.
                    if (this._opaqueMeshesCache.indexOf(mesh) === -1) {
                        this._opaqueMeshesCache.push(mesh);
                    }
                }
            }
        });
    }

    private _removeMesh(mesh: AbstractMesh): void {
        mesh.onMaterialChangedObservable.remove(this._materialObservers[mesh.uniqueId]);
        delete this._materialObservers[mesh.uniqueId];
        let idx = this._transparentMeshesCache.indexOf(mesh);
        if (idx !== -1) {
            this._transparentMeshesCache.splice(idx, 1);
        }
        idx = this._opaqueMeshesCache.indexOf(mesh);
        if (idx !== -1) {
            this._opaqueMeshesCache.splice(idx, 1);
        }
        this._translucentMaterialIndices.delete(mesh);
        this._opaqueOnlySubMeshes.delete(mesh);
    }

    private _parseScene(): void {
        this._scene.meshes.forEach(this._addMesh.bind(this));
        // Listen for when a mesh is added to the scene and add it to our cache lists.
        this._newMeshObserver = this._scene.onNewMeshAddedObservable.add(this._addMesh.bind(this));
        // Listen for when a mesh is removed from to the scene and remove it from our cache lists.
        this._removedMeshObserver = this._scene.onMeshRemovedObservable.add(this._removeMesh.bind(this));
    }

    // When one of the meshes in the scene has its material changed, make sure that it's in the correct cache list.
    private _onMeshMaterialChanged(mesh: AbstractMesh) {
        const transparentIdx = this._transparentMeshesCache.indexOf(mesh);
        const opaqueIdx = this._opaqueMeshesCache.indexOf(mesh);

        const classification = this._classifyMeshMaterials(mesh);

        if (classification === "transparent") {
            // Fully translucent: move to transparent cache
            if (opaqueIdx !== -1) {
                this._opaqueMeshesCache.splice(opaqueIdx, 1);
                this._transparentMeshesCache.push(mesh);
            } else if (transparentIdx === -1) {
                this._transparentMeshesCache.push(mesh);
            }
        } else {
            // Opaque or mixed: move to opaque cache (mixed meshes have their
            // translucent submeshes excluded during opaque RT render)
            if (transparentIdx !== -1) {
                this._transparentMeshesCache.splice(transparentIdx, 1);
                this._opaqueMeshesCache.push(mesh);
            } else if (opaqueIdx === -1) {
                this._opaqueMeshesCache.push(mesh);
            }
        }
    }

    /**
     * @internal
     * Check if the opaque render target has not been disposed and can still be used.
     * @returns
     */
    public _isRenderTargetValid() {
        return this._opaqueRenderTarget?.getInternalTexture() !== null;
    }

    /**
     * @internal
     * Setup the render targets according to the specified options.
     */
    public _setupRenderTargets(): void {
        if (this._opaqueRenderTarget) {
            this._opaqueRenderTarget.dispose();
        }
        this._opaqueRenderTarget = new RenderTargetTexture(
            "opaqueSceneTexture",
            this._options.renderSize,
            this._scene,
            this._options.generateMipmaps,
            undefined,
            this._options.renderTargetTextureType
        );
        this._opaqueRenderTarget.ignoreCameraViewport = true;
        this._opaqueRenderTarget.renderList = this._opaqueMeshesCache;
        this._opaqueRenderTarget.clearColor = this._options.clearColor?.clone() ?? this._scene.clearColor.clone();
        this._opaqueRenderTarget.clearColor.a = 0.0;
        this._opaqueRenderTarget.gammaSpace = false;
        this._opaqueRenderTarget.lodGenerationScale = this._options.lodGenerationScale;
        this._opaqueRenderTarget.lodGenerationOffset = this._options.lodGenerationOffset;
        this._opaqueRenderTarget.samples = this._options.samples;
        this._opaqueRenderTarget.renderSprites = true;
        this._opaqueRenderTarget.renderParticles = true;
        this._opaqueRenderTarget.disableImageProcessing = true;

        let saveSceneEnvIntensity: number;
        this._opaqueRenderTarget.onBeforeBindObservable.add((opaqueRenderTarget) => {
            saveSceneEnvIntensity = this._scene.environmentIntensity;
            this._scene.environmentIntensity = 1.0;
            if (!this._options.clearColor) {
                this._scene.clearColor.toLinearSpaceToRef(opaqueRenderTarget.clearColor, this._scene.getEngine().useExactSrgbConversions);
            } else {
                opaqueRenderTarget.clearColor.copyFrom(this._options.clearColor);
            }
            opaqueRenderTarget.clearColor.a = 0.0;

            // For mixed MultiMaterial meshes, swap in the precomputed opaque-only
            // submesh array so translucent submeshes don't render into the opaque texture.
            const tlEntries = this._opaqueOnlySubMeshes.entries();
            for (let tlEntry = tlEntries.next(); !tlEntry.done; tlEntry = tlEntries.next()) {
                const mesh = tlEntry.value[0];
                const opaqueOnly = tlEntry.value[1];
                if (mesh.subMeshes) {
                    this._savedSubMeshes.set(mesh, mesh.subMeshes);
                    mesh.subMeshes = opaqueOnly;
                }
            }
        });
        this._opaqueRenderTarget.onAfterUnbindObservable.add(() => {
            this._scene.environmentIntensity = saveSceneEnvIntensity;

            // Restore the full submesh list after the opaque RT render
            const savedEntries = this._savedSubMeshes.entries();
            for (let savedEntry = savedEntries.next(); !savedEntry.done; savedEntry = savedEntries.next()) {
                savedEntry.value[0].subMeshes = savedEntry.value[1];
            }
            this._savedSubMeshes.clear();
        });

        // Update refraction textures on transparent and mixed meshes
        for (const mesh of this._transparentMeshesCache) {
            if (mesh.material) {
                this._classifyMeshMaterials(mesh);
            }
        }
        const mixedEntries = this._translucentMaterialIndices.entries();
        for (let mixedEntry = mixedEntries.next(); !mixedEntry.done; mixedEntry = mixedEntries.next()) {
            const mesh = mixedEntry.value[0];
            if (mesh.material) {
                this._classifyMeshMaterials(mesh);
            }
        }
    }

    /**
     * Dispose all the elements created by the Helper.
     */
    public dispose(): void {
        // Set the disposed flag first so any pending SetImmediate callbacks (from _addMesh)
        // are no-ops. Without this guard a deferred _classifyMeshMaterials call would stamp
        // a null _opaqueRenderTarget onto transmission materials after disposal.
        this._disposed = true;

        // Unregister scene-level observers so this helper stops reacting to mesh changes.
        this._newMeshObserver.remove();
        this._removedMeshObserver.remove();
        this._newMeshObserver = null;
        this._removedMeshObserver = null;

        // Remove per-mesh material-change observers for all tracked meshes.
        const allTracked = [...this._transparentMeshesCache, ...this._opaqueMeshesCache];
        for (const mesh of allTracked) {
            const observer = this._materialObservers[mesh.uniqueId];
            if (observer) {
                observer.remove();
                delete this._materialObservers[mesh.uniqueId];
            }
        }

        // Also remove any remaining observers that were registered before deferred
        // classification added their meshes to the caches.
        for (const mesh of this._scene.meshes) {
            const observer = this._materialObservers[mesh.uniqueId];
            if (observer) {
                mesh.onMaterialChangedObservable.remove(observer);
                delete this._materialObservers[mesh.uniqueId];
            }
        }

        this._materialObservers = {};

        this._scene._transmissionHelper = undefined;
        if (this._opaqueRenderTarget) {
            this._opaqueRenderTarget.dispose();
            this._opaqueRenderTarget = null;
        }
        this._transparentMeshesCache = [];
        this._opaqueMeshesCache = [];
        this._translucentMaterialIndices.clear();
        this._opaqueOnlySubMeshes.clear();
        this._savedSubMeshes.clear();
    }
}

/**
 * Ensures a TransmissionHelper exists on the scene and has all of the loader's material
 * implementations registered with it. Creates the helper if one does not yet exist on the
 * scene, and recreates its render target if it has been disposed. Does nothing when the
 * loader's parent has `dontUseTransmissionHelper` set.
 * @param loader The glTF loader whose material implementations should be registered
 * @param babylonMaterial A material belonging to the scene where the helper should live
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function ensureTransmissionHelper(loader: GLTFLoader, babylonMaterial: Material): void {
    if (loader.parent.dontUseTransmissionHelper) {
        return;
    }
    const scene = babylonMaterial.getScene() as unknown as ITransmissionHelperHolder;
    const existingHelper = scene._transmissionHelper;
    const helper = existingHelper ?? new TransmissionHelper({}, babylonMaterial.getScene());
    for (const impl of Array.from(loader._pbrMaterialImpls.values())) {
        helper.addMaterialImpl(impl);
    }
    if (existingHelper && !existingHelper._isRenderTargetValid()) {
        existingHelper._setupRenderTargets();
    }
}
