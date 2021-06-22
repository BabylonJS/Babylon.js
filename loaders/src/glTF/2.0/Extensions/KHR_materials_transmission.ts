import { Nullable } from "babylonjs/types";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Material } from "babylonjs/Materials/material";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { IKHRMaterialsTransmission } from 'babylonjs-gltf2interface';
import { Scene } from "babylonjs/scene";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { RenderTargetTexture } from "babylonjs/Materials/Textures/renderTargetTexture";
import { Observable, Observer } from "babylonjs/Misc/observable";
import { Constants } from "babylonjs/Engines/constants";
import { Tools } from "babylonjs/Misc/tools";
import { Color4 } from "babylonjs/Maths/math.color";

interface ITransmissionHelperHolder {
    /**
     * @hidden
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
     */
    private static _getDefaultOptions(): ITransmissionHelperOptions {
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

    /**
     * This observable will be notified with any error during the creation of the environment,
     * mainly texture creation errors.
     */
    public onErrorObservable: Observable<{ message?: string, exception?: any }>;

    /**
     * constructor
     * @param options Defines the options we want to customize the helper
     * @param scene The scene to add the material to
     */
    constructor(options: Partial<ITransmissionHelperOptions>, scene: Scene) {
        this._options = {
            ...TransmissionHelper._getDefaultOptions(),
            ...options
        };
        this._scene = scene as any;
        this._scene._transmissionHelper = this;

        this.onErrorObservable = new Observable();
        this._scene.onDisposeObservable.addOnce((scene) => {
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
            ...options
        };

        const oldOptions = this._options;
        this._options = newOptions;

        // If size changes, recreate everything
        if (newOptions.renderSize !== oldOptions.renderSize || newOptions.renderTargetTextureType !== oldOptions.renderTargetTextureType || newOptions.generateMipmaps !== oldOptions.generateMipmaps || !this._opaqueRenderTarget) {
            this._setupRenderTargets();
        } else {
            this._opaqueRenderTarget.samples = newOptions.samples;
            this._opaqueRenderTarget.lodGenerationScale = newOptions.lodGenerationScale;
            this._opaqueRenderTarget.lodGenerationOffset = newOptions.lodGenerationOffset;
        }
    }

    public getOpaqueTarget(): Nullable<Texture> {
        return this._opaqueRenderTarget;
    }

    private shouldRenderAsTransmission(material: Nullable<Material>): boolean {
        if (!material) {
            return false;
        }
        if (material instanceof PBRMaterial && (material.subSurface.isRefractionEnabled)) {
            return true;
        }
        return false;
    }

    private _addMesh(mesh: AbstractMesh): void {
        this._materialObservers[mesh.uniqueId] = mesh.onMaterialChangedObservable.add(this._onMeshMaterialChanged.bind(this));

        // we need to defer the processing because _addMesh may be called as part as an instance mesh creation, in which case some
        // internal properties are not setup yet, like _sourceMesh (needed when doing mesh.material below)
        Tools.SetImmediate(() => {
            if (this.shouldRenderAsTransmission(mesh.material)) {
                (mesh.material as PBRMaterial).refractionTexture = this._opaqueRenderTarget;
                this._transparentMeshesCache.push(mesh);
            } else {
                this._opaqueMeshesCache.push(mesh);
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

        // If the material is transparent, make sure that it's added to the transparent list and removed from the opaque list
        const useTransmission = this.shouldRenderAsTransmission(mesh.material);
        if (useTransmission) {
            if (mesh.material instanceof PBRMaterial) {
                mesh.material.subSurface.refractionTexture = this._opaqueRenderTarget;
            }
            if (opaqueIdx !== -1) {
                this._opaqueMeshesCache.splice(opaqueIdx, 1);
                this._transparentMeshesCache.push(mesh);
            } else if (transparentIdx === -1) {
                this._transparentMeshesCache.push(mesh);
            }
            // If the material is opaque, make sure that it's added to the opaque list and removed from the transparent list
        } else {
            if (transparentIdx !== -1) {
                this._transparentMeshesCache.splice(transparentIdx, 1);
                this._opaqueMeshesCache.push(mesh);
            } else if (opaqueIdx === -1) {
                this._opaqueMeshesCache.push(mesh);
            }
        }
    }

    /**
     * Setup the render targets according to the specified options.
     */
    private _setupRenderTargets(): void {
        if (this._opaqueRenderTarget) {
            this._opaqueRenderTarget.dispose();
        }
        this._opaqueRenderTarget = new RenderTargetTexture("opaqueSceneTexture", this._options.renderSize, this._scene, this._options.generateMipmaps, undefined, this._options.renderTargetTextureType);
        this._opaqueRenderTarget.ignoreCameraViewport = true;
        this._opaqueRenderTarget.renderList = this._opaqueMeshesCache;
        this._opaqueRenderTarget.clearColor = this._options.clearColor?.clone() ?? this._scene.clearColor.clone();
        this._opaqueRenderTarget.gammaSpace = false;
        this._opaqueRenderTarget.lodGenerationScale = this._options.lodGenerationScale;
        this._opaqueRenderTarget.lodGenerationOffset = this._options.lodGenerationOffset;
        this._opaqueRenderTarget.samples = this._options.samples;

        let sceneImageProcessingapplyByPostProcess: boolean;

        let saveSceneEnvIntensity: number;
        this._opaqueRenderTarget.onBeforeBindObservable.add((opaqueRenderTarget) => {
            saveSceneEnvIntensity = this._scene.environmentIntensity;
            this._scene.environmentIntensity = 1.0;
            sceneImageProcessingapplyByPostProcess = this._scene.imageProcessingConfiguration.applyByPostProcess;
            if (!this._options.clearColor) {
                this._scene.clearColor.toLinearSpaceToRef(opaqueRenderTarget.clearColor);
            } else {
                opaqueRenderTarget.clearColor.copyFrom(this._options.clearColor);
            }
            this._scene.imageProcessingConfiguration.applyByPostProcess = true;
        });
        this._opaqueRenderTarget.onAfterUnbindObservable.add(() => {
            this._scene.environmentIntensity = saveSceneEnvIntensity;
            this._scene.imageProcessingConfiguration.applyByPostProcess = sceneImageProcessingapplyByPostProcess;
        });

        this._transparentMeshesCache.forEach((mesh: AbstractMesh) => {
            if (this.shouldRenderAsTransmission(mesh.material)) {
                (mesh.material as PBRMaterial).refractionTexture = this._opaqueRenderTarget;
            }
        });
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
    }
}

const NAME = "KHR_materials_transmission";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_transmission/README.md)
 */
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

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
        if (this.enabled) {
            loader.parent.transparencyAsCoverage = true;
        }
    }

    /** @hidden */
    public dispose() {
        (this._loader as any) = null;
    }

    /** @hidden */
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsTransmission>(context, material, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadTransparentPropertiesAsync(extensionContext, material, babylonMaterial, extension));
            return Promise.all(promises).then(() => { });
        });
    }

    private _loadTransparentPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IKHRMaterialsTransmission): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }
        let pbrMaterial = babylonMaterial as PBRMaterial;

        // Enables "refraction" texture which represents transmitted light.
        pbrMaterial.subSurface.isRefractionEnabled = true;

        // Since this extension models thin-surface transmission only, we must make IOR = 1.0
        pbrMaterial.subSurface.volumeIndexOfRefraction = 1.0;

        // Albedo colour will tint transmission.
        pbrMaterial.subSurface.useAlbedoToTintRefraction = true;

        if (extension.transmissionFactor !== undefined) {
            pbrMaterial.subSurface.refractionIntensity = extension.transmissionFactor;
            const scene = pbrMaterial.getScene() as unknown as ITransmissionHelperHolder;
            if (pbrMaterial.subSurface.refractionIntensity && !scene._transmissionHelper) {
                new TransmissionHelper({}, pbrMaterial.getScene());
            }
        } else {
            pbrMaterial.subSurface.refractionIntensity = 0.0;
            pbrMaterial.subSurface.isRefractionEnabled = false;
            return Promise.resolve();
        }

        pbrMaterial.subSurface.minimumThickness = 0.0;
        pbrMaterial.subSurface.maximumThickness = 0.0;
        if (extension.transmissionTexture) {
            (extension.transmissionTexture as ITextureInfo).nonColorData = true;
            return this._loader.loadTextureInfoAsync(`${context}/transmissionTexture`, extension.transmissionTexture, undefined)
                .then((texture: BaseTexture) => {
                    pbrMaterial.subSurface.refractionIntensityTexture = texture;
                    pbrMaterial.subSurface.useGltfStyleTextures = true;
                });
        } else {
            return Promise.resolve();
        }
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_transmission(loader));
