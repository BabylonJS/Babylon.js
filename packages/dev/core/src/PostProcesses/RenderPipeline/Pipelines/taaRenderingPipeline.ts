/* eslint-disable @typescript-eslint/naming-convention */
import { serialize } from "../../../Misc/decorators";
import { SerializationHelper } from "../../../Misc/decorators.serialization";
import type { Camera } from "../../../Cameras/camera";
import type { Effect } from "../../../Materials/effect";
import { PostProcess } from "../../postProcess";
import { PostProcessRenderPipeline } from "../postProcessRenderPipeline";
import { PostProcessRenderEffect } from "../postProcessRenderEffect";
import type { Scene } from "../../../scene";
import { RegisterClass } from "../../../Misc/typeStore";
import { Constants } from "../../../Engines/constants";
import type { Nullable } from "../../../types";
import { PassPostProcess } from "core/PostProcesses/passPostProcess";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { ThinTAAPostProcess } from "core/PostProcesses/thinTAAPostProcess";
import type { PrePassEffectConfiguration } from "core/Rendering/prePassEffectConfiguration";
import { Logger } from "core/Misc/logger";

import "../postProcessRenderPipelineManagerSceneComponent";

class TAAEffectConfiguration implements PrePassEffectConfiguration {
    public name = "taa";
    public enabled = true;
    public readonly texturesRequired = [Constants.PREPASS_VELOCITY_LINEAR_TEXTURE_TYPE];
}

/**
 * Simple implementation of Temporal Anti-Aliasing (TAA).
 * This can be used to improve image quality for still pictures (screenshots for e.g.).
 * Note that TAA post-process must be the first in the camera, so TAARenderingPipeline must be created before any other pipeline/post-processing.
 */
export class TAARenderingPipeline extends PostProcessRenderPipeline {
    /**
     * The TAA PostProcess effect id in the pipeline
     */
    public TAARenderEffect: string = "TAARenderEffect";
    /**
     * The pass PostProcess effect id in the pipeline
     */
    public TAAPassEffect: string = "TAAPassEffect";

    /**
     * Number of accumulated samples (default: 16)
     */
    @serialize("samples")
    public set samples(samples: number) {
        this._taaThinPostProcess.samples = samples;
    }

    public get samples(): number {
        return this._taaThinPostProcess.samples;
    }

    @serialize("msaaSamples")
    private _msaaSamples = 1;
    /**
     * MSAA samples (default: 1)
     */
    public set msaaSamples(samples: number) {
        if (this._msaaSamples === samples) {
            return;
        }

        this._msaaSamples = samples;
        if (this._taaPostProcess) {
            this._taaPostProcess.samples = samples;
        }
    }

    public get msaaSamples(): number {
        return this._msaaSamples;
    }

    /**
     * The factor used to blend the history frame with current frame (default: 0.05)
     */
    @serialize()
    public get factor() {
        return this._taaThinPostProcess.factor;
    }

    public set factor(value: number) {
        this._taaThinPostProcess.factor = value;
    }

    /**
     * Disable TAA on camera move (default: true).
     * You generally want to keep this enabled, otherwise you will get a ghost effect when the camera moves (but if it's what you want, go for it!)
     */
    @serialize()
    public get disableOnCameraMove() {
        return this._taaThinPostProcess.disableOnCameraMove;
    }

    public set disableOnCameraMove(value: boolean) {
        this._taaThinPostProcess.disableOnCameraMove = value;
    }

    /**
     * Enables reprojecting the history texture with a per-pixel velocity.
     */
    @serialize()
    public get reprojectHistory(): boolean {
        return this._taaThinPostProcess.reprojectHistory;
    }

    public set reprojectHistory(reproject: boolean) {
        if (this.reprojectHistory === reproject) {
            return;
        }
        this._updateReprojection(reproject);
    }

    /**
     * Clamps the history pixel to the min and max of the 3x3 pixels surrounding the target pixel.
     * This can help further reduce ghosting and artifacts.
     */
    @serialize()
    public get clampHistory(): boolean {
        return this._taaThinPostProcess.clampHistory;
    }

    public set clampHistory(history: boolean) {
        this._taaThinPostProcess.clampHistory = history;
    }

