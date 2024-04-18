import { Constants } from "../Engines/constants";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { SmartArray } from "../Misc/smartArray";
import type { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import { ThinTexture } from "../Materials/Textures/thinTexture";
import { EffectRenderer } from "../Materials/effectRenderer";
import type { PrePassEffectConfiguration } from "./prePassEffectConfiguration";
import type { PrePassRenderer } from "./prePassRenderer";
import { Logger } from "../Misc/logger";
import { IblShadowsVoxelRenderer } from "../Rendering/iblShadowsVoxelRenderer";

import "../Shaders/postprocess.vertex";
import "../Shaders/iblShadowDebug.fragment";
import { PostProcess } from "../PostProcesses/postProcess";
import { IblShadowsImportanceSamplingRenderer } from "./iblShadowsImportanceSamplingRenderer";

class IblShadowsEffectConfiguration implements PrePassEffectConfiguration {
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
        Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE,
        Constants.PREPASS_NORMAL_TEXTURE_TYPE,
        Constants.PREPASS_VELOCITY_TEXTURE_TYPE,
        // Local positions used for shadow accumulation pass
        Constants.PREPASS_POSITION_TEXTURE_TYPE,
        Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE,
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
    private _thinTextures: ThinTexture[] = [];

    private _gbufferDebugEnabled: boolean;
    private _gbufferDebugPass: PostProcess;
    // private _finalEffectWrapper: EffectWrapper;
    private _effectRenderer: EffectRenderer;

    // private _currentPingPongState: number = 0;
    private _prePassEffectConfiguration: IblShadowsEffectConfiguration;

    // private _candidateSubMeshes: SmartArray<SubMesh> = new SmartArray(10);
    private _excludedSubMeshes: SmartArray<SubMesh> = new SmartArray(10);
    private _excludedMeshes: number[] = [];

    private _voxelRenderer: IblShadowsVoxelRenderer;
    private _importanceSamplingRenderer: IblShadowsImportanceSamplingRenderer;

    public setIblTexture(iblSource: Texture) {
        this._importanceSamplingRenderer.iblSource = iblSource;
    }

    public get importanceSamplingDebugEnabled(): boolean {
        return this._importanceSamplingRenderer.debugEnabled;
    }

    public set importanceSamplingDebugEnabled(enabled: boolean) {
        this._importanceSamplingRenderer.debugEnabled = enabled;
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
            this._gbufferDebugPass = new PostProcess(
                "iblShadows_GBuffer_Debug",
                "iblShadowDebug",
                null, // attributes
                ["normalSampler", "worldNormalSampler", "worldPositionSampler", "localPositionSampler", "depthSampler", "velocitySampler"], // textures
                1.0, // options
                this._scene._activeCamera, // camera
                Texture.BILINEAR_SAMPLINGMODE, // sampling
                this._engine
            );

            this._gbufferDebugPass.onBeforeRenderObservable.add((effect) => {
                const wnormalIndex = prePassRenderer.getIndex(Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE);
                const normalIndex = prePassRenderer.getIndex(Constants.PREPASS_NORMAL_TEXTURE_TYPE);
                const positionIndex = prePassRenderer.getIndex(Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE);
                const wpositionIndex = prePassRenderer.getIndex(Constants.PREPASS_POSITION_TEXTURE_TYPE);
                const depthIndex = prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE);
                const velocityIndex = prePassRenderer.getIndex(Constants.PREPASS_VELOCITY_TEXTURE_TYPE);
                if (normalIndex >= 0) effect.setTexture("normalSampler", prePassRenderer.getRenderTarget().textures[normalIndex]);
                if (wnormalIndex >= 0) effect.setTexture("worldNormalSampler", prePassRenderer.getRenderTarget().textures[wnormalIndex]);
                if (positionIndex >= 0) effect.setTexture("localPositionSampler", prePassRenderer.getRenderTarget().textures[positionIndex]);
                if (wpositionIndex >= 0) effect.setTexture("worldPositionSampler", prePassRenderer.getRenderTarget().textures[wpositionIndex]);
                if (depthIndex >= 0) effect.setTexture("depthSampler", prePassRenderer.getRenderTarget().textures[depthIndex]);
                if (velocityIndex >= 0) effect.setTexture("velocitySampler", prePassRenderer.getRenderTarget().textures[velocityIndex]);
            });
        } else {
            this._gbufferDebugPass.dispose();
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

        this._prePassEffectConfiguration = new IblShadowsEffectConfiguration();
        this._voxelRenderer = new IblShadowsVoxelRenderer(this._scene, this._resolution);
        this._importanceSamplingRenderer = new IblShadowsImportanceSamplingRenderer(this._scene);
        this._createTextures();
        this._createEffects();

        this._scene.onNewMeshAddedObservable.add(() => {
            this._voxelizationDirty = true;
        });
    }

    private _createTextures() {}

    private _updateTextures() {
        // if (this._depthMrts[0].getSize().width !== this._engine.getRenderWidth() || this._depthMrts[0].getSize().height !== this._engine.getRenderHeight()) {
        //     this._disposeTextures();
        //     this._createTextures();
        // }
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

        // if (this._blendBackTexture !== prePassTexture) {
        //     this._blendBackTexture = prePassTexture;
        //     this._blendBackMrt.setInternalTexture(this._blendBackTexture, 0);

        //     if (this._thinTextures[6]) {
        //         this._thinTextures[6].dispose();
        //     }
        //     this._thinTextures[6] = new ThinTexture(this._blendBackTexture);

        //     prePassRenderer.defaultRT.renderTarget!._shareDepth(this._depthMrts[0].renderTarget!);
        // }

        return true;
    }

    private _createEffects() {
        //     this._blendBackEffectWrapper = new EffectWrapper({
        //         fragmentShader: "oitBackBlend",
        //         useShaderStore: true,
        //         engine: this._engine,
        //         samplerNames: ["uBackColor"],
        //         uniformNames: [],
        //     });
        //     this._blendBackEffectWrapperPingPong = new EffectWrapper({
        //         fragmentShader: "oitBackBlend",
        //         useShaderStore: true,
        //         engine: this._engine,
        //         samplerNames: ["uBackColor"],
        //         uniformNames: [],
        //     });

        // this._finalEffectWrapper = new EffectWrapper({
        //     fragmentShader: "iblShadowDebug",
        //     useShaderStore: true,
        //     engine: this._engine,
        //     samplerNames: ["worldNormalSampler", "localPositionSampler", "velocitySampler", "depthSampler"],
        //     uniformNames: [],
        // });

        this._effectRenderer = new EffectRenderer(this._engine);
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
        this._effectRenderer.dispose();
        this._voxelRenderer.dispose();
        this._importanceSamplingRenderer.dispose();
    }
}
