import { Constants } from "../Engines/constants";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { Matrix, Vector3, Quaternion } from "../Maths/math.vector";
import { Mesh } from "../Meshes/mesh";
import { SmartArray } from "../Misc/smartArray";
import type { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import { ThinTexture } from "../Materials/Textures/thinTexture";
import type { PrePassEffectConfiguration } from "./prePassEffectConfiguration";
import { PrePassRenderer } from "./prePassRenderer";
import { Logger } from "../Misc/logger";
import { IblShadowsVoxelRenderer } from "../Rendering/iblShadowsVoxelRenderer";
import { IblShadowsComputePass } from "../Rendering/iblShadowsComputePass";

import "../Shaders/postprocess.vertex";
import "../Shaders/iblShadowGBufferDebug.fragment";
import { PostProcess } from "../PostProcesses/postProcess";
import { IblShadowsImportanceSamplingRenderer } from "./iblShadowsImportanceSamplingRenderer";
import { IblShadowsSpatialBlurPass } from "./iblShadowsSpatialBlurPass";

// class IblShadowsSettings {
//     public resolution: number = 64;
//     public sampleDirections: number = 1;
//     public ssShadowSampleCount: number = 16;
// }

class IblShadowsPrepassConfiguration implements PrePassEffectConfiguration {
    /**
     * Is this effect enabled
     */
    public enabled = true;

    /**
     * Name of the configuration
     */
    public name = "iblShadows";

    /**
     * Textures that should be present in the MRT for this effect to work
     */
    public readonly texturesRequired: number[] = [
        // Spatial blur will need *linear* depth
        Constants.PREPASS_DEPTH_TEXTURE_TYPE,
        Constants.PREPASS_CLIPSPACE_DEPTH_TEXTURE_TYPE,
        Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE,
        // Constants.PREPASS_NORMAL_TEXTURE_TYPE,
        // Constants.PREPASS_VELOCITY_TEXTURE_TYPE,
        // Local positions used for shadow accumulation pass
        // Constants.PREPASS_POSITION_TEXTURE_TYPE,
        // Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE,
    ];
}

/**
 * Voxel-based shadow rendering for IBL's.
 * This should not be instanciated directly, as it is part of a scene component
 */
export class IblShadowsRenderer {
    private _scene: Scene;
    private _engine: AbstractEngine;

    private _voxelizationDirty: boolean = true;
    private _boundsNeedUpdate: boolean = true;
    private _thinTextures: ThinTexture[] = [];

    private _gbufferDebugEnabled: boolean;
    private _debugPass: PostProcess;

    // private _currentPingPongState: number = 0;
    private _prePassEffectConfiguration: IblShadowsPrepassConfiguration;

    // private _candidateSubMeshes: SmartArray<SubMesh> = new SmartArray(10);
    private _excludedSubMeshes: SmartArray<SubMesh> = new SmartArray(10);
    private _excludedMeshes: number[] = [];

    private _voxelRenderer: IblShadowsVoxelRenderer;
    private _importanceSamplingRenderer: IblShadowsImportanceSamplingRenderer;
    private _shadowComputePass: IblShadowsComputePass;
    private _spatialBlurPass: IblShadowsSpatialBlurPass;

    public setIblTexture(iblSource: Texture) {
        this._importanceSamplingRenderer.iblSource = iblSource;
    }

    public getVoxelGridTexture(): Texture {
        return this._voxelRenderer.getVoxelGrid();
    }

    public getIcdfyTexture(): Texture {
        return this._importanceSamplingRenderer!.getIcdfyTexture();
    }

    public getIcdfxTexture(): Texture {
        return this._importanceSamplingRenderer!.getIcdfxTexture();
    }

    public getShadowTexture(): Texture {
        return this._shadowComputePass!.getTexture();
    }

    public get importanceSamplingDebugEnabled(): boolean {
        return this._importanceSamplingRenderer.debugEnabled;
    }

    public set importanceSamplingDebugEnabled(enabled: boolean) {
        this._importanceSamplingRenderer.debugEnabled = enabled;
    }

    public get voxelDebugEnabled(): boolean {
        return this._voxelRenderer.voxelDebugEnabled;
    }

    public set voxelDebugEnabled(enabled: boolean) {
        this._voxelRenderer.voxelDebugEnabled = enabled;
    }

    public get shadowComputeDebugEnabled(): boolean {
        return this._shadowComputePass.debugEnabled;
    }

    public set shadowComputeDebugEnabled(enabled: boolean) {
        this._shadowComputePass.debugEnabled = enabled;
    }

    public get spatialBlurPassDebugEnabled(): boolean {
        return this._spatialBlurPass.debugEnabled;
    }

    public set spatialBlurPassDebugEnabled(enabled: boolean) {
        this._spatialBlurPass.debugEnabled = enabled;
    }

    public get gbufferDebugEnabled(): boolean {
        return this._gbufferDebugEnabled;
    }

    public set gbufferDebugEnabled(enabled: boolean) {
        if (this._gbufferDebugEnabled === enabled) {
            return;
        }
        this._gbufferDebugEnabled = enabled;
        if (enabled) {
            const prePassRenderer = this._scene!.prePassRenderer;
            if (!prePassRenderer) {
                Logger.Error("Can't enable G-Buffer debug rendering since prepassRenderer doesn't exist.");
                return;
            }
            let samplerNames = new Array(this._prePassEffectConfiguration.texturesRequired.length).fill("");
            samplerNames = samplerNames.map((_, i) => PrePassRenderer.TextureFormats[this._prePassEffectConfiguration.texturesRequired[i]].name);
            this._debugPass = new PostProcess(
                "iblShadows_GBuffer_Debug",
                "iblShadowGBufferDebug",
                ["sizeParams"], // attributes
                samplerNames,
                1.0, // options
                this._scene._activeCamera, // camera
                Texture.BILINEAR_SAMPLINGMODE, // sampling
                this._engine
            );
        } else {
            this._debugPass.dispose();
        }
    }

    private _updateDebugPasses() {
        let count = 0;
        if (this._gbufferDebugEnabled) count++;
        if (this.importanceSamplingDebugEnabled) count++;
        if (this.voxelDebugEnabled) count++;
        if (this.shadowComputeDebugEnabled) count++;
        if (this.spatialBlurPassDebugEnabled) count++;

        // count = 4;
        const rows = Math.ceil(Math.sqrt(count));
        const cols = Math.ceil(count / rows);
        const width = 1.0 / cols;
        const height = 1.0 / rows;
        let x = 0;
        let y = 0;
        if (this.gbufferDebugEnabled) {
            const prePassRenderer = this._scene!.prePassRenderer;
            if (!prePassRenderer) {
                Logger.Error("Can't enable G-Buffer debug rendering since prepassRenderer doesn't exist.");
                return;
            }
            const xOffset = x;
            const yOffset = y;
            this._debugPass.onApply = (effect) => {
                this._prePassEffectConfiguration.texturesRequired.forEach((type) => {
                    const index = prePassRenderer.getIndex(type);
                    if (index >= 0) effect.setTexture(PrePassRenderer.TextureFormats[type].name, prePassRenderer.getRenderTarget().textures[index]);
                });
                effect.setFloat4("sizeParams", xOffset, yOffset, cols, rows);
            };
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.importanceSamplingDebugEnabled) {
            this._importanceSamplingRenderer.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.voxelDebugEnabled) {
            this._voxelRenderer.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.shadowComputeDebugEnabled) {
            this._shadowComputePass.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.spatialBlurPassDebugEnabled) {
            this._spatialBlurPass.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
    }

    /**
     * Add a mesh in the exclusion list to prevent it to be handled by the IBL shadow renderer
     * @param mesh The mesh to exclude from the IBL shadow renderer
     */
    public addExcludedMesh(mesh: AbstractMesh): void {
        if (this._excludedMeshes.indexOf(mesh.uniqueId) === -1) {
            this._excludedMeshes.push(mesh.uniqueId);
        }
    }

    /**
     * Remove a mesh from the exclusion list of the IBL shadow renderer
     * @param mesh The mesh to remove
     */
    public removeExcludedMesh(mesh: AbstractMesh): void {
        const index = this._excludedMeshes.indexOf(mesh.uniqueId);
        if (index !== -1) {
            this._excludedMeshes.splice(index, 1);
        }
    }

    private _resolution: number = 64;
    public get resolution() {
        return this._resolution;
    }
    public set resolution(newResolution: number) {
        if (this._resolution === newResolution) {
            return;
        }
        this._resolution = newResolution;
        this._voxelRenderer.voxelResolution = newResolution;
        this._voxelizationDirty = true;
    }

    /**
     * Instanciates the IBL Shadow renderer
     * @param scene Scene to attach to
     * @returns The IBL shadow renderer
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._gbufferDebugEnabled = false;

        //  We need a depth texture for opaque
        if (!scene.enablePrePassRenderer()) {
            Logger.Warn("IBL Shadows Renderer could not enable PrePass, aborting.");
            return;
        }

        this._prePassEffectConfiguration = new IblShadowsPrepassConfiguration();
        this._voxelRenderer = new IblShadowsVoxelRenderer(this._scene, this._resolution);
        this._importanceSamplingRenderer = new IblShadowsImportanceSamplingRenderer(this._scene);
        this._shadowComputePass = new IblShadowsComputePass(this._scene);
        this._spatialBlurPass = new IblShadowsSpatialBlurPass(this._scene);
        this._createTextures();

        this._scene.onNewMeshAddedObservable.add(() => {
            this._voxelizationDirty = true;
            this._boundsNeedUpdate = true;
        });

        this._scene.onBeforeRenderObservable.add(() => {
            this._updateDebugPasses();
            this._shadowComputePass.update();
            this._spatialBlurPass.update();
        });
    }

    private _createTextures() {}

    private _updateTextures() {
        return this._updateTextureReferences();
    }

    private _updateTextureReferences() {
        const prePassRenderer = this._scene!.prePassRenderer;
        if (!prePassRenderer) {
            return false;
        }

        // Retrieve opaque color texture
        this._prePassEffectConfiguration.texturesRequired.forEach((type) => {
            const textureIndex = prePassRenderer.getIndex(type);
            if (textureIndex === -1) {
                return;
            }
            const prePassTexture = prePassRenderer.defaultRT.textures?.length ? prePassRenderer.defaultRT.textures[textureIndex].getInternalTexture() : null;

            if (!prePassTexture) {
                return;
            }
            if (!this._thinTextures[textureIndex]) {
                this._thinTextures[textureIndex] = new ThinTexture(prePassTexture);
            }
        });

        return true;
    }

    /**
     * Links to the prepass renderer
     * @param prePassRenderer The scene PrePassRenderer
     * @returns PrePassEffectConfiguration
     */
    public setPrePassRenderer(prePassRenderer: PrePassRenderer): PrePassEffectConfiguration {
        return prePassRenderer.addEffectConfiguration(this._prePassEffectConfiguration);
    }

    /**
     * Checks if the IBL shadow renderer is ready to render shadows
     * @returns true if the IBL shadow renderer is ready to render the shadows
     */
    public isReady() {
        return this._voxelRenderer.isReady() && this._importanceSamplingRenderer.isReady() && this._updateTextures();
    }

    /**
     * Renders accumulated shadows for IBL
     * @returns The array of submeshes that could not be handled by this renderer
     */
    public render(): SmartArray<SubMesh> {
        // This is called for every MRT in the customRenderTargets structure during voxelization. That doesn't make
        // sense. We only want this to run after voxelization so we should put in some state logic here to return
        // if voxelization is happening.
        if (this._voxelRenderer.isVoxelizationInProgress()) {
            return this._excludedSubMeshes;
        }

        // Update scene inverse scale matrix. This is used to scale the voxel grid to world space and
        // also by the shadow compute pass.
        if (this._boundsNeedUpdate) {
            const bounds = this._scene.getWorldExtends((mesh) => {
                return mesh instanceof Mesh && this._excludedMeshes.indexOf(mesh.uniqueId) === -1;
            });
            const size = bounds.max.subtract(bounds.min);
            const halfSize = Math.max(size.x, Math.max(size.y, size.z)) * 0.5;
            const centre = bounds.max.add(bounds.min).multiplyByFloats(-0.5, -0.5, -0.5);
            const invWorldScaleMatrix = Matrix.Compose(new Vector3(1.0 / halfSize, 1.0 / halfSize, 1.0 / halfSize), new Quaternion(), centre.scaleInPlace(1.0 / halfSize));
            this._shadowComputePass.setWorldScaleMatrix(invWorldScaleMatrix);
            this._voxelRenderer.setWorldScaleMatrix(invWorldScaleMatrix);
            // Set world scale for spatial blur.
            this._spatialBlurPass.setWorldScale(halfSize * 2.0);
            this._boundsNeedUpdate = false;
            Logger.Log("IBL Shadows: Scene size: " + size);
            Logger.Log("Half size: " + halfSize);
            Logger.Log("Centre translation: " + centre);
            Logger.Log("Inv world scale matrix: " + invWorldScaleMatrix);
        }

        // this._shadowComputePass.update();

        // If update is needed, render voxels
        if (this._voxelizationDirty) {
            this._voxelRenderer.updateVoxelGrid(this._excludedMeshes);
            this._voxelizationDirty = false;
        }

        this._excludedSubMeshes.length = 0;
        if (!this.isReady()) {
            return this._excludedSubMeshes;
        }

        return this._excludedSubMeshes;
    }

    /**
     * Disposes the IBL shadow renderer and associated resources
     */
    public dispose() {
        this._voxelRenderer.dispose();
        this._importanceSamplingRenderer.dispose();
        this._shadowComputePass.dispose();
    }
}