    @serialize("isEnabled")
    private _isEnabled = true;
    /**
     * Gets or sets a boolean indicating if the render pipeline is enabled (default: true).
     */
    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    public set isEnabled(value: boolean) {
        if (this._isEnabled === value) {
            return;
        }

        this._isEnabled = value;

        this._taaThinPostProcess.disabled = !value;

        if (!value) {
            if (this._cameras !== null) {
                this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
                this._cameras = this._camerasToBeAttached.slice();
            }
        } else if (value) {
            if (!this._isDirty) {
                if (this._cameras !== null) {
                    this._taaThinPostProcess._reset();
                    this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
                }
            } else {
                this._buildPipeline();
            }
        }
    }

    /**
     * Gets active scene
     */
    public get scene(): Scene {
        return this._scene;
    }

    private _scene: Scene;
    private _isDirty = false;
    private _camerasToBeAttached: Array<Camera> = [];
    private _textureType: number;
    private _taaPostProcess: Nullable<PostProcess>;
    private _taaThinPostProcess: ThinTAAPostProcess;
    private _passPostProcess: Nullable<PassPostProcess>;
    private _ping: RenderTargetWrapper;
    private _pong: RenderTargetWrapper;
    private _pingpong = 0;

    /**
     * Returns true if TAA is supported by the running hardware
     */
    public override get isSupported(): boolean {
        const caps = this._scene.getEngine().getCaps();

        return caps.texelFetch;
    }

    /**
     * Constructor of the TAA rendering pipeline
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     * @param cameras The array of cameras that the rendering pipeline will be attached to (default: scene.cameras)
     * @param textureType The type of texture where the scene will be rendered (default: Constants.TEXTURETYPE_UNSIGNED_BYTE)
     */
    constructor(name: string, scene: Scene, cameras?: Camera[], textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE) {
        const engine = scene.getEngine();

        super(engine, name);

        this._cameras = cameras || scene.cameras;
        this._cameras = this._cameras.slice();
        this._camerasToBeAttached = this._cameras.slice();

        this._scene = scene;
        this._textureType = textureType;
        this._taaThinPostProcess = new ThinTAAPostProcess("TAA", this._scene);

        if (this.isSupported) {
            this._createPingPongTextures(engine.getRenderWidth(), engine.getRenderHeight());

            scene.postProcessRenderPipelineManager.addPipeline(this);

            this._buildPipeline();
        }
    }

    /**
     * Get the class name
     * @returns "TAARenderingPipeline"
     */
    public override getClassName(): string {
        return "TAARenderingPipeline";
    }

    /**
     * Adds a camera to the pipeline
     * @param camera the camera to be added
     */
    public addCamera(camera: Camera): void {
        this._camerasToBeAttached.push(camera);
        this._buildPipeline();
    }

    /**
     * Removes a camera from the pipeline
     * @param camera the camera to remove
     */
    public removeCamera(camera: Camera): void {
        const index = this._camerasToBeAttached.indexOf(camera);
        this._camerasToBeAttached.splice(index, 1);
        this._buildPipeline();
    }

    /**
     * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
     */
    public override dispose(): void {
        this._disposePostProcesses();

        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);

        this._scene.postProcessRenderPipelineManager.removePipeline(this._name);

        this._ping.dispose();
        this._pong.dispose();

