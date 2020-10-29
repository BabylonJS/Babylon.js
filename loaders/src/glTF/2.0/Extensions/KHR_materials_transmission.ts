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
import { Mesh } from "babylonjs/Meshes/mesh";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { RenderTargetTexture } from "babylonjs/Materials/Textures/renderTargetTexture";
import { Observable } from "babylonjs/Misc/observable";

interface ITransmissionHelperHolder {
    /**
     * @hidden
     */
    _transmissionHelper: TransmissionHelper | undefined;
}

interface ITransmissionHelperOptions {
    /**
     * The size of the render buffers
     */
    renderSize: number;
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
            renderSize: 512
        };
    }

    /**
     * Stores the creation options.
     */
    private readonly _scene: Scene & ITransmissionHelperHolder;

    private _options: ITransmissionHelperOptions;

    private _opaqueRenderTarget: Nullable<RenderTargetTexture> = null;
    private _opaqueMeshesCache: Mesh[] = [];
    private _transparentMeshesCache: Mesh[] = [];

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
        if (newOptions.renderSize !== oldOptions.renderSize) {
            this._setupRenderTargets();
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
        if (mesh instanceof Mesh) {
            mesh.onMaterialChangedObservable.add(this.onMeshMaterialChanged.bind(this));
            if (this.shouldRenderAsTransmission(mesh.material)) {
                this._transparentMeshesCache.push(mesh);
            } else {
                this._opaqueMeshesCache.push(mesh);
            }
        }
    }

    private _removeMesh(mesh: AbstractMesh): void {
        if (mesh instanceof Mesh) {
            mesh.onMaterialChangedObservable.remove(this.onMeshMaterialChanged.bind(this));
            let idx = this._transparentMeshesCache.indexOf(mesh);
            if (idx !== -1) {
                this._transparentMeshesCache.splice(idx, 1);
            }
            idx = this._opaqueMeshesCache.indexOf(mesh);
            if (idx !== -1) {
                this._opaqueMeshesCache.splice(idx, 1);
            }
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
    private onMeshMaterialChanged(mesh: AbstractMesh) {
        if (mesh instanceof Mesh) {
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
    }

    /**
     * Setup the render targets according to the specified options.
     */
    private _setupRenderTargets(): void {

        let opaqueRTIndex = -1;

        // Remove any layers rendering to the opaque scene.
        if (this._scene.layers && this._opaqueRenderTarget) {
            for (let layer of this._scene.layers) {
                const idx = layer.renderTargetTextures.indexOf(this._opaqueRenderTarget);
                if (idx >= 0) {
                    layer.renderTargetTextures.splice(idx, 1);
                }
            }
        }

        // Remove opaque render target
        if (this._opaqueRenderTarget) {
            opaqueRTIndex = this._scene.customRenderTargets.indexOf(this._opaqueRenderTarget);
            this._opaqueRenderTarget.dispose();
        }

        this._opaqueRenderTarget = new RenderTargetTexture("opaqueSceneTexture", this._options.renderSize, this._scene, true);
        this._opaqueRenderTarget.renderList = this._opaqueMeshesCache;
        // this._opaqueRenderTarget.clearColor = new Color4(0.0, 0.0, 0.0, 0.0);
        this._opaqueRenderTarget.gammaSpace = true;
        this._opaqueRenderTarget.lodGenerationScale = 1;
        this._opaqueRenderTarget.lodGenerationOffset = -4;

        if (opaqueRTIndex >= 0) {
            this._scene.customRenderTargets.splice(opaqueRTIndex, 0, this._opaqueRenderTarget);
        } else {
            opaqueRTIndex = this._scene.customRenderTargets.length;
            this._scene.customRenderTargets.push(this._opaqueRenderTarget);
        }

        // If there are other layers, they should be included in the render of the opaque background.
        if (this._scene.layers && this._opaqueRenderTarget) {
            for (let layer of this._scene.layers) {
                layer.renderTargetTextures.push(this._opaqueRenderTarget);
            }
        }

        this._transparentMeshesCache.forEach((mesh: AbstractMesh) => {
            if (this.shouldRenderAsTransmission(mesh.material) && mesh.material instanceof PBRMaterial) {
                mesh.material.refractionTexture = this._opaqueRenderTarget;
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
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1698)
 * !!! Experimental Extension Subject to Changes !!!
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

        if (extension.transmissionTexture) {
            (extension.transmissionTexture as ITextureInfo).nonColorData = true;
            return this._loader.loadTextureInfoAsync(`${context}/transmissionTexture`, extension.transmissionTexture, undefined)
                .then((texture: BaseTexture) => {
                    pbrMaterial.subSurface.thicknessTexture = texture;
                    pbrMaterial.subSurface.useMaskFromThicknessTextureGltf = true;
                });
        } else {
            return Promise.resolve();
        }
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_transmission(loader));
