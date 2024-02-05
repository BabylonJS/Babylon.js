/**
 * Reflective Shadow Maps were first described in http://www.klayge.org/material/3_12/GI/rsm.pdf by Carsten Dachsbacher and Marc Stamminger
 * Further explanations and implementations can be found in:
 * - Jaker video explaining RSM and its implementation: https://www.youtube.com/watch?v=LJQQdBsOYPM
 * - C++ implementation by Luis Angel: https://github.com/imyoungmin/RSM
 * - Javascript implementation by Erkaman: https://github.com/Erkaman/webgl-rsm
 */
import type { Scene } from "core/scene";
import type { GIRSM } from "./giRSM";
import type { Material } from "core/Materials/material";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import type { Nullable } from "core/types";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { PostProcess } from "core/PostProcesses/postProcess";
import type { Observer } from "core/Misc/observable";
import { Layer } from "core/Layers/layer";
import { Matrix } from "core/Maths/math.vector";
import { Constants } from "core/Engines/constants";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { MaterialPluginBase } from "core/Materials/materialPluginBase";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import type { UniformBuffer } from "core/Materials/uniformBuffer";
import type { Engine } from "core/Engines/engine";
import { GeometryBufferRenderer } from "../geometryBufferRenderer";
import { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { WebGPURenderTargetWrapper } from "core/Engines/WebGPU/webgpuRenderTargetWrapper";
import { expandToProperty, serialize } from "core/Misc/decorators";
import { MaterialDefines } from "core/Materials/materialDefines";
import { RegisterClass } from "core/Misc/typeStore";

import "../../Shaders/bilateralBlur.fragment";
import "../../Shaders/bilateralBlurQuality.fragment";
import "../../Shaders/rsmGlobalIllumination.fragment";
import "../../Shaders/rsmFullGlobalIllumination.fragment";

/**
 * Class used to manage the global illumination contribution calculated from reflective shadow maps (RSM).
 */
export class GIRSMManager {
    private _scene: Scene;
    private _engine: Engine;
    private _giRSM: GIRSM[] = [];
    private _materialsWithRenderPlugin: Material[];
    private _sampleTexture: RawTexture;
    private _maxSamples: number;
    private _blurRTT: Nullable<RenderTargetTexture> = null;
    private _blurPostProcesses: Nullable<PostProcess[]> = null;
    private _blurXPostprocess: Nullable<PostProcess> = null;
    private _blurYPostprocess: Nullable<PostProcess> = null;
    private _upsamplingXPostprocess: Nullable<PostProcess> = null;
    private _upsamplingYPostprocess: Nullable<PostProcess> = null;
    private _ppGlobalIllumination: PostProcess[] = [];
    private _drawPhaseObserver: Observer<Scene>;
    private _debugLayer: Layer;
    private _counters: Array<{ name: string; value: number }>;
    private _countersRTW: Array<RenderTargetWrapper[]>;
    private _firstActivation = true;
    private _geomBufferEnabled = false;
    private _geomBufferEnablePosition = false;
    private _tempMatrix = new Matrix();

    private _enable = false;

    /**
     * Defines the default texture types and formats used by the geometry buffer renderer.
     */
    public static GeometryBufferTextureTypesAndFormats: { [key: number]: { textureType: number; textureFormat: number } } = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        0: { textureType: Constants.TEXTURETYPE_HALF_FLOAT, textureFormat: Constants.TEXTUREFORMAT_R }, // depth
        // eslint-disable-next-line @typescript-eslint/naming-convention
        1: { textureType: Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV, textureFormat: Constants.TEXTUREFORMAT_RGBA }, // normal
        // eslint-disable-next-line @typescript-eslint/naming-convention
        2: { textureType: Constants.TEXTURETYPE_HALF_FLOAT, textureFormat: Constants.TEXTUREFORMAT_RGBA }, // position
    };

    /**
     * Enables or disables the manager. Default is false.
     * If disabled, the global illumination won't be calculated and the scene will be rendered normally, without any global illumination contribution.
     */
    public get enable() {
        return this._enable;
    }

    public set enable(enable: boolean) {
        if (this._giRSM.length === 0) {
            enable = false;
        }

        if (enable === this._enable) {
            return;
        }

        this._enable = enable;
        this._debugLayer.isEnabled = this._showOnlyGI && enable;
        this._materialsWithRenderPlugin.forEach((mat) => {
            if (mat.pluginManager) {
                const plugin = mat.pluginManager.getPlugin(GIRSMRenderPluginMaterial.Name) as GIRSMRenderPluginMaterial;
                plugin.isEnabled = enable;
            }
        });

        this.recreateResources(!enable);
    }

    /**
     * Defines if the global illumination calculation is paused or not.
     * Use this setting to pause the global illumination calculation when you know that the scene (camera/mesh/light positions) is not changing anymore to save some GPU power.
     * The scene will still be rendered with the latest global illumination contribution.
     */
    public pause = false;

    private _enableBlur = true;

    /**
     * Defines if the global illumination contribution should be blurred or not (using a bilateral blur). Default is true.
     */
    public get enableBlur() {
        return this._enableBlur;
    }

    public set enableBlur(enable: boolean) {
        if (enable === this._enableBlur) {
            return;
        }

        this._enableBlur = enable;
        this.recreateResources();
    }

    private _useQualityBlur = false;

    /**
     * Defines if the blur should be done with a better quality but slower or not. Default is false.
     */
    public get useQualityBlur() {
        return this._useQualityBlur;
    }

    public set useQualityBlur(enable: boolean) {
        if (enable === this._useQualityBlur) {
            return;
        }

        this._useQualityBlur = enable;
        this.recreateResources();
    }

    /**
     * Defines the depth threshold used by the bilateral blur post-processes (also used by the upsampling, if enabled).
     * You may have to change this value, depending on your scene.
     */
    public blurDepthThreshold = 0.05;

    /**
     * Defines the normal threshold used by the bilateral blur post-processes (also used by the upsampling, if enabled).
     * You may have to change this value, depending on your scene.
     */
    public blurNormalThreshold = 0.25;

    /**
     * Defines the kernel size used by the bilateral blur post-processes. Default is 12.
     */
    public blurKernel = 12;

    private _forceFullSizeBlur = false;

    /**
     * Defines if the blur should be done at full resolution or not. Default is false.
     * If this setting is eabled, upampling will be disabled (ignored) as it is not needed anymore.
     */
    public get fullSizeBlur() {
        return this._forceFullSizeBlur;
    }

    public set fullSizeBlur(mode: boolean) {
        if (this._forceFullSizeBlur === mode) {
            return;
        }

        this._forceFullSizeBlur = mode;
        this.recreateResources();
    }

    private _useQualityUpsampling = false;

    /**
     * Defines if the upsampling should be done with a better quality but slower or not. Default is false.
     */
    public get useQualityUpsampling() {
        return this._useQualityUpsampling;
    }

    public set useQualityUpsampling(enable: boolean) {
        if (enable === this._useQualityUpsampling) {
            return;
        }

        this._useQualityUpsampling = enable;
        this.recreateResources();
    }

    /**
     * Defines the kernel size used by the bilateral upsampling post-processes. Default is 6.
     */
    public upsamplerKernel = 6;

    private _showOnlyGI = false;

    /**
     * Defines if the debug layer should be enabled or not. Default is false.
     * Use this setting for debugging purpose, to show the global illumination contribution only.
     */
    public get showOnlyGI() {
        return this._showOnlyGI;
    }

    public set showOnlyGI(show) {
        if (this._showOnlyGI === show) {
            return;
        }

        this._showOnlyGI = show;
        this._debugLayer.isEnabled = show;
    }

    private _outputDimensions: { width: number; height: number };

    /**
     * Sets the output dimensions of the final process. It should normally be the same as the output dimensions of the screen.
     * @param dimensions The dimensions of the output texture (width and height)
     */
    public setOutputDimensions(dimensions: { width: number; height: number }) {
        this._outputDimensions = dimensions;
        this.recreateResources();
    }

    private _giTextureDimensions: { width: number; height: number };

    /**
     * Sets the dimensions of the GI texture. Try to use the smallest size possible for better performance.
     * @param dimensions The dimensions of the GI texture (width and height)
     */
    public setGITextureDimensions(dimensions: { width: number; height: number }) {
        this._giTextureDimensions = dimensions;
        this.recreateResources();
    }

    private _giTextureType: number;

    /**
     * Gets or sets the texture type used by the GI texture. Default is Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV.
     */
    public get giTextureType() {
        return this._giTextureType;
    }

    public set giTextureType(textureType: number) {
        if (this._giTextureType === textureType) {
            return;
        }

        this._giTextureType = textureType;
        this.recreateResources();
    }

    /**
     * Gets the list of GIRSM used by the manager.
     */
    public get giRSM() {
        return this._giRSM;
    }

    /**
     * Adds a (list of) GIRSM to the manager.
     * @param rsm The GIRSM (or array of GIRSM) to add to the manager
     */
    public addGIRSM(rsm: GIRSM | GIRSM[]) {
        if (Array.isArray(rsm)) {
            this._giRSM.push(...rsm);
        } else {
            this._giRSM.push(rsm);
        }

        this.recreateResources();
    }

    /**
     * Removes a (list of) GIRSM from the manager.
     * @param rsm The GIRSM (or array of GIRSM) to remove from the manager
     */
    public removeGIRSM(rsm: GIRSM | GIRSM[]) {
        if (Array.isArray(rsm)) {
            for (let i = 0; i < rsm.length; ++i) {
                const idx = this._giRSM.indexOf(rsm[i]);
                if (idx !== -1) {
                    this._giRSM.splice(idx, 1);
                }
            }
        } else {
            const idx = this._giRSM.indexOf(rsm);
            if (idx !== -1) {
                this._giRSM.splice(idx, 1);
            }
        }

        if (this._giRSM.length === 0) {
            this.enable = false;
        } else {
            this.recreateResources();
        }
    }

    /**
     * Add a material to the manager. This will enable the global illumination contribution for the material.
     * @param material Material that will be affected by the global illumination contribution. If not provided, all materials of the scene will be affected.
     */
    public addMaterial(material?: Material) {
        if (material) {
            this._addGISupportToMaterial(material);
        } else {
            this._scene.meshes.forEach((mesh) => {
                if (mesh.getTotalVertices() > 0 && mesh.isEnabled() && mesh.material) {
                    this._addGISupportToMaterial(mesh.material);
                }
            });
        }
    }

    /**
     * Gets the list of GPU counters used by the manager.
     * GPU timing measurements must be enabled for the counters to be filled (engine.enableGPUTimingMeasurements = true).
     * Only available with WebGPU. You will still get the list of counters with other engines but the values will always be 0.
     */
    public get countersGPU(): Array<{ name: string; value: number }> {
        return this._counters;
    }

    /**
     * Recreates the resources used by the manager.
     * You should normally not have to call this method manually, except if you change the useFullTexture property of a GIRSM, because the manager won't track this change.
     * @param disposeGeometryBufferRenderer Defines if the geometry buffer renderer should be disposed and recreated. Default is false.
     */
    public recreateResources(disposeGeometryBufferRenderer = false) {
        this._disposePostProcesses(disposeGeometryBufferRenderer);
        this._createPostProcesses();
        this._setPluginParameters();
    }

    /**
     * Generates the sample texture used by the the global illumination calculation process.
     * @param maxSamples The maximum number of samples to generate in the texture. Default value is 2048. The numSamples property of the GIRSM should be less than or equal to this value!
     */
    public generateSampleTexture(maxSamples: number) {
        this._sampleTexture?.dispose();

        this._maxSamples = maxSamples;

        const data = new Float32Array(this._maxSamples * 4);
        for (let i = 0; i < this._maxSamples; i++) {
            const xi1 = Math.random();
            const xi2 = Math.random();

            const x = xi1 * Math.sin(2 * Math.PI * xi2);
            const y = xi1 * Math.cos(2 * Math.PI * xi2);

            data[i * 4 + 0] = x;
            data[i * 4 + 1] = y;
            data[i * 4 + 2] = xi1 * xi1;
            data[i * 4 + 3] = 1;
        }

        this._sampleTexture = new RawTexture(
            data,
            this._maxSamples,
            1,
            Constants.TEXTUREFORMAT_RGBA,
            this._scene,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_FLOAT
        );
        this._sampleTexture.name = "GIRSMSamples";
    }

    /**
     * Disposes the manager.
     */
    public dispose() {
        this._disposePostProcesses(true);
        this._debugLayer.texture?.dispose();
        this._debugLayer.dispose();
        this._scene.onBeforeDrawPhaseObservable.remove(this._drawPhaseObserver);
    }

    /**
     * Creates a new GIRSMManager
     * @param scene The scene
     * @param outputDimensions The dimensions of the output texture (width and height). Should normally be the same as the output dimensions of the screen.
     * @param giTextureDimensions The dimensions of the GI texture (width and height). Try to use the smallest size possible for better performance.
     * @param maxSamples The maximum number of samples to generate in the sample texture. Default value is 2048. The numSamples property of the GIRSM should be less than or equal to this value!
     * @param giTextureType The texture type used by the GI texture. Default is Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV.
     */
    constructor(
        scene: Scene,
        outputDimensions: { width: number; height: number },
        giTextureDimensions = { width: 256, height: 256 },
        maxSamples = 2048,
        giTextureType = Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV
    ) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._outputDimensions = outputDimensions;
        this._giTextureDimensions = giTextureDimensions;
        this._giTextureType = giTextureType;
        this._materialsWithRenderPlugin = [];
        this._maxSamples = maxSamples;
        this._debugLayer = new Layer("debug layer", null, this._scene, false);
        this._debugLayer.isEnabled = false;
        this._counters = [];
        this._countersRTW = [];

        this.generateSampleTexture(maxSamples);

        this._drawPhaseObserver = this._scene.onBeforeDrawPhaseObservable.add(() => {
            const currentRenderTarget = this._engine._currentRenderTarget;
            let rebindCurrentRenderTarget = false;

            if (this._enable) {
                if (!this.pause) {
                    this._scene.postProcessManager.directRender(this._ppGlobalIllumination, this._ppGlobalIllumination[0].inputTexture);
                    this._engine.unBindFramebuffer(this._ppGlobalIllumination[0].inputTexture, true);

                    this._engine.setAlphaMode(Constants.ALPHA_DISABLE);

                    rebindCurrentRenderTarget = true;

                    if (this.enableBlur && this._blurPostProcesses) {
                        this._scene.postProcessManager.directRender(this._blurPostProcesses, this._blurRTT!.renderTarget, true);
                        this._engine.unBindFramebuffer(this._blurRTT!.renderTarget!, true);
                    }
                }

                for (let i = 0; i < this._counters.length; ++i) {
                    const rtws = this._countersRTW[i];
                    for (let t = 0; t < rtws.length; ++t) {
                        if (t === 0) {
                            this._counters[i].value = this.pause ? 0 : (rtws[t] as WebGPURenderTargetWrapper).gpuTimeInFrame?.counter.lastSecAverage ?? 0;
                        } else if (!this.pause) {
                            this._counters[i].value += (rtws[t] as WebGPURenderTargetWrapper).gpuTimeInFrame?.counter.lastSecAverage ?? 0;
                        }
                    }
                }

                if (this._scene.activeCamera) {
                    this._engine.setViewport(this._scene.activeCamera.viewport);
                }
            }

            if (rebindCurrentRenderTarget && currentRenderTarget) {
                this._engine.bindFramebuffer(currentRenderTarget);
            }
        });
    }

    protected _disposePostProcesses(disposeGeometryBufferRenderer = false) {
        this._blurRTT?.dispose();
        this._blurRTT = null;
        this._blurPostProcesses = [];
        this._blurXPostprocess?.dispose();
        this._blurXPostprocess = null;
        this._blurYPostprocess?.dispose();
        this._blurYPostprocess = null;
        this._upsamplingXPostprocess?.dispose();
        this._upsamplingXPostprocess = null;
        this._upsamplingYPostprocess?.dispose();
        this._upsamplingYPostprocess = null;
        for (const ppGlobalIllumination of this._ppGlobalIllumination) {
            ppGlobalIllumination.dispose();
        }
        this._ppGlobalIllumination = [];
        if (disposeGeometryBufferRenderer) {
            if (this._geomBufferEnabled) {
                this._scene.enableGeometryBufferRenderer();
                this._scene.geometryBufferRenderer!.enablePosition = this._geomBufferEnablePosition;
            } else {
                this._scene.disableGeometryBufferRenderer();
            }
        }
        this._counters = [];
        this._countersRTW = [];
    }

    protected _setPluginParameters() {
        if (!this._enable) {
            return;
        }

        this._materialsWithRenderPlugin.forEach((mat) => {
            if (mat.pluginManager) {
                const plugin = mat.pluginManager.getPlugin<GIRSMRenderPluginMaterial>(GIRSMRenderPluginMaterial.Name)!;
                plugin.textureGIContrib = this.enableBlur ? this._blurRTT!.renderTarget!.texture! : this._ppGlobalIllumination[0].inputTexture.texture!;
                plugin.outputTextureWidth = this._outputDimensions.width;
                plugin.outputTextureHeight = this._outputDimensions.height;
            }
        });
    }

    protected _createPostProcesses() {
        if (!this._enable) {
            return;
        }

        const textureFormat = this._giTextureType === Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV ? Constants.TEXTUREFORMAT_RGB : Constants.TEXTUREFORMAT_RGBA;

        if (this._firstActivation) {
            this._firstActivation = false;
            this._geomBufferEnabled = !!this._scene.geometryBufferRenderer;
            this._geomBufferEnablePosition = this._scene.geometryBufferRenderer?.enablePosition ?? false;
        }

        if (!this._geomBufferEnabled) {
            this._scene.disableGeometryBufferRenderer();
        }

        const geometryBufferRenderer = this._scene.enableGeometryBufferRenderer(
            this._enableBlur ? this._outputDimensions : this._giTextureDimensions,
            Constants.TEXTUREFORMAT_DEPTH16,
            GIRSMManager.GeometryBufferTextureTypesAndFormats
        );

        if (!geometryBufferRenderer) {
            throw new Error("Geometry buffer renderer is not supported but is required for GIRSMManager.");
        }

        geometryBufferRenderer.enablePosition = true;
        if (!this._geomBufferEnabled) {
            geometryBufferRenderer.generateNormalsInWorldSpace = true;
        }

        const decodeGeometryBufferNormals = geometryBufferRenderer.normalsAreUnsigned;
        const normalsAreInWorldSpace = geometryBufferRenderer.generateNormalsInWorldSpace;

        this._counters.push({ name: "Geometry buffer renderer", value: 0 });
        this._countersRTW.push([this._scene.geometryBufferRenderer!.getGBuffer().renderTarget!]);

        let defines = "";
        if (decodeGeometryBufferNormals) {
            defines += "#define DECODE_NORMAL\n";
        }
        if (!normalsAreInWorldSpace) {
            defines += "#define TRANSFORM_NORMAL\n";
        }

        for (let i = 0; i < this._giRSM.length; ++i) {
            const giRSM = this._giRSM[i];
            const rsm = giRSM.rsm;

            const ppGlobalIllumination = new PostProcess("RSMGlobalIllumination" + i, giRSM.useFullTexture ? "rsmFullGlobalIllumination" : "rsmGlobalIllumination", {
                ...this._giTextureDimensions,
                uniforms: ["rsmLightMatrix", "rsmInfo", "rsmInfo2", "invView"],
                samplers: ["normalSampler", "rsmPositionW", "rsmNormalW", "rsmFlux", "rsmSamples"],
                defines,
                samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                engine: this._engine,
                textureType: this._giTextureType,
                textureFormat,
            });

            this._ppGlobalIllumination.push(ppGlobalIllumination);

            if (i !== 0) {
                ppGlobalIllumination.shareOutputWith(this._ppGlobalIllumination[0]);
                ppGlobalIllumination.alphaMode = Constants.ALPHA_ADD;
            }

            ppGlobalIllumination.autoClear = false;
            ppGlobalIllumination.externalTextureSamplerBinding = true;
            ppGlobalIllumination.onApplyObservable.add((effect) => {
                effect.setTexture(
                    "textureSampler",
                    geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE)]
                );
                effect.setTexture(
                    "normalSampler",
                    geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE)]
                );
                effect.setTexture("rsmPositionW", rsm.positionWorldTexture);
                effect.setTexture("rsmNormalW", rsm.normalWorldTexture);
                effect.setTexture("rsmFlux", rsm.fluxTexture);
                effect.setMatrix("rsmLightMatrix", rsm.lightTransformationMatrix);
                if (!giRSM.useFullTexture) {
                    effect.setTexture("rsmSamples", this._sampleTexture);
                    effect.setFloat4("rsmInfo", giRSM.numSamples, giRSM.radius, giRSM.intensity, giRSM.edgeArtifactCorrection);
                    effect.setFloat4(
                        "rsmInfo2",
                        giRSM.noiseFactor,
                        giRSM.rotateSample ? 1 : 0,
                        rsm.fluxTexture.getInternalTexture()!.width,
                        rsm.fluxTexture.getInternalTexture()!.height
                    );
                } else {
                    effect.setFloat4(
                        "rsmInfo",
                        rsm.fluxTexture.getInternalTexture()!.width,
                        rsm.fluxTexture.getInternalTexture()!.height,
                        giRSM.intensity,
                        giRSM.edgeArtifactCorrection
                    );
                }
                if (!normalsAreInWorldSpace) {
                    this._tempMatrix.copyFrom(this._scene.activeCamera!.getViewMatrix());
                    this._tempMatrix.invert();
                    effect.setMatrix("invView", this._tempMatrix);
                }
            });
        }

        for (const ppGlobalIllumination of this._ppGlobalIllumination) {
            if (!ppGlobalIllumination.inputTexture) {
                ppGlobalIllumination.resize(this._giTextureDimensions.width, this._giTextureDimensions.height);
            }
        }

        this._counters.push({ name: "GI generation", value: 0 });
        this._countersRTW.push([this._ppGlobalIllumination[0].inputTexture]);

        if (this._enableBlur) {
            const blurTextureSize = this._forceFullSizeBlur ? this._outputDimensions : this._giTextureDimensions;

            this._blurRTT = new RenderTargetTexture("GIRSMContribution", this._outputDimensions, this._scene, {
                type: this._giTextureType,
                format: textureFormat,
                generateDepthBuffer: false,
            });
            this._blurRTT.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            this._blurRTT.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            this._blurRTT.updateSamplingMode(Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            this._blurRTT.skipInitialClear = true;

            const blurRTWs: RenderTargetWrapper[] = [];

            this._counters.push({ name: "GI blur", value: 0 });
            this._countersRTW.push(blurRTWs);

            // Bilateral blur
            this._blurXPostprocess = new PostProcess(this._useQualityBlur ? "BilateralBlur" : "BilateralBlurX", this._useQualityBlur ? "bilateralBlurQuality" : "bilateralBlur", {
                uniforms: ["filterSize", "blurDir", "depthThreshold", "normalThreshold"],
                samplers: ["depthSampler", "normalSampler"],
                defines: decodeGeometryBufferNormals ? "#define DECODE_NORMAL" : undefined,
                size: blurTextureSize,
                samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                engine: this._engine,
                textureType: this._giTextureType,
                textureFormat,
            });

            this._blurXPostprocess.onApplyObservable.add((effect) => {
                effect._bindTexture("textureSampler", this._ppGlobalIllumination[0].inputTexture.texture);
                effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.DEPTH_TEXTURE_TYPE)]);
                effect.setTexture(
                    "normalSampler",
                    geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE)]
                );
                effect.setInt("filterSize", this.blurKernel);
                effect.setFloat2("blurDir", 1 / this._giTextureDimensions.width, this._useQualityBlur ? 1 / this._giTextureDimensions.height : 0);
                effect.setFloat("depthThreshold", this.blurDepthThreshold);
                effect.setFloat("normalThreshold", this.blurNormalThreshold);
            });

            this._blurXPostprocess.externalTextureSamplerBinding = true;
            this._blurXPostprocess.autoClear = false;

            if (!this._useQualityBlur) {
                this._blurYPostprocess = new PostProcess("BilateralBlurY", "bilateralBlur", {
                    uniforms: ["filterSize", "blurDir", "depthThreshold", "normalThreshold"],
                    samplers: ["depthSampler", "normalSampler"],
                    defines: decodeGeometryBufferNormals ? "#define DECODE_NORMAL" : undefined,
                    size: blurTextureSize,
                    samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                    engine: this._engine,
                    textureType: this._giTextureType,
                    textureFormat,
                });

                this._blurYPostprocess.autoClear = false;
                this._blurYPostprocess.onApplyObservable.add((effect) => {
                    effect.setTexture(
                        "depthSampler",
                        geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.DEPTH_TEXTURE_TYPE)]
                    );
                    effect.setTexture(
                        "normalSampler",
                        geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE)]
                    );
                    effect.setInt("filterSize", this.blurKernel);
                    effect.setFloat2("blurDir", 0, 1 / this._giTextureDimensions.height);
                    effect.setFloat("depthThreshold", this.blurDepthThreshold);
                    effect.setFloat("normalThreshold", this.blurNormalThreshold);
                });

                this._blurYPostprocess.resize(blurTextureSize.width, blurTextureSize.height);

                blurRTWs.push(this._blurYPostprocess.inputTexture);
            }

            this._blurPostProcesses = [this._blurXPostprocess];
            if (this._blurYPostprocess) {
                this._blurPostProcesses.push(this._blurYPostprocess);
            }

            // Bilateral upsampling
            const giFullDimensions = this._giTextureDimensions.width >= this._outputDimensions.width && this._giTextureDimensions.height >= this._outputDimensions.height;

            if (!giFullDimensions && !this._forceFullSizeBlur) {
                const upsamplingRTWs: RenderTargetWrapper[] = [];

                this._counters.push({ name: "GI upsampling", value: 0 });
                this._countersRTW.push(upsamplingRTWs);

                this._upsamplingXPostprocess = new PostProcess(
                    this._useQualityUpsampling ? "BilateralUpsampling" : "BilateralUpsamplingX",
                    this._useQualityUpsampling ? "bilateralBlurQuality" : "bilateralBlur",
                    {
                        uniforms: ["filterSize", "blurDir", "depthThreshold", "normalThreshold"],
                        samplers: ["depthSampler", "normalSampler"],
                        defines: decodeGeometryBufferNormals ? "#define DECODE_NORMAL" : undefined,
                        size: blurTextureSize,
                        samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                        engine: this._engine,
                        textureType: this._giTextureType,
                        textureFormat,
                    }
                );

                this._upsamplingXPostprocess.autoClear = false;
                this._upsamplingXPostprocess.onApplyObservable.add((effect) => {
                    effect.setTexture(
                        "depthSampler",
                        geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.DEPTH_TEXTURE_TYPE)]
                    );
                    effect.setTexture(
                        "normalSampler",
                        geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE)]
                    );
                    effect.setInt("filterSize", this.upsamplerKernel);
                    effect.setFloat2("blurDir", 1 / this._outputDimensions.width, this._useQualityUpsampling ? 1 / this._outputDimensions.height : 0);
                    effect.setFloat("depthThreshold", this.blurDepthThreshold);
                    effect.setFloat("normalThreshold", this.blurNormalThreshold);
                });

                this._upsamplingXPostprocess.resize(blurTextureSize.width, blurTextureSize.height);

                blurRTWs.push(this._upsamplingXPostprocess.inputTexture);

                if (!this.useQualityUpsampling) {
                    this._upsamplingYPostprocess = new PostProcess("BilateralUpsamplingY", "bilateralBlur", {
                        uniforms: ["filterSize", "blurDir", "depthThreshold", "normalThreshold"],
                        samplers: ["depthSampler", "normalSampler"],
                        defines: decodeGeometryBufferNormals ? "#define DECODE_NORMAL" : undefined,
                        size: this._outputDimensions,
                        samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                        engine: this._engine,
                        textureType: this._giTextureType,
                        textureFormat,
                    });

                    this._upsamplingYPostprocess.autoClear = false;
                    this._upsamplingYPostprocess.onApplyObservable.add((effect) => {
                        effect.setTexture(
                            "depthSampler",
                            geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.DEPTH_TEXTURE_TYPE)]
                        );
                        effect.setTexture(
                            "normalSampler",
                            geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE)]
                        );
                        effect.setInt("filterSize", this.upsamplerKernel);
                        effect.setFloat2("blurDir", 0, 1 / this._outputDimensions.height);
                        effect.setFloat("depthThreshold", this.blurDepthThreshold);
                        effect.setFloat("normalThreshold", this.blurNormalThreshold);
                    });

                    this._upsamplingYPostprocess.resize(this._outputDimensions.width, this._outputDimensions.height);

                    upsamplingRTWs.push(this._upsamplingYPostprocess.inputTexture);
                }

                upsamplingRTWs.push(this._blurRTT.renderTarget!);

                this._blurPostProcesses.push(this._upsamplingXPostprocess);
                if (this._upsamplingYPostprocess) {
                    this._blurPostProcesses.push(this._upsamplingYPostprocess);
                }
            } else {
                blurRTWs.push(this._blurRTT.renderTarget!);
            }
        }

        this._debugLayer.texture?.dispose();
        this._debugLayer.texture = new BaseTexture(this._scene, this._enableBlur ? this._blurRTT!.renderTarget!.texture : this._ppGlobalIllumination[0].inputTexture.texture);
    }

    protected _addGISupportToMaterial(material: Material) {
        if (material.pluginManager?.getPlugin(GIRSMRenderPluginMaterial.Name)) {
            return;
        }

        const plugin = new GIRSMRenderPluginMaterial(material);

        if (this._enable && this._ppGlobalIllumination.length > 0) {
            plugin.textureGIContrib = this._ppGlobalIllumination[0].inputTexture.texture!;
            plugin.outputTextureWidth = this._outputDimensions.width;
            plugin.outputTextureHeight = this._outputDimensions.height;
        }

        plugin.isEnabled = this._enable;

        this._materialsWithRenderPlugin.push(material);
    }
}

