/* eslint-disable @typescript-eslint/naming-convention */
import { Logger } from "../../../Misc/logger";
import { serialize, SerializationHelper } from "../../../Misc/decorators";
import { Vector3, TmpVectors, Vector2 } from "../../../Maths/math.vector";
import { Camera } from "../../../Cameras/camera";
import type { Effect } from "../../../Materials/effect";
import { Texture } from "../../../Materials/Textures/texture";
import { PostProcess } from "../../../PostProcesses/postProcess";
import { PostProcessRenderPipeline } from "../../../PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { PostProcessRenderEffect } from "../../../PostProcesses/RenderPipeline/postProcessRenderEffect";
import { PassPostProcess } from "../../../PostProcesses/passPostProcess";
import type { Scene } from "../../../scene";
import { RegisterClass } from "../../../Misc/typeStore";
import { EngineStore } from "../../../Engines/engineStore";
import { SSAO2Configuration } from "../../../Rendering/ssao2Configuration";
import type { PrePassRenderer } from "../../../Rendering/prePassRenderer";
import type { GeometryBufferRenderer } from "../../../Rendering/geometryBufferRenderer";
import { Constants } from "../../../Engines/constants";
import type { Nullable } from "../../../types";
import { Scalar } from "../../../Maths/math.scalar";
import { RawTexture } from "../../../Materials/Textures/rawTexture";

import "../../../PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";

import "../../../Shaders/ssao2.fragment";
import "../../../Shaders/ssaoCombine.fragment";

/**
 * Render pipeline to produce ssao effect
 */
export class SSAO2RenderingPipeline extends PostProcessRenderPipeline {
    // Members

    /**
     * @ignore
     * The PassPostProcess id in the pipeline that contains the original scene color
     */
    public SSAOOriginalSceneColorEffect: string = "SSAOOriginalSceneColorEffect";
    /**
     * @ignore
     * The SSAO PostProcess id in the pipeline
     */
    public SSAORenderEffect: string = "SSAORenderEffect";
    /**
     * @ignore
     * The horizontal blur PostProcess id in the pipeline
     */
    public SSAOBlurHRenderEffect: string = "SSAOBlurHRenderEffect";
    /**
     * @ignore
     * The vertical blur PostProcess id in the pipeline
     */
    public SSAOBlurVRenderEffect: string = "SSAOBlurVRenderEffect";
    /**
     * @ignore
     * The PostProcess id in the pipeline that combines the SSAO-Blur output with the original scene color (SSAOOriginalSceneColorEffect)
     */
    public SSAOCombineRenderEffect: string = "SSAOCombineRenderEffect";

    /**
     * The output strength of the SSAO post-process. Default value is 1.0.
     */
    @serialize()
    public totalStrength: number = 1.0;

    /**
     * Maximum depth value to still render AO. A smooth falloff makes the dimming more natural, so there will be no abrupt shading change.
     */
    @serialize()
    public maxZ: number = 100.0;

    /**
     * In order to save performances, SSAO radius is clamped on close geometry. This ratio changes by how much.
     */
    @serialize()
    public minZAspect: number = 0.2;

    @serialize("epsilon")
    private _epsilon: number = 0.02;
    /**
     * Used in SSAO calculations to compensate for accuracy issues with depth values. Default 0.02.
     *
     * Normally you do not need to change this value, but you can experiment with it if you get a lot of in false self-occlusion on flat surfaces when using fewer than 16 samples. Useful range is normally [0..0.1] but higher values is allowed.
     */
    public set epsilon(n: number) {
        this._epsilon = n;
        this._ssaoPostProcess.updateEffect(this._getDefinesForSSAO());
    }
    public get epsilon(): number {
        return this._epsilon;
    }

    @serialize("samples")
    private _samples: number = 8;
    /**
     * Number of samples used for the SSAO calculations. Default value is 8.
     */
    public set samples(n: number) {
        this._samples = n;
        this._ssaoPostProcess.updateEffect(this._getDefinesForSSAO());
        this._sampleSphere = this._generateHemisphere();
    }
    public get samples(): number {
        return this._samples;
    }

