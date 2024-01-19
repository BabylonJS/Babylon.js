import type { Nullable } from "../../types";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Constants } from "../../Engines/constants";
import { Matrix } from "../../Maths/math.vector";
import { Observable } from "../../Misc/observable";
import type { ExternalTexture } from "./externalTexture";

import "../../Engines/Extensions/engine.dynamicTexture";
import "../../Engines/Extensions/engine.videoTexture";
import "../../Engines/Extensions/engine.externalTexture";

import type { ThinEngine } from "../../Engines/thinEngine";
import type { Scene } from "../../scene";

/**
 * Defines the options related to the creation of an HtmlElementTexture
 */
export interface IHtmlElementTextureOptions {
    /**
     * Defines whether mip maps should be created or not.
     */
    generateMipMaps?: boolean;
    /**
     * Defines the sampling mode of the texture.
     */
    samplingMode?: number;
    /**
     * Defines the associated texture format.
     */
    format?: number;
    /**
     * Defines the engine instance to use the texture with. It is not mandatory if you define a scene.
     */
    engine: Nullable<ThinEngine>;
    /**
     * Defines the scene the texture belongs to. It is not mandatory if you define an engine.
     */
    scene: Nullable<Scene>;
}

/**
 * This represents the smallest workload to use an already existing element (Canvas or Video) as a texture.
 * To be as efficient as possible depending on your constraints nothing aside the first upload
 * is automatically managed.
 * It is a cheap VideoTexture or DynamicTexture if you prefer to keep full control of the elements
 * in your application.
 *
 * As the update is not automatic, you need to call them manually.
 */
export class HtmlElementTexture extends BaseTexture {
    /**
     * The texture URL.
     */
    public element: HTMLVideoElement | HTMLCanvasElement;

    /**
     * Observable triggered once the texture has been loaded.
     */
    public onLoadObservable: Observable<HtmlElementTexture> = new Observable<HtmlElementTexture>();

    private static readonly _DefaultOptions: IHtmlElementTextureOptions = {
        generateMipMaps: false,
        samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
        format: Constants.TEXTUREFORMAT_RGBA,
        engine: null,
        scene: null,
    };

    private readonly _format: number;
    private _textureMatrix: Matrix;
    private _isVideo: boolean;
    private _generateMipMaps: boolean;
    private _samplingMode: number;
    private _externalTexture: Nullable<ExternalTexture>;

    /**
     * Instantiates a HtmlElementTexture from the following parameters.
     *
     * @param name Defines the name of the texture
     * @param element Defines the video or canvas the texture is filled with
     * @param options Defines the other none mandatory texture creation options
     */
    constructor(name: string, element: HTMLVideoElement | HTMLCanvasElement, options: IHtmlElementTextureOptions) {
        super(options.scene || options.engine);

        if (!element || (!options.engine && !options.scene)) {
            return;
        }

        options = {
            ...HtmlElementTexture._DefaultOptions,
            ...options,
        };

        this._generateMipMaps = options.generateMipMaps!;
        this._samplingMode = options.samplingMode!;
        this._textureMatrix = Matrix.Identity();
        this._format = options.format!;

        this.name = name;
        this.element = element;
        this._isVideo = !!(element as HTMLVideoElement).getVideoPlaybackQuality;
        this._externalTexture = this._isVideo ? this._engine?.createExternalTexture(element as HTMLVideoElement) ?? null : null;

        this.anisotropicFilteringLevel = 1;

        this._createInternalTexture();
    }

    private _createInternalTexture(): void {
        let width = 0;
        let height = 0;
        if (this._isVideo) {
            width = (this.element as HTMLVideoElement).videoWidth;
            height = (this.element as HTMLVideoElement).videoHeight;
        } else {
            width = this.element.width;
            height = this.element.height;
        }

        const engine = this._getEngine();
        if (engine) {
            this._texture = engine.createDynamicTexture(width, height, this._generateMipMaps, this._samplingMode);
            this._texture.format = this._format;
        }

        this.update();
    }

    /**
     * @returns the texture matrix used in most of the material.
     */
    public getTextureMatrix(): Matrix {
        return this._textureMatrix;
    }

    /**
     * Updates the content of the texture.
     * @param invertY Defines whether the texture should be inverted on Y (false by default on video and true on canvas)
     */
    public update(invertY: Nullable<boolean> = null): void {
        const engine = this._getEngine();
        if (this._texture == null || engine == null) {
            return;
        }

        const wasReady = this.isReady();
        if (this._isVideo) {
            const videoElement = this.element as HTMLVideoElement;
            if (videoElement.readyState < videoElement.HAVE_CURRENT_DATA) {
                return;
            }

            engine.updateVideoTexture(this._texture, this._externalTexture ? this._externalTexture : videoElement, invertY === null ? true : invertY);
        } else {
            const canvasElement = this.element as HTMLCanvasElement;
            engine.updateDynamicTexture(this._texture, canvasElement, invertY === null ? true : invertY, false, this._format);
        }

        if (!wasReady && this.isReady()) {
            this.onLoadObservable.notifyObservers(this);
        }
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public dispose(): void {
        this.onLoadObservable.clear();
        super.dispose();
    }
}
