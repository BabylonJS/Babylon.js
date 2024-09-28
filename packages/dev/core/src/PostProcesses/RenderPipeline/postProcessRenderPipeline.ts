import type { Nullable } from "../../types";
import { Tools } from "../../Misc/tools";
import { serialize } from "../../Misc/decorators";
import type { Camera } from "../../Cameras/camera";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { PostProcessRenderEffect } from "./postProcessRenderEffect";
import type { IInspectable } from "../../Misc/iInspectable";

import type { PrePassRenderer } from "../../Rendering/prePassRenderer";

/**
 * PostProcessRenderPipeline
 * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/postProcessRenderPipeline
 */
export class PostProcessRenderPipeline {
    protected _renderEffects: { [key: string]: PostProcessRenderEffect };
    protected _renderEffectsForIsolatedPass: PostProcessRenderEffect[];

    /**
     * List of inspectable custom properties (used by the Inspector)
     * @see https://doc.babylonjs.com/toolsAndResources/inspector#extensibility
     */
    public inspectableCustomProperties: IInspectable[];

    /**
     * @internal
     */
    protected _cameras: Camera[];

    /** @internal */
    @serialize()
    public _name: string;

    /**
     * Gets pipeline name
     */
    public get name(): string {
        return this._name;
    }

    /** Gets the list of attached cameras */
    public get cameras() {
        return this._cameras;
    }

    /**
     * Gets the active engine
     */
    public get engine(): AbstractEngine {
        return this._engine;
    }

    /**
     * Initializes a PostProcessRenderPipeline
     * @param _engine engine to add the pipeline to
     * @param name name of the pipeline
     */
    constructor(
        private _engine: AbstractEngine,
        name: string
    ) {
        this._name = name;

        this._renderEffects = {};
        this._renderEffectsForIsolatedPass = new Array<PostProcessRenderEffect>();

        this._cameras = [];
    }

    /**
     * Gets the class name
     * @returns "PostProcessRenderPipeline"
     */
    public getClassName(): string {
        return "PostProcessRenderPipeline";
    }