    @serialize("textureSamples")
    private _textureSamples: number = 1;
    /**
     * Number of samples to use for antialiasing.
     */
    public set textureSamples(n: number) {
        this._textureSamples = n;

        if (this._prePassRenderer) {
            this._prePassRenderer.samples = n;
        } else {
            this._originalColorPostProcess.samples = n;
        }
    }
    public get textureSamples(): number {
        return this._textureSamples;
    }

    /**
     * Force rendering the geometry through geometry buffer.
     */
    @serialize()
    private _forceGeometryBuffer: boolean = false;
    private get _geometryBufferRenderer(): Nullable<GeometryBufferRenderer> {
        if (!this._forceGeometryBuffer) {
            return null;
        }
        return this._scene.geometryBufferRenderer;
    }
    private get _prePassRenderer(): Nullable<PrePassRenderer> {
        if (this._forceGeometryBuffer) {
            return null;
        }
        return this._scene.prePassRenderer;
    }

    /**
     * Ratio object used for SSAO ratio and blur ratio
     */
    @serialize()
    private _ratio: any;

    /*
     * The texture type used by the different post processes created by SSAO
     */
    @serialize()
    private _textureType: number;

    /**
     * Dynamically generated sphere sampler.
     */
    private _sampleSphere: number[];

    /**
     * The radius around the analyzed pixel used by the SSAO post-process. Default value is 2.0
     */
    @serialize()
    public radius: number = 2.0;

    /**
     * The base color of the SSAO post-process
     * The final result is "base + ssao" between [0, 1]
     */
    @serialize()
    public base: number = 0;

    @serialize("bypassBlur")
    private _bypassBlur: boolean = false;
    /**
     * Skips the denoising (blur) stage of the SSAO calculations.
     *
     * Useful to temporarily set while experimenting with the other SSAO2 settings.
     */
    public set bypassBlur(b: boolean) {
        const defines = this._getDefinesForBlur(this.expensiveBlur, b);
        const samplers = this._getSamplersForBlur(b);
        this._blurHPostProcess.updateEffect(defines.h, null, samplers);
        this._blurVPostProcess.updateEffect(defines.v, null, samplers);
        this._bypassBlur = b;
    }
    public get bypassBlur(): boolean {
        return this._bypassBlur;
    }

    @serialize("expensiveBlur")
    private _expensiveBlur: boolean = true;
    /**
     * Enables the configurable bilateral denoising (blurring) filter. Default is true.
     * Set to false to instead use a legacy bilateral filter that can't be configured.
     *
     * The denoising filter runs after the SSAO calculations and is a very important step. Both options results in a so called bilateral being used, but the "expensive" one can be
     * configured in several ways to fit your scene.
     */
    public set expensiveBlur(b: boolean) {
        const defines = this._getDefinesForBlur(b, this._bypassBlur);
        this._blurHPostProcess.updateEffect(defines.h);
        this._blurVPostProcess.updateEffect(defines.v);
        this._expensiveBlur = b;
    }
    public get expensiveBlur(): boolean {
        return this._expensiveBlur;
    }

    /**
     * The number of samples the bilateral filter uses in both dimensions when denoising the SSAO calculations. Default value is 16.
     *
     * A higher value should result in smoother shadows but will use more processing time in the shaders.
     *
     * A high value can cause the shadows to get to blurry or create visible artifacts (bands) near sharp details in the geometry. The artifacts can sometimes be mitigated by increasing the bilateralSoften setting.
     */
    @serialize()
    public bilateralSamples: number = 16;

    /**
     * Controls the shape of the denoising kernel used by the bilateral filter. Default value is 0.
     *
     * By default the bilateral filter acts like a box-filter, treating all samples on the same depth with equal weights. This is effective to maximize the denoising effect given a limited set of samples. However, it also often results in visible ghosting around sharp shadow regions and can spread out lines over large areas so they are no longer visible.
     *
     * Increasing this setting will make the filter pay less attention to samples further away from the center sample, reducing many artifacts but at the same time increasing noise.
     *
     * Useful value range is [0..1].
     */
    @serialize()
    public bilateralSoften: number = 0;

