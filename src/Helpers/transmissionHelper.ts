import { Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Texture } from "../Materials/Textures/texture";
import { Material } from '../Materials/material';
import { PBRMaterial } from '../Materials/PBR/pbrMaterial';
import { RenderTargetTexture } from '../Materials/Textures/renderTargetTexture';

/**
 *
 */
export interface ITransmissionHelperOptions {
    /**
     * The size of the render buffers
     */
    renderSize: number;
}

/**
 *
 */
export class TransmissionHelper {

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
    private readonly _scene: Scene;
    private _options: ITransmissionHelperOptions;
    private _opaqueRTIndex: number = -1;

    private _opaqueRenderTarget: RenderTargetTexture;
    private _opaqueMeshesCache: Mesh[] = [];
    private _transparentMeshesCache: Mesh[] = [];
    
    public disabled: boolean = false;

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
        this._scene = scene;
        this.onErrorObservable = new Observable();
        
        this._parseScene();
        this._setupRenderTargets();
    }

    /**
     * Updates the background according to the new options
     * @param options
     */
    public updateOptions(options: Partial<ITransmissionHelperOptions>) {
        // First check if any options are actually being changed. If not, exit.
        const newValues = Object.keys(options).filter((key: string) => (this._options as any)[key] !== (options as any)[key as any]);
        if (!newValues.length) {
            return;
        }
        if (this.disabled) {
            return;
        }

        const newOptions = {
            ...this._options,
            ...options
        };

        const oldOptions = this._options;
        this._options = newOptions;


        // If size changes, recreate everything
        if (newOptions.renderSize !== oldOptions.renderSize ) {

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
        if (this._transparentMeshesCache.length == 0) {
            this.disabled = true;
        } else {
            this.disabled = false;
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
        if (this._transparentMeshesCache.length == 0) {
            this.disabled = true;
        } else {
            this.disabled = false;
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
            let transparent_idx = this._transparentMeshesCache.indexOf(mesh);
            let opaque_idx = this._opaqueMeshesCache.indexOf(mesh);

            // If the material is transparent, make sure that it's added to the transparent list and removed from the opaque list
            const useTransmission = this.shouldRenderAsTransmission(mesh.material);
            if (useTransmission) {
                if (mesh.material instanceof PBRMaterial) {
                    mesh.material.subSurface.refractionTexture = this._opaqueRenderTarget;
                }
                if (opaque_idx !== -1) {
                    this._opaqueMeshesCache.splice(opaque_idx, 1);
                    this._transparentMeshesCache.push(mesh);
                } else if (transparent_idx === -1) {
                    this._transparentMeshesCache.push(mesh);
                }
            // If the material is opaque, make sure that it's added to the opaque list and removed from the transparent list
            } else {
                if (transparent_idx !== -1) {
                    this._transparentMeshesCache.splice(transparent_idx, 1);
                    this._opaqueMeshesCache.push(mesh);
                } else if (opaque_idx === -1) {
                    this._opaqueMeshesCache.push(mesh);
                }
            }
        }
        if (this._transparentMeshesCache.length == 0) {
            this.disabled = true;
        } else {
            this.disabled = false;
        }
    }



    /**
     * Setup the render targets according to the specified options.
     */
    private _setupRenderTargets(): void {

        // Remove any layers rendering to the opaque scene.
        if (this._scene.layers) {
            this._scene.layers.forEach((layer) => {
                let idx = layer.renderTargetTextures.indexOf(this._opaqueRenderTarget);
                if (idx >= 0) {
                    layer.renderTargetTextures.splice(idx, 1);
                }
            });
        }

        // Remove opaque render target
        this._opaqueRTIndex = this._scene.customRenderTargets.indexOf(this._opaqueRenderTarget);
        if (this._opaqueRenderTarget) {
            this._opaqueRenderTarget.dispose();
        }

        this._opaqueRenderTarget = new RenderTargetTexture("opaqueSceneTexture", this._options.renderSize, this._scene, true);
        this._opaqueRenderTarget.renderList = this._opaqueMeshesCache;
        // this._opaqueRenderTarget.clearColor = new Color4(0.0, 0.0, 0.0, 0.0);
        this._opaqueRenderTarget.gammaSpace = true;
        this._opaqueRenderTarget.lodGenerationScale = 1;
        this._opaqueRenderTarget.lodGenerationOffset = -4;
        
        if (this._opaqueRTIndex >= 0) {
            this._scene.customRenderTargets.splice(this._opaqueRTIndex, 0, this._opaqueRenderTarget);
        } else {
            this._opaqueRTIndex = this._scene.customRenderTargets.length;
            this._scene.customRenderTargets.push(this._opaqueRenderTarget);
        }

        // If there are other layers, they should be included in the render of the opaque background.
        if (this._scene.layers) {
            this._scene.layers.forEach((layer) => {
                layer.renderTargetTextures.push(this._opaqueRenderTarget);
            });
        }
        
        this._transparentMeshesCache.forEach((mesh: AbstractMesh) => {
            if (this.shouldRenderAsTransmission(mesh.material) && mesh.material instanceof PBRMaterial) {
                mesh.material.refractionTexture = this._opaqueRenderTarget;
                mesh.material.getRenderTargetTextures = null;
            }
        });
        
    }

    // private _errorHandler = (message?: string, exception?: any) => {
    //     this.onErrorObservable.notifyObservers({ message: message, exception: exception });
    // }

    /**
     * Dispose all the elements created by the Helper.
     */
    public dispose(): void {

    }
}