    /**
     * If all the render effects in the pipeline are supported
     */
    public get isSupported(): boolean {
        for (const renderEffectName in this._renderEffects) {
            if (Object.prototype.hasOwnProperty.call(this._renderEffects, renderEffectName)) {
                if (!this._renderEffects[renderEffectName].isSupported) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Adds an effect to the pipeline
     * @param renderEffect the effect to add
     */
    public addEffect(renderEffect: PostProcessRenderEffect): void {
        (<any>this._renderEffects)[renderEffect._name] = renderEffect;
    }

    // private

    /** @internal */
    public _rebuild() {}

    /** @internal */
    public _enableEffect(renderEffectName: string, cameras: Camera): void;
    /** @internal */
    public _enableEffect(renderEffectName: string, cameras: Camera[]): void;
    /**
     * @internal
     */
    public _enableEffect(renderEffectName: string, cameras: any): void {
        const renderEffects: PostProcessRenderEffect = (<any>this._renderEffects)[renderEffectName];

        if (!renderEffects) {
            return;
        }

        renderEffects._enable(Tools.MakeArray(cameras || this._cameras));
    }

    /** @internal */
    public _disableEffect(renderEffectName: string, cameras: Nullable<Camera[]>): void;
    /** @internal */
    public _disableEffect(renderEffectName: string, cameras: Nullable<Camera[]>): void;
    /**
     * @internal
     */
    public _disableEffect(renderEffectName: string, cameras: Nullable<Camera[]>): void {
        const renderEffects: PostProcessRenderEffect = (<any>this._renderEffects)[renderEffectName];

        if (!renderEffects) {
            return;
        }

        renderEffects._disable(Tools.MakeArray(cameras || this._cameras));
    }

    /** @internal */
    public _attachCameras(cameras: Camera, unique: boolean): void;
    /** @internal */
    public _attachCameras(cameras: Camera[], unique: boolean): void;
    /**
     * @internal
     */
    public _attachCameras(cameras: any, unique: boolean): void {
        const cams = Tools.MakeArray(cameras || this._cameras);

        if (!cams) {
            return;
        }

        const indicesToDelete = [];
        let i: number;
        for (i = 0; i < cams.length; i++) {
            const camera = cams[i];
            if (!camera) {
                continue;
            }

            if (this._cameras.indexOf(camera) === -1) {
                this._cameras.push(camera);
            } else if (unique) {
                indicesToDelete.push(i);
            }
        }

        for (i = 0; i < indicesToDelete.length; i++) {
            cams.splice(indicesToDelete[i], 1);
        }

        for (const renderEffectName in this._renderEffects) {
            if (Object.prototype.hasOwnProperty.call(this._renderEffects, renderEffectName)) {
                this._renderEffects[renderEffectName]._attachCameras(cams);
            }
        }
    }

    /** @internal */
    public _detachCameras(cameras: Camera): void;
    /** @internal */
    public _detachCameras(cameras: Nullable<Camera[]>): void;
    /**
     * @internal
     */
    public _detachCameras(cameras: any): void {
        const cams = Tools.MakeArray(cameras || this._cameras);

        if (!cams) {
            return;
        }

        for (const renderEffectName in this._renderEffects) {
            if (Object.prototype.hasOwnProperty.call(this._renderEffects, renderEffectName)) {
                this._renderEffects[renderEffectName]._detachCameras(cams);
            }
        }

        for (let i = 0; i < cams.length; i++) {
            this._cameras.splice(this._cameras.indexOf(cams[i]), 1);
        }
    }

    /** @internal */
    public _update(): void {
        for (const renderEffectName in this._renderEffects) {
            if (Object.prototype.hasOwnProperty.call(this._renderEffects, renderEffectName)) {
                this._renderEffects[renderEffectName]._update();
            }
        }

        for (let i = 0; i < this._cameras.length; i++) {
            if (!this._cameras[i]) {
                continue;
            }
            const cameraName = this._cameras[i].name;
            if ((<any>this._renderEffectsForIsolatedPass)[cameraName]) {
                (<any>this._renderEffectsForIsolatedPass)[cameraName]._update();
            }
        }
    }

    /** @internal */
    public _reset(): void {
        this._renderEffects = {};
        this._renderEffectsForIsolatedPass = new Array<PostProcessRenderEffect>();
    }

    protected _enableMSAAOnFirstPostProcess(sampleCount: number): boolean {
        if (!this._engine._features.supportMSAA) {
            return false;
        }

        // Set samples of the very first post process to 4 to enable native anti-aliasing in browsers that support webGL 2.0 (See: https://github.com/BabylonJS/Babylon.js/issues/3754)
        const effectKeys = Object.keys(this._renderEffects);
        if (effectKeys.length > 0) {
            const postProcesses = this._renderEffects[effectKeys[0]].getPostProcesses();
            if (postProcesses) {
                postProcesses[0].samples = sampleCount;
            }
        }
        return true;
    }

    /**
     * Ensures that all post processes in the pipeline are the correct size according to the
     * the viewport's required size
     */
    protected _adaptPostProcessesToViewPort(): void {
        const effectKeys = Object.keys(this._renderEffects);
        for (const effectKey of effectKeys) {
            const postProcesses = this._renderEffects[effectKey].getPostProcesses();
            if (postProcesses) {
                for (const postProcess of postProcesses) {
                    postProcess.adaptScaleToCurrentViewport = true;
                }
            }
        }
    }

    /**
     * Sets the required values to the prepass renderer.
     * @param prePassRenderer defines the prepass renderer to setup.
     * @returns true if the pre pass is needed.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public setPrePassRenderer(prePassRenderer: PrePassRenderer): boolean {
        // Do Nothing by default
        return false;
    }

    /**
     * Disposes of the pipeline
     */
    public dispose() {
        // Must be implemented by children
    }
}