    /**
     * How forgiving the bilateral denoiser should be when rejecting samples. Default value is 0.
     *
     * A higher value results in the bilateral filter being more forgiving and thus doing a better job at denoising slanted and curved surfaces, but can lead to shadows spreading out around corners or between objects that are close to each other depth wise.
     *
     * Useful value range is normally [0..1], but higher values are allowed.
     */
    @serialize()
    public bilateralTolerance: number = 0;

    /**
     *  Support test.
     */
    public static get IsSupported(): boolean {
        const engine = EngineStore.LastCreatedEngine;
        if (!engine) {
            return false;
        }
        return engine._features.supportSSAO2;
    }

    private _scene: Scene;
    private _randomTexture: Texture;
    private _originalColorPostProcess: PassPostProcess;
    private _ssaoPostProcess: PostProcess;
    private _blurHPostProcess: PostProcess;
    private _blurVPostProcess: PostProcess;
    private _ssaoCombinePostProcess: PostProcess;

    /**
     * Gets active scene
     */
    public get scene(): Scene {
        return this._scene;
    }

    /**
     * @constructor
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     * @param ratio The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, blurRatio: 1.0 }
     * @param cameras The array of cameras that the rendering pipeline will be attached to
     * @param forceGeometryBuffer Set to true if you want to use the legacy geometry buffer renderer
     * @param textureType The texture type used by the different post processes created by SSAO (default: Constants.TEXTURETYPE_UNSIGNED_INT)
     */
    constructor(name: string, scene: Scene, ratio: any, cameras?: Camera[], forceGeometryBuffer = false, textureType = Constants.TEXTURETYPE_UNSIGNED_INT) {
        super(scene.getEngine(), name);

        this._scene = scene;
        this._ratio = ratio;
        this._textureType = textureType;
        this._forceGeometryBuffer = forceGeometryBuffer;

        if (!this.isSupported) {
            Logger.Error("The current engine does not support SSAO 2.");
            return;
        }

        const ssaoRatio = this._ratio.ssaoRatio || ratio;
        const blurRatio = this._ratio.blurRatio || ratio;

        // Set up assets
        if (this._forceGeometryBuffer) {
            scene.enableGeometryBufferRenderer();
            if (scene.geometryBufferRenderer?.generateNormalsInWorldSpace) {
                Logger.Error("SSAO2RenderingPipeline does not support generateNormalsInWorldSpace=true for the geometry buffer renderer!");
            }
        } else {
            scene.enablePrePassRenderer();
            if (scene.prePassRenderer?.generateNormalsInWorldSpace) {
                Logger.Error("SSAO2RenderingPipeline does not support generateNormalsInWorldSpace=true for the prepass renderer!");
            }
        }

        this._createRandomTexture();

        this._originalColorPostProcess = new PassPostProcess("SSAOOriginalSceneColor", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), undefined, this._textureType);
        this._originalColorPostProcess.samples = this.textureSamples;
        this._createSSAOPostProcess(1.0, textureType);
        this._createBlurPostProcess(ssaoRatio, blurRatio, this._textureType);
        this._createSSAOCombinePostProcess(blurRatio, this._textureType);

        // Set up pipeline
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                this.SSAOOriginalSceneColorEffect,
                () => {
                    return this._originalColorPostProcess;
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                this.SSAORenderEffect,
                () => {
                    return this._ssaoPostProcess;
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                this.SSAOBlurHRenderEffect,
                () => {
                    return this._blurHPostProcess;
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                this.SSAOBlurVRenderEffect,
                () => {
                    return this._blurVPostProcess;
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                this.SSAOCombineRenderEffect,
                () => {
                    return this._ssaoCombinePostProcess;
                },
                true
            )
        );

        // Finish
        scene.postProcessRenderPipelineManager.addPipeline(this);
        if (cameras) {
            scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
        }
    }

    // Public Methods

    /**
     * Get the class name
     * @returns "SSAO2RenderingPipeline"
     */
    public getClassName(): string {
        return "SSAO2RenderingPipeline";
    }

    /**
     * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
     * @param disableGeometryBufferRenderer Set to true if you want to disable the Geometry Buffer renderer
     */
    public dispose(disableGeometryBufferRenderer: boolean = false): void {
        for (let i = 0; i < this._scene.cameras.length; i++) {
            const camera = this._scene.cameras[i];

            this._originalColorPostProcess.dispose(camera);
            this._ssaoPostProcess.dispose(camera);
            this._blurHPostProcess.dispose(camera);
            this._blurVPostProcess.dispose(camera);
            this._ssaoCombinePostProcess.dispose(camera);
        }

        this._randomTexture.dispose();

        if (disableGeometryBufferRenderer) {
            this._scene.disableGeometryBufferRenderer();
        }

        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);

        super.dispose();
    }

