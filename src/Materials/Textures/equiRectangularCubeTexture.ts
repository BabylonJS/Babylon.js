import { PanoramaToCubeMapTools } from '../../Misc/HighDynamicRange/panoramaToCubemap';
import { BaseTexture } from './baseTexture';
import { Texture } from './texture';
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { Tools } from '../../Misc/tools';
import "../../Engines/Extensions/engine.rawTexture";
import { Constants } from '../../Engines/constants';

/**
 * This represents a texture coming from an equirectangular image supported by the web browser canvas.
 */
export class EquiRectangularCubeTexture extends BaseTexture {
    /** The six faces of the cube. */
    private static _FacesMapping = ['right', 'left', 'up', 'down', 'front', 'back'];

    private _noMipmap: boolean;
    private _onLoad: Nullable<() => void> = null;
    private _onError: Nullable<() => void> = null;

    /** The size of the cubemap. */
    private _size: number;

    /** The buffer of the image. */
    private _buffer: ArrayBuffer;

    /** The width of the input image. */
    private _width: number;

    /** The height of the input image. */
    private _height: number;

    /** The URL to the image. */
    public url: string;

    /**
     * Instantiates an EquiRectangularCubeTexture from the following parameters.
     * @param url The location of the image
     * @param scene The scene the texture will be used in
     * @param size The cubemap desired size (the more it increases the longer the generation will be)
     * @param noMipmap Forces to not generate the mipmap if true
     * @param gammaSpace Specifies if the texture will be used in gamma or linear space
     * (the PBR material requires those textures in linear space, but the standard material would require them in Gamma space)
     * @param onLoad — defines a callback called when texture is loaded
     * @param onError — defines a callback called if there is an error
     */
    constructor(
        url: string,
        scene: Scene,
        size: number,
        noMipmap: boolean = false,
        gammaSpace: boolean = true,
        onLoad: Nullable<() => void> = null,
        onError: Nullable<(message?: string, exception?: any) => void> = null
    ) {
        super(scene);

        if (!url) {
            throw new Error('Image url is not set');
        }

        this._coordinatesMode = Texture.CUBIC_MODE;
        this.name = url;
        this.url = url;
        this._size = size;
        this._noMipmap = noMipmap;
        this.gammaSpace = gammaSpace;
        this._onLoad = onLoad;
        this._onError = onError;

        this.hasAlpha = false;
        this.isCube = true;

        this._texture = this._getFromCache(url, this._noMipmap);

        if (!this._texture) {
            if (!scene.useDelayedTextureLoading) {
                this.loadImage(this.loadTexture.bind(this), this._onError);
            } else {
                this.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;
            }
        } else if (onLoad) {
            if (this._texture.isReady) {
                Tools.SetImmediate(() => onLoad());
            } else {
                this._texture.onLoadedObservable.add(onLoad);
            }
        }
    }

    /**
     * Load the image data, by putting the image on a canvas and extracting its buffer.
     */
    private loadImage(loadTextureCallback: () => void, onError: Nullable<(message?: string, exception?: any) => void>): void {
        const canvas = document.createElement('canvas');
        const image = new Image();

        image.addEventListener('load', () => {
            this._width = image.width;
            this._height = image.height;
            canvas.width = this._width;
            canvas.height = this._height;

            const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
            ctx.drawImage(image, 0, 0);

            const imageData = ctx.getImageData(0, 0, image.width, image.height);
            this._buffer = imageData.data.buffer as ArrayBuffer;

            canvas.remove();
            loadTextureCallback();
        });
        image.addEventListener('error', (error) => {
            if (onError) {
                onError(`${this.getClassName()} could not be loaded`, error);
            }
        });
        image.src = this.url;
    }

    /**
     * Convert the image buffer into a cubemap and create a CubeTexture.
     */
    private loadTexture(): void {
        const scene = this.getScene();
        const callback = (): Nullable<ArrayBufferView[]> => {
            const imageData = this.getFloat32ArrayFromArrayBuffer(this._buffer);

            // Extract the raw linear data.
            const data = PanoramaToCubeMapTools.ConvertPanoramaToCubemap(imageData, this._width, this._height, this._size);

            const results = [];

            // Push each faces.
            for (let i = 0; i < 6; i++) {
                const dataFace = (data as any)[EquiRectangularCubeTexture._FacesMapping[i]];
                results.push(dataFace);
            }

            return results;
        };

        if (!scene) {
            return;
        }
        this._texture = scene
            .getEngine()
            .createRawCubeTextureFromUrl(
                this.url,
                scene,
                this._size,
                Constants.TEXTUREFORMAT_RGB,
                scene.getEngine().getCaps().textureFloat
                    ? Constants.TEXTURETYPE_FLOAT
                    : Constants.TEXTURETYPE_UNSIGNED_INTEGER,
                this._noMipmap,
                callback,
                null,
                this._onLoad,
                this._onError
            );
    }

    /**
     * Convert the ArrayBuffer into a Float32Array and drop the transparency channel.
     * @param buffer The ArrayBuffer that should be converted.
     * @returns The buffer as Float32Array.
     */
    private getFloat32ArrayFromArrayBuffer(buffer: ArrayBuffer): Float32Array {
        const dataView = new DataView(buffer);
        const floatImageData = new Float32Array((buffer.byteLength * 3) / 4);

        let k = 0;
        for (let i = 0; i < buffer.byteLength; i++) {
            // We drop the transparency channel, because we do not need/want it
            if ((i + 1) % 4 !== 0) {
                floatImageData[k++] = dataView.getUint8(i) / 255;
            }
        }

        return floatImageData;
    }

    /**
     * Get the current class name of the texture useful for serialization or dynamic coding.
     * @returns "EquiRectangularCubeTexture"
     */
    public getClassName(): string {
        return "EquiRectangularCubeTexture";
    }

    /**
     * Create a clone of the current EquiRectangularCubeTexture and return it.
     * @returns A clone of the current EquiRectangularCubeTexture.
     */
    public clone(): EquiRectangularCubeTexture {
        const scene = this.getScene();
        if (!scene) {
            return this;
        }

        const newTexture = new EquiRectangularCubeTexture(this.url, scene, this._size, this._noMipmap, this.gammaSpace);

        // Base texture
        newTexture.level = this.level;
        newTexture.wrapU = this.wrapU;
        newTexture.wrapV = this.wrapV;
        newTexture.coordinatesIndex = this.coordinatesIndex;
        newTexture.coordinatesMode = this.coordinatesMode;

        return newTexture;
    }
}