/**
 * @internal
 */
class MaterialGIRSMRenderDefines extends MaterialDefines {
    public RENDER_WITH_GIRSM = false;
    public RSMCREATE_PROJTEXTURE = false;
}

/**
 * Plugin used to render the global illumination contribution.
 */
export class GIRSMRenderPluginMaterial extends MaterialPluginBase {
    private _isPBR;

    /**
     * Defines the name of the plugin.
     */
    public static readonly Name = "GIRSMRender";

    /**
     * The texture containing the global illumination contribution.
     */
    @serialize()
    public textureGIContrib: InternalTexture;

    /**
     * The width of the output texture.
     */
    @serialize()
    public outputTextureWidth: number;

    /**
     * The height of the output texture.
     */
    @serialize()
    public outputTextureHeight: number;

    private _isEnabled = false;
    /**
     * Defines if the plugin is enabled in the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isEnabled = false;

    protected _markAllSubMeshesAsTexturesDirty(): void {
        this._enable(this._isEnabled);
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }

    private _internalMarkAllSubMeshesAsTexturesDirty: () => void;

    constructor(material: Material | StandardMaterial | PBRBaseMaterial) {
        super(material, GIRSMRenderPluginMaterial.Name, 310, new MaterialGIRSMRenderDefines());

        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[Constants.MATERIAL_TextureDirtyFlag];

        this._isPBR = material instanceof PBRBaseMaterial;
    }

    public prepareDefines(defines: MaterialGIRSMRenderDefines) {
        defines.RENDER_WITH_GIRSM = this._isEnabled;
    }

    public getClassName() {
        return "GIRSMRenderPluginMaterial";
    }

    public getUniforms() {
        return {
            ubo: [{ name: "girsmTextureOutputSize", size: 2, type: "vec2" }],
            fragment: `#ifdef RENDER_WITH_GIRSM
                    uniform vec2 girsmTextureOutputSize;
                #endif`,
        };
    }

    public getSamplers(samplers: string[]) {
        samplers.push("girsmTextureGIContrib");
    }

    public bindForSubMesh(uniformBuffer: UniformBuffer) {
        if (this._isEnabled) {
            uniformBuffer.bindTexture("girsmTextureGIContrib", this.textureGIContrib);
            uniformBuffer.updateFloat2("girsmTextureOutputSize", this.outputTextureWidth, this.outputTextureHeight);
        }
    }

    public getCustomCode(shaderType: string) {
        const frag: { [name: string]: string } = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            CUSTOM_FRAGMENT_DEFINITIONS: `
                #ifdef RENDER_WITH_GIRSM
                    uniform sampler2D girsmTextureGIContrib;

                    vec3 computeIndirect() {
                        vec2 uv = gl_FragCoord.xy / girsmTextureOutputSize;
                        return texture2D(girsmTextureGIContrib, uv).rgb;
                    }
                #endif
            `,

            // eslint-disable-next-line @typescript-eslint/naming-convention
            CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION: `
                #ifdef RENDER_WITH_GIRSM
                    finalDiffuse += computeIndirect() * surfaceAlbedo.rgb;
                #endif
            `,
        };

        if (!this._isPBR) {
            frag["CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR"] = `
                #ifdef RENDER_WITH_GIRSM
                    color.rgb += computeIndirect() * baseColor.rgb;
                #endif
            `;
        }

        return shaderType === "vertex" ? null : frag;
    }
}

RegisterClass(`BABYLON.GIRSMRenderPluginMaterial`, GIRSMRenderPluginMaterial);