    // Private Methods

    /** @internal */
    public _rebuild() {
        super._rebuild();
    }

    private _getSamplersForBlur(disabled: boolean): Array<string> {
        return disabled ? ["textureSampler"] : ["textureSampler", "depthSampler"];
    }

    private _getDefinesForBlur(bilateral: boolean, disabled: boolean): { h: string; v: string } {
        let define = "#define BLUR\n";
        if (disabled) {
            define += "#define BLUR_BYPASS\n";
        }
        if (!bilateral) {
            define += "#define BLUR_LEGACY\n";
        }
        return { h: define + "#define BLUR_H\n", v: define };
    }

    private _createBlurPostProcess(ssaoRatio: number, blurRatio: number, textureType: number): void {
        const defines = this._getDefinesForBlur(this.expensiveBlur, this.bypassBlur);
        const samplers = this._getSamplersForBlur(this.bypassBlur);

        this._blurHPostProcess = this._createBlurFilter("BlurH", samplers, ssaoRatio, defines.h, textureType, true);
        this._blurVPostProcess = this._createBlurFilter("BlurV", samplers, blurRatio, defines.v, textureType, false);
    }

    private _createBlurFilter(name: string, samplers: Array<string>, ratio: number, defines: string, textureType: number, horizontal: boolean): PostProcess {
        const blurFilter = new PostProcess(
            name,
            "ssao2",
            ["outSize", "samples", "soften", "tolerance"],
            samplers,
            ratio,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            this._scene.getEngine(),
            false,
            defines,
            textureType
        );

        blurFilter.onApply = (effect: Effect) => {
            if (!this._scene.activeCamera) {
                return;
            }

            const ssaoCombineSize = horizontal ? this._ssaoCombinePostProcess.width : this._ssaoCombinePostProcess.height;
            const originalColorSize = horizontal ? this._originalColorPostProcess.width : this._originalColorPostProcess.height;

            effect.setFloat("outSize", ssaoCombineSize > 0 ? ssaoCombineSize : originalColorSize);
            effect.setInt("samples", this.bilateralSamples);
            effect.setFloat("soften", this.bilateralSoften);
            effect.setFloat("tolerance", this.bilateralTolerance);
            if (this._geometryBufferRenderer) {
                effect.setTexture("depthSampler", this._geometryBufferRenderer.getGBuffer().textures[0]);
            } else if (this._prePassRenderer) {
                effect.setTexture("depthSampler", this._prePassRenderer.getRenderTarget().textures[this._prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE)]);
            }
        };

