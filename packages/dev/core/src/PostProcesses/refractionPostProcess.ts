import type { Color3 } from "../Maths/math.color";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import { Texture } from "../Materials/Textures/texture";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { Engine } from "../Engines/engine";

import "../Shaders/refraction.fragment";
import { RegisterClass } from "../Misc/typeStore";
import { SerializationHelper, serialize } from "../Misc/decorators";
import type { Nullable } from "../types";

declare type Scene = import("../scene").Scene;

/**
 * Post process which applies a refraction texture
 * @see https://doc.babylonjs.com/how_to/how_to_use_postprocesses#refraction
 */
export class RefractionPostProcess extends PostProcess {
    private _refTexture: Texture;
    private _ownRefractionTexture = true;

    /** the base color of the refraction (used to taint the rendering) */
    @serialize()
    public color: Color3;

    /** simulated refraction depth */
    @serialize()
    public depth: number;

    /** the coefficient of the base color (0 to remove base color tainting) */
    @serialize()
    public colorLevel: number;

    /** Gets the url used to load the refraction texture */
    @serialize()
    public refractionTextureUrl: string;

    /**
     * Gets or sets the refraction texture
     * Please note that you are responsible for disposing the texture if you set it manually
     */
    public get refractionTexture(): Texture {
        return this._refTexture;
    }

    public set refractionTexture(value: Texture) {
        if (this._refTexture && this._ownRefractionTexture) {
            this._refTexture.dispose();
        }

        this._refTexture = value;
        this._ownRefractionTexture = false;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "RefractionPostProcess" string
     */
    public getClassName(): string {
        return "RefractionPostProcess";
    }

    /**
     * Initializes the RefractionPostProcess
     * @see https://doc.babylonjs.com/how_to/how_to_use_postprocesses#refraction
     * @param name The name of the effect.
     * @param refractionTextureUrl Url of the refraction texture to use
     * @param color the base color of the refraction (used to taint the rendering)
     * @param depth simulated refraction depth
     * @param colorLevel the coefficient of the base color (0 to remove base color tainting)
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(
        name: string,
        refractionTextureUrl: string,
        color: Color3,
        depth: number,
        colorLevel: number,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: Engine,
        reusable?: boolean
    ) {
        super(name, "refraction", ["baseColor", "depth", "colorLevel"], ["refractionSampler"], options, camera, samplingMode, engine, reusable);

        this.color = color;
        this.depth = depth;
        this.colorLevel = colorLevel;
        this.refractionTextureUrl = refractionTextureUrl;

        this.onActivateObservable.add((cam: Camera) => {
            this._refTexture = this._refTexture || new Texture(refractionTextureUrl, cam.getScene());
        });

        this.onApplyObservable.add((effect: Effect) => {
            effect.setColor3("baseColor", this.color);
            effect.setFloat("depth", this.depth);
            effect.setFloat("colorLevel", this.colorLevel);

            effect.setTexture("refractionSampler", this._refTexture);
        });
    }

    // Methods
    /**
     * Disposes of the post process
     * @param camera Camera to dispose post process on
     */
    public dispose(camera: Camera): void {
        if (this._refTexture && this._ownRefractionTexture) {
            this._refTexture.dispose();
            (<any>this._refTexture) = null;
        }

        super.dispose(camera);
    }

    /**
     * @internal
     */
    public static _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) {
        return SerializationHelper.Parse(
            () => {
                return new RefractionPostProcess(
                    parsedPostProcess.name,
                    parsedPostProcess.refractionTextureUrl,
                    parsedPostProcess.color,
                    parsedPostProcess.depth,
                    parsedPostProcess.colorLevel,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    scene.getEngine(),
                    parsedPostProcess.reusable
                );
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.RefractionPostProcess", RefractionPostProcess);
