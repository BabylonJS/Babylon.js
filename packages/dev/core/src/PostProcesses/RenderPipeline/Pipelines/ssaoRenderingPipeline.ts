/* eslint-disable @typescript-eslint/naming-convention */
import { Vector2, TmpVectors } from "../../../Maths/math.vector";
import type { Camera } from "../../../Cameras/camera";
import type { Effect } from "../../../Materials/effect";
import { Texture } from "../../../Materials/Textures/texture";
import { PostProcess } from "../../../PostProcesses/postProcess";
import { PostProcessRenderPipeline } from "../../../PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { PostProcessRenderEffect } from "../../../PostProcesses/RenderPipeline/postProcessRenderEffect";
import { PassPostProcess } from "../../../PostProcesses/passPostProcess";
import { BlurPostProcess } from "../../../PostProcesses/blurPostProcess";
import { Constants } from "../../../Engines/constants";
import { serialize } from "../../../Misc/decorators";
import type { Scene } from "../../../scene";
import { RawTexture } from "../../../Materials/Textures/rawTexture";
import { Scalar } from "../../../Maths/math.scalar";

import "../../../PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";

import "../../../Shaders/ssao.fragment";
import "../../../Shaders/ssaoCombine.fragment";

/**
 * Render pipeline to produce ssao effect
 */
export class SSAORenderingPipeline extends PostProcessRenderPipeline {
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
     * The radius around the analyzed pixel used by the SSAO post-process. Default value is 0.0006
     */
    @serialize()
    public radius: number = 0.0001;

    /**
     * Related to fallOff, used to interpolate SSAO samples (first interpolate function input) based on the occlusion difference of each pixel
     * Must not be equal to fallOff and superior to fallOff.
     * Default value is 0.0075
     */
    @serialize()
    public area: number = 0.0075;

    /**
     * Related to area, used to interpolate SSAO samples (second interpolate function input) based on the occlusion difference of each pixel
     * Must not be equal to area and inferior to area.
     * Default value is 0.000001
     */
    @serialize()
    public fallOff: number = 0.000001;

    /**
     * The base color of the SSAO post-process
     * The final result is "base + ssao" between [0, 1]
     */
    @serialize()
    public base: number = 0.5;

    private _scene: Scene;
    private _randomTexture: Texture;

    private _originalColorPostProcess: PassPostProcess;
    private _ssaoPostProcess: PostProcess;
    private _blurHPostProcess: BlurPostProcess;
    private _blurVPostProcess: BlurPostProcess;
    private _ssaoCombinePostProcess: PostProcess;

    private _firstUpdate: boolean = true;

    /**
     * Gets active scene
     */
    public get scene(): Scene {
        return this._scene;
    }