        blurFilter.samples = this.textureSamples;
        return blurFilter;
    }

    private _bits = new Uint32Array(1);

    //Van der Corput radical inverse
    private _radicalInverse_VdC(i: number) {
        this._bits[0] = i;
        this._bits[0] = ((this._bits[0] << 16) | (this._bits[0] >> 16)) >>> 0;
        this._bits[0] = ((this._bits[0] & 0x55555555) << 1) | (((this._bits[0] & 0xaaaaaaaa) >>> 1) >>> 0);
        this._bits[0] = ((this._bits[0] & 0x33333333) << 2) | (((this._bits[0] & 0xcccccccc) >>> 2) >>> 0);
        this._bits[0] = ((this._bits[0] & 0x0f0f0f0f) << 4) | (((this._bits[0] & 0xf0f0f0f0) >>> 4) >>> 0);
        this._bits[0] = ((this._bits[0] & 0x00ff00ff) << 8) | (((this._bits[0] & 0xff00ff00) >>> 8) >>> 0);
        return this._bits[0] * 2.3283064365386963e-10; // / 0x100000000 or / 4294967296
    }

    private _hammersley(i: number, n: number) {
        return [i / n, this._radicalInverse_VdC(i)];
    }

    private _hemisphereSample_uniform(u: number, v: number): Vector3 {
        const phi = v * 2.0 * Math.PI;
        // rejecting samples that are close to tangent plane to avoid z-fighting artifacts
        const cosTheta = 1.0 - u * 0.85;
        const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);
        return new Vector3(Math.cos(phi) * sinTheta, Math.sin(phi) * sinTheta, cosTheta);
    }

    private _generateHemisphere(): number[] {
        const numSamples = this.samples;
        const result = [];
        let vector;

        let i = 0;
        while (i < numSamples) {
            if (numSamples < 16) {
                vector = this._hemisphereSample_uniform(Math.random(), Math.random());
            } else {
                const rand = this._hammersley(i, numSamples);
                vector = this._hemisphereSample_uniform(rand[0], rand[1]);
            }

            result.push(vector.x, vector.y, vector.z);
            i++;
        }

        return result;
    }

    private _getDefinesForSSAO() {
        const defines = `#define SSAO\n#define SAMPLES ${this.samples}\n#define EPSILON ${this.epsilon.toFixed(4)}`;

        return defines;
    }

    private static readonly ORTHO_DEPTH_PROJECTION = [1, 0, 0, 0, 1, 0, 0, 0, 1];

    private static readonly PERSPECTIVE_DEPTH_PROJECTION = [0, 0, 0, 0, 0, 0, 1, 1, 1];

    private _createSSAOPostProcess(ratio: number, textureType: number): void {
        this._sampleSphere = this._generateHemisphere();

        const defines = this._getDefinesForSSAO();
        const samplers = ["randomSampler", "depthSampler", "normalSampler"];

        this._ssaoPostProcess = new PostProcess(
            "ssao2",
            "ssao2",
            [
                "sampleSphere",
                "samplesFactor",
                "randTextureTiles",
                "totalStrength",
                "radius",
                "base",
                "range",
                "projection",
                "near",
                "texelSize",
                "xViewport",
                "yViewport",
                "maxZ",
                "minZAspect",
                "depthProjection",
            ],
            samplers,
            ratio,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            this._scene.getEngine(),
            false,
            defines,
            textureType
        );

        this._ssaoPostProcess.onApply = (effect: Effect) => {
            if (!this._scene.activeCamera) {
                return;
            }

            effect.setArray3("sampleSphere", this._sampleSphere);
            effect.setFloat("randTextureTiles", 32.0);
            effect.setFloat("samplesFactor", 1 / this.samples);
            effect.setFloat("totalStrength", this.totalStrength);
            effect.setFloat2("texelSize", 1 / this._ssaoPostProcess.width, 1 / this._ssaoPostProcess.height);
            effect.setFloat("radius", this.radius);
            effect.setFloat("maxZ", this.maxZ);
            effect.setFloat("minZAspect", this.minZAspect);
            effect.setFloat("base", this.base);
            effect.setFloat("near", this._scene.activeCamera.minZ);
            if (this._scene.activeCamera.mode === Camera.PERSPECTIVE_CAMERA) {
                effect.setMatrix3x3("depthProjection", SSAO2RenderingPipeline.PERSPECTIVE_DEPTH_PROJECTION);
                effect.setFloat("xViewport", Math.tan(this._scene.activeCamera.fov / 2) * this._scene.getEngine().getAspectRatio(this._scene.activeCamera, true));
                effect.setFloat("yViewport", Math.tan(this._scene.activeCamera.fov / 2));
            } else {
                const halfWidth = this._scene.getEngine().getRenderWidth() / 2.0;
                const halfHeight = this._scene.getEngine().getRenderHeight() / 2.0;
                const orthoLeft = this._scene.activeCamera.orthoLeft ?? -halfWidth;
                const orthoRight = this._scene.activeCamera.orthoRight ?? halfWidth;
                const orthoBottom = this._scene.activeCamera.orthoBottom ?? -halfHeight;
                const orthoTop = this._scene.activeCamera.orthoTop ?? halfHeight;
                effect.setMatrix3x3("depthProjection", SSAO2RenderingPipeline.ORTHO_DEPTH_PROJECTION);
                effect.setFloat("xViewport", (orthoRight - orthoLeft) * 0.5);
                effect.setFloat("yViewport", (orthoTop - orthoBottom) * 0.5);
            }
            effect.setMatrix("projection", this._scene.getProjectionMatrix());

            if (this._geometryBufferRenderer) {
                effect.setTexture("depthSampler", this._geometryBufferRenderer.getGBuffer().textures[0]);
                effect.setTexture("normalSampler", this._geometryBufferRenderer.getGBuffer().textures[1]);
            } else if (this._prePassRenderer) {
                effect.setTexture("depthSampler", this._prePassRenderer.getRenderTarget().textures[this._prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE)]);
                effect.setTexture("normalSampler", this._prePassRenderer.getRenderTarget().textures[this._prePassRenderer.getIndex(Constants.PREPASS_NORMAL_TEXTURE_TYPE)]);
            }
            effect.setTexture("randomSampler", this._randomTexture);
        };
        this._ssaoPostProcess.samples = this.textureSamples;

        if (!this._forceGeometryBuffer) {
            this._ssaoPostProcess._prePassEffectConfiguration = new SSAO2Configuration();
        }
    }

    private _createSSAOCombinePostProcess(ratio: number, textureType: number): void {
        this._ssaoCombinePostProcess = new PostProcess(
            "ssaoCombine",
            "ssaoCombine",
            [],
            ["originalColor", "viewport"],
            ratio,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            this._scene.getEngine(),
            false,
            undefined,
            textureType
        );

        this._ssaoCombinePostProcess.onApply = (effect: Effect) => {
            const viewport = this._scene.activeCamera!.viewport;
            effect.setVector4("viewport", TmpVectors.Vector4[0].copyFromFloats(viewport.x, viewport.y, viewport.width, viewport.height));
            effect.setTextureFromPostProcessOutput("originalColor", this._originalColorPostProcess);
        };
        this._ssaoCombinePostProcess.samples = this.textureSamples;
    }

    private _createRandomTexture(): void {
        const size = 128;

        const data = new Uint8Array(size * size * 4);
        const randVector = Vector2.Zero();
        for (let index = 0; index < data.length; ) {
            randVector.set(Scalar.RandomRange(0, 1), Scalar.RandomRange(0, 1)).normalize().scaleInPlace(255);
            data[index++] = Math.floor(randVector.x);
            data[index++] = Math.floor(randVector.y);
            data[index++] = 0;
            data[index++] = 255;
        }

        const texture = RawTexture.CreateRGBATexture(data, size, size, this._scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
        texture.name = "SSAORandomTexture";
        texture.wrapU = Texture.WRAP_ADDRESSMODE;
        texture.wrapV = Texture.WRAP_ADDRESSMODE;
        this._randomTexture = texture;
    }

    /**
     * Serialize the rendering pipeline (Used when exporting)
     * @returns the serialized object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "SSAO2RenderingPipeline";

        return serializationObject;
    }

    /**
     * Parse the serialized pipeline
     * @param source Source pipeline.
     * @param scene The scene to load the pipeline to.
     * @param rootUrl The URL of the serialized pipeline.
     * @returns An instantiated pipeline from the serialized object.
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): SSAO2RenderingPipeline {
        return SerializationHelper.Parse(
            () => new SSAO2RenderingPipeline(source._name, scene, source._ratio, undefined, source._forceGeometryBuffer, source._textureType),
            source,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.SSAO2RenderingPipeline", SSAO2RenderingPipeline);