        super.dispose();
    }

    private _createPingPongTextures(width: number, height: number) {
        const engine = this._scene.getEngine();

        this._ping?.dispose();
        this._pong?.dispose();

        this._ping = engine.createRenderTargetTexture(
            { width, height },
            { generateMipMaps: false, generateDepthBuffer: false, type: Constants.TEXTURETYPE_HALF_FLOAT, samplingMode: Constants.TEXTURE_LINEAR_LINEAR }
        );

        this._pong = engine.createRenderTargetTexture(
            { width, height },
            { generateMipMaps: false, generateDepthBuffer: false, type: Constants.TEXTURETYPE_HALF_FLOAT, samplingMode: Constants.TEXTURE_LINEAR_LINEAR }
        );

        this._taaThinPostProcess.textureWidth = width;
        this._taaThinPostProcess.textureHeight = height;
    }

    private _updateReprojection(reproject: boolean) {
        if (reproject) {
            if (!this._scene.enablePrePassRenderer()) {
                Logger.Warn("TAA reprojection requires PrePass which is not supported");
                return;
            }
        }

        this._taaThinPostProcess.reprojectHistory = reproject;

        this._buildPipeline();
    }

    private _buildPipeline() {
        if (!this.isSupported) {
            return;
        }

        if (!this._isEnabled) {
            this._isDirty = true;
            return;
        }

        this._isDirty = false;

        const engine = this._scene.getEngine();

        this._disposePostProcesses();
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
            // get back cameras to be used to reattach pipeline
            this._cameras = this._camerasToBeAttached.slice();
        }
        this._reset();

        this._createTAAPostProcess();
        this.addEffect(
            new PostProcessRenderEffect(
                engine,
                this.TAARenderEffect,
                () => {
                    return this._taaPostProcess;
                },
                true
            )
        );

        this._createPassPostProcess();
        this.addEffect(
            new PostProcessRenderEffect(
                engine,
                this.TAAPassEffect,
                () => {
                    return this._passPostProcess;
                },
                true
            )
        );

        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
        }
    }

    private _disposePostProcesses(): void {
        for (let i = 0; i < this._cameras.length; i++) {
            const camera = this._cameras[i];

            this._taaPostProcess?.dispose(camera);
            this._passPostProcess?.dispose(camera);

            camera.getProjectionMatrix(true); // recompute the projection matrix
        }

        this._taaPostProcess = null;
        this._passPostProcess = null;
    }

    private _createTAAPostProcess(): void {
        this._taaPostProcess = new PostProcess("TAA", "taa", {
            uniforms: ["factor"],
            samplers: ["historySampler"],
            size: 1.0,
            engine: this._scene.getEngine(),
            textureType: this._textureType,
            effectWrapper: this._taaThinPostProcess,
        });

        if (this.reprojectHistory) {
            this._taaPostProcess._prePassEffectConfiguration = new TAAEffectConfiguration();
        }

        this._taaPostProcess.samples = this._msaaSamples;

        this._taaPostProcess.onActivateObservable.add(() => {
            this._taaThinPostProcess.camera = this._scene.activeCamera;

            if (this._taaPostProcess?.width !== this._ping.width || this._taaPostProcess?.height !== this._ping.height) {
                const engine = this._scene.getEngine();
                this._createPingPongTextures(engine.getRenderWidth(), engine.getRenderHeight());
            }

            this._taaThinPostProcess._updateJitter();

            if (!this.reprojectHistory) {
                this._scene.updateTransformMatrix(); // make sure the scene ubo is updated with the updated matrices
            }

            if (this._passPostProcess) {
                this._passPostProcess.inputTexture = this._pingpong ? this._ping : this._pong;
            }
            this._pingpong = this._pingpong ^ 1;
        });

        this._taaPostProcess.onApplyObservable.add((effect: Effect) => {
            effect._bindTexture("historySampler", this._pingpong ? this._ping.texture : this._pong.texture);

            const prePassRenderer = this._scene.prePassRenderer;
            if (this.reprojectHistory && prePassRenderer) {
                const renderTarget = prePassRenderer.getRenderTarget();
                const velocityIndex = prePassRenderer.getIndex(Constants.PREPASS_VELOCITY_LINEAR_TEXTURE_TYPE);
                effect.setTexture("velocitySampler", renderTarget.textures[velocityIndex]);
            }
        });
    }

    private _createPassPostProcess() {
        const engine = this._scene.getEngine();

        this._passPostProcess = new PassPostProcess("TAAPass", 1, null, Constants.TEXTURE_NEAREST_NEAREST, engine);
        this._passPostProcess.inputTexture = this._ping;
        this._passPostProcess.autoClear = false;
    }

    /**
     * Serializes the rendering pipeline (Used when exporting)
     * @returns the serialized object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "TAARenderingPipeline";

        return serializationObject;
    }

    /**
     * Parse the serialized pipeline
     * @param source Source pipeline.
     * @param scene The scene to load the pipeline to.
     * @param rootUrl The URL of the serialized pipeline.
     * @returns An instantiated pipeline from the serialized object.
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): TAARenderingPipeline {
        return SerializationHelper.Parse(() => new TAARenderingPipeline(source._name, scene, source._ratio), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.TAARenderingPipeline", TAARenderingPipeline);