    /**
     * @constructor
     * @param name - The rendering pipeline name
     * @param scene - The scene linked to this pipeline
     * @param ratio - The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, combineRatio: 1.0 }
     * @param cameras - The array of cameras that the rendering pipeline will be attached to
     */
    constructor(name: string, scene: Scene, ratio: any, cameras?: Camera[]) {
        super(scene.getEngine(), name);

        this._scene = scene;

        // Set up assets
        this._createRandomTexture();

        const ssaoRatio = ratio.ssaoRatio || ratio;
        const combineRatio = ratio.combineRatio || ratio;

        this._originalColorPostProcess = new PassPostProcess("SSAOOriginalSceneColor", combineRatio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
        this._createSSAOPostProcess(ssaoRatio);
        this._createBlurPostProcess(ssaoRatio);
        this._createSSAOCombinePostProcess(combineRatio);

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

    /**
     * @internal
     */
    public _attachCameras(cameras: any, unique: boolean): void {
        super._attachCameras(cameras, unique);

        for (const camera of this._cameras) {
            this._scene.enableDepthRenderer(camera).getDepthMap(); // Force depth renderer "on"
        }
    }

    // Public Methods

    /**
     * Get the class name
     * @returns "SSAORenderingPipeline"
     */
    public getClassName(): string {
        return "SSAORenderingPipeline";
    }

    /**
     * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
     * @param disableDepthRender - If the depth renderer should be disabled on the scene
     */
    public dispose(disableDepthRender: boolean = false): void {
        for (let i = 0; i < this._scene.cameras.length; i++) {
            const camera = this._scene.cameras[i];

            this._originalColorPostProcess.dispose(camera);
            this._ssaoPostProcess.dispose(camera);
            this._blurHPostProcess.dispose(camera);
            this._blurVPostProcess.dispose(camera);
            this._ssaoCombinePostProcess.dispose(camera);
        }

        this._randomTexture.dispose();

        if (disableDepthRender) {
            this._scene.disableDepthRenderer();
        }

        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);

        super.dispose();
    }

    // Private Methods
    private _createBlurPostProcess(ratio: number): void {
        const size = 16;

        this._blurHPostProcess = new BlurPostProcess(
            "BlurH",
            new Vector2(1, 0),
            size,
            ratio,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            this._scene.getEngine(),
            false,
            Constants.TEXTURETYPE_UNSIGNED_INT
        );
        this._blurVPostProcess = new BlurPostProcess(
            "BlurV",
            new Vector2(0, 1),
            size,
            ratio,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            this._scene.getEngine(),
            false,
            Constants.TEXTURETYPE_UNSIGNED_INT
        );

        this._blurHPostProcess.onActivateObservable.add(() => {
            const dw = this._blurHPostProcess.width / this._scene.getEngine().getRenderWidth();
            this._blurHPostProcess.kernel = size * dw;
        });

        this._blurVPostProcess.onActivateObservable.add(() => {
            const dw = this._blurVPostProcess.height / this._scene.getEngine().getRenderHeight();
            this._blurVPostProcess.kernel = size * dw;
        });
    }

    /** @internal */
    public _rebuild() {
        this._firstUpdate = true;
        super._rebuild();
    }

    private _createSSAOPostProcess(ratio: number): void {
        const numSamples = 16;
        const sampleSphere = [
            0.5381, 0.1856, -0.4319, 0.1379, 0.2486, 0.443, 0.3371, 0.5679, -0.0057, -0.6999, -0.0451, -0.0019, 0.0689, -0.1598, -0.8547, 0.056, 0.0069, -0.1843, -0.0146, 0.1402,
            0.0762, 0.01, -0.1924, -0.0344, -0.3577, -0.5301, -0.4358, -0.3169, 0.1063, 0.0158, 0.0103, -0.5869, 0.0046, -0.0897, -0.494, 0.3287, 0.7119, -0.0154, -0.0918, -0.0533,
            0.0596, -0.5411, 0.0352, -0.0631, 0.546, -0.4776, 0.2847, -0.0271,
        ];
        const samplesFactor = 1.0 / numSamples;

        this._ssaoPostProcess = new PostProcess(
            "ssao",
            "ssao",
            ["sampleSphere", "samplesFactor", "randTextureTiles", "totalStrength", "radius", "area", "fallOff", "base", "range", "viewport"],
            ["randomSampler"],
            ratio,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            this._scene.getEngine(),
            false,
            "#define SAMPLES " + numSamples + "\n#define SSAO"
        );

        this._ssaoPostProcess.externalTextureSamplerBinding = true;
        this._ssaoPostProcess.onApply = (effect: Effect) => {
            if (this._firstUpdate) {
                effect.setArray3("sampleSphere", sampleSphere);
                effect.setFloat("samplesFactor", samplesFactor);
                effect.setFloat("randTextureTiles", 4.0);
            }

            effect.setFloat("totalStrength", this.totalStrength);
            effect.setFloat("radius", this.radius);
            effect.setFloat("area", this.area);
            effect.setFloat("fallOff", this.fallOff);
            effect.setFloat("base", this.base);

            effect.setTexture("textureSampler", this._scene.enableDepthRenderer(this._scene.activeCamera).getDepthMap());
            effect.setTexture("randomSampler", this._randomTexture);
        };
    }

    private _createSSAOCombinePostProcess(ratio: number): void {
        this._ssaoCombinePostProcess = new PostProcess(
            "ssaoCombine",
            "ssaoCombine",
            [],
            ["originalColor", "viewport"],
            ratio,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            this._scene.getEngine(),
            false
        );

        this._ssaoCombinePostProcess.onApply = (effect: Effect) => {
            effect.setVector4("viewport", TmpVectors.Vector4[0].copyFromFloats(0, 0, 1.0, 1.0));
            effect.setTextureFromPostProcess("originalColor", this._originalColorPostProcess);
        };
    }

    private _createRandomTexture(): void {
        const size = 512;

        const data = new Uint8Array(size * size * 4);
        for (let index = 0; index < data.length; ) {
            data[index++] = Math.floor(Math.max(0.0, Scalar.RandomRange(-1.0, 1.0)) * 255);
            data[index++] = Math.floor(Math.max(0.0, Scalar.RandomRange(-1.0, 1.0)) * 255);
            data[index++] = Math.floor(Math.max(0.0, Scalar.RandomRange(-1.0, 1.0)) * 255);
            data[index++] = 255;
        }

        const texture = RawTexture.CreateRGBATexture(data, size, size, this._scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
        texture.name = "SSAORandomTexture";
        texture.wrapU = Texture.WRAP_ADDRESSMODE;
        texture.wrapV = Texture.WRAP_ADDRESSMODE;
        this._randomTexture = texture;
    }
}
