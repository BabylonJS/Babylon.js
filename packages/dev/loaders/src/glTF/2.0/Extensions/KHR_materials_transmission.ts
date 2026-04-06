import { type Nullable } from "core/types";
import { type Material } from "core/Materials/material";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type IMaterial, type ITextureInfo } from "../glTFLoaderInterfaces";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { type IKHRMaterialsTransmission } from "babylonjs-gltf2interface";
import { type Scene } from "core/scene";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type SubMesh } from "core/Meshes/subMesh";
import { type Texture } from "core/Materials/Textures/texture";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { type Observer, Observable } from "core/Misc/observable";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools";
import { type Color4 } from "core/Maths/math.color";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

interface ITransmissionHelperHolder {
    /**
     * @internal
     */
    _transmissionHelper: TransmissionHelper | undefined;
}

interface ITransmissionHelperOptions {
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
 */
class TransmissionHelper {
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

    /**
     * Stores the creation options.
     */
    private readonly _scene: Scene & ITransmissionHelperHolder;

    private _options: ITransmissionHelperOptions;

    private _opaqueRenderTarget: Nullable<RenderTargetTexture> = null;
    private _opaqueMeshesCache: AbstractMesh[] = [];
    private _transparentMeshesCache: AbstractMesh[] = [];
    private _materialObservers: { [id: string]: Nullable<Observer<AbstractMesh>> } = {};
    private _loader: GLTFLoader;

    // For MultiMaterial meshes with mixed opaque/translucent sub-materials:
    // maps mesh → set of materialIndex values that are translucent.
    private _translucentMaterialIndices: Map<AbstractMesh, Set<number>> = new Map();
    // Precomputed opaque-only submesh arrays for mixed meshes, swapped in
    // during the opaque RT render to avoid per-frame allocations.
    private _opaqueOnlySubMeshes: Map<AbstractMesh, SubMesh[]> = new Map();
    private _savedSubMeshes: Map<AbstractMesh, SubMesh[]> = new Map();

    /**
     * This observable will be notified with any error during the creation of the environment,
     * mainly texture creation errors.
     */
    public onErrorObservable: Observable<{ message?: string; exception?: any }>;

    /**
     * constructor
     * @param options Defines the options we want to customize the helper
     * @param scene The scene to add the material to
     * @param loader The glTF loader loading the asset
     */
    constructor(options: Partial<ITransmissionHelperOptions>, scene: Scene, loader: GLTFLoader) {
        this._options = {
            ...TransmissionHelper._GetDefaultOptions(),
            ...options,
        };
        this._scene = scene as any;
        this._scene._transmissionHelper = this;
        this._loader = loader;

        this.onErrorObservable = new Observable();
        this._scene.onDisposeObservable.addOnce(() => {
            this.dispose();
        });

        this._parseScene();
        this._setupRenderTargets();
    }

    /**
     * Updates the background according to the new options
     * @param options
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
            if (!this._loader.isMatchingMaterialType(material)) {
                return "opaque";
            }
            const adapter = this._loader._getOrCreateMaterialAdapter(material);
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
            if (this._loader.isMatchingMaterialType(subMat)) {
                const adapter = this._loader._getOrCreateMaterialAdapter(subMat);
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
        this._scene.onNewMeshAddedObservable.add(this._addMesh.bind(this));
        // Listen for when a mesh is removed from to the scene and remove it from our cache lists.
        this._scene.onMeshRemovedObservable.add(this._removeMesh.bind(this));
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

const NAME = "KHR_materials_transmission";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_transmission extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_transmission"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_transmission/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_transmission implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    /**
     * Defines a number that determines the order the extensions are applied.
     */
    public order = 175;

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
        if (this.enabled) {
            loader.parent.transparencyAsCoverage = true;
        }
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    // eslint-disable-next-line no-restricted-syntax
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsTransmission>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadTransparentPropertiesAsync(extensionContext, material, babylonMaterial, extension));
            // eslint-disable-next-line github/no-then
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/promise-function-async
    private _loadTransparentPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IKHRMaterialsTransmission): Promise<void> {
        const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);
        const transmissionWeight = extension.transmissionFactor !== undefined ? extension.transmissionFactor : 0.0;

        if (transmissionWeight === 0 || !adapter) {
            return Promise.resolve();
        }

        // Set transmission properties immediately via adapter
        adapter.configureTransmission();
        adapter.transmissionWeight = transmissionWeight;

        // Handle transmission helper setup (only needed for PBR materials)
        if (transmissionWeight > 0 && !this._loader.parent.dontUseTransmissionHelper) {
            const scene = babylonMaterial.getScene() as unknown as ITransmissionHelperHolder;
            if (!scene._transmissionHelper) {
                new TransmissionHelper({}, babylonMaterial.getScene(), this._loader);
            } else if (!scene._transmissionHelper?._isRenderTargetValid()) {
                // If the render target is not valid, recreate it.
                scene._transmissionHelper?._setupRenderTargets();
            }
        }

        // Load texture if present
        let texturePromise: Promise<Nullable<BaseTexture>> = Promise.resolve(null);
        if (extension.transmissionTexture) {
            (extension.transmissionTexture as ITextureInfo).nonColorData = true;
            texturePromise = this._loader.loadTextureInfoAsync(`${context}/transmissionTexture`, extension.transmissionTexture, (texture: BaseTexture) => {
                texture.name = `${babylonMaterial.name} (Transmission)`;
                adapter.transmissionWeightTexture = texture;
            });
        }

        // eslint-disable-next-line github/no-then
        return texturePromise.then(() => {});
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_transmission(loader));
