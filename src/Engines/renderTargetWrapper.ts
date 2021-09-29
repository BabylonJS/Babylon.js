import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { RenderTargetCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import { Nullable } from "../types";
import { Constants } from "./constants";
import { ThinEngine } from "./thinEngine";

/**
 * Wrapper around a render target (either single or multi textures)
 */
export class RenderTargetWrapper {
    protected _engine: ThinEngine;
    private _size: TextureSize;
    private _isCube: boolean;
    private _isMulti: boolean;
    private _textures: Nullable<InternalTexture[]> = null;

    /** @hidden */
    public _attachments: Nullable<number[]> = null;
    /** @hidden */
    public _generateStencilBuffer: boolean = false;
    /** @hidden */
    public _generateDepthBuffer: boolean = false;

    /** @hidden */
    public _depthStencilTexture: Nullable<InternalTexture>;
    /** @hidden */
    public _depthStencilTextureWithStencil: boolean = false;

    /**
     * Defines if the render target wrapper is for a cube texture or if false a 2d texture
     */
    public get isCube(): boolean {
        return this._isCube;
    }

    /**
     * Defines if the render target wrapper is for a single or multi target render wrapper
     */
    public get isMulti(): boolean {
        return this._isMulti;
    }

    /**
     * Defines if the render target wrapper is for a single or an array of textures
     */
    public get is2DArray(): boolean {
        return this.layers > 0;
    }

    /**
     * Gets the size of the render target wrapper (used for cubes, as width=height in this case)
     */
    public get size(): number {
        return this.width;
    }

    /**
     * Gets the width of the render target wrapper
     */
    public get width(): number {
        return (<{ width: number; height: number }>this._size).width || <number>this._size;
    }

    /**
     * Gets the height of the render target wrapper
     */
    public get height(): number {
        return (<{ width: number; height: number }>this._size).height || <number>this._size;
    }

    /**
     * Gets the number of layers of the render target wrapper (only used if is2DArray is true)
     */
    public get layers(): number {
        return (<{ width: number; height: number; layers?: number }>this._size).layers || 0;
    }

    /**
     * Gets the render texture. If this is a multi render target, gets the first texture
     */
    public get texture(): Nullable<InternalTexture> {
        return this._textures?.[0] ?? null;
    }

    /**
     * Gets the list of render textures. If we are not in a multi render target, the list will be null (use the texture getter instead)
     */
    public get textures(): Nullable<InternalTexture[]> {
        return this._textures;
    }

    /**
     * Gets the sample count of the render target
     */
    public get samples(): number {
        return this.texture?.samples ?? 1;
    }

    /**
     * Sets the sample count of the render target
     * @param value sample count
     * @param initializeBuffers If set to true, the engine will make an initializing call to drawBuffers (only used when isMulti=true).
     * @param force true to force calling the update sample count engine function even if the current sample count is equal to value
     * @returns the sample count that has been set
     */
    public setSamples(value: number, initializeBuffers = true, force = false): number {
        if (this.samples === value && !force) {
            return value;
        }

        return this._isMulti
            ? this._engine.updateMultipleRenderTargetTextureSampleCount(this, value, initializeBuffers)
            : this._engine.updateRenderTargetTextureSampleCount(this, value);
    }

    /**
     * Initializes the render target wrapper
     * @param isMulti true if the wrapper is a multi render target
     * @param isCube true if the wrapper should render to a cube texture
     * @param size size of the render target (width/height/layers)
     * @param engine engine used to create the render target
     */
    constructor(isMulti: boolean, isCube: boolean, size: TextureSize, engine: ThinEngine) {
        this._isMulti = isMulti;
        this._isCube = isCube;
        this._size = size;
        this._engine = engine;
        this._depthStencilTexture = null;
    }

    /**
     * Sets the render target texture(s)
     * @param textures texture(s) to set
     */
    public setTextures(textures: Nullable<InternalTexture> | Nullable<InternalTexture[]>): void {
        if (Array.isArray(textures)) {
            this._textures = textures;
        } else if (textures) {
            this._textures = [textures];
        } else {
            this._textures = null;
        }
    }

    /**
     * Set a texture in the textures array
     * @param texture the texture to set
     * @param index the index in the textures array to set
     * @param disposePrevious If this function should dispose the previous texture
     */
    public setTexture(texture: InternalTexture, index: number = 0, disposePrevious: boolean = true): void {
        if (!this._textures) {
            this._textures = [];
        }
        if (this._textures[index] && disposePrevious) {
            this._textures[index].dispose();
        }

        this._textures[index] = texture;
    }

    /**
     * Creates the depth/stencil texture
     * @param comparisonFunction Comparison function to use for the texture
     * @param bilinearFiltering true if bilinear filtering should be used when sampling the texture
     * @param generateStencil true if the stencil aspect should also be created
     * @param samples sample count to use when creating the texture
     * @param format format of the depth texture
     * @returns the depth/stencil created texture
     */
    public createDepthStencilTexture(comparisonFunction: number = 0, bilinearFiltering: boolean = true, generateStencil: boolean = false, samples: number = 1, format: number = Constants.TEXTUREFORMAT_DEPTH16): InternalTexture {
        this._depthStencilTexture?.dispose();

        this._depthStencilTextureWithStencil = generateStencil;
        this._depthStencilTexture = this._engine.createDepthStencilTexture(
            this._size,
            {
                bilinearFiltering,
                comparisonFunction,
                generateStencil,
                isCube: this._isCube,
                samples,
                depthTextureFormat: format,
            },
            this
        );

        return this._depthStencilTexture;
    }

    /**
     * Shares the depth buffer of this render target with another render target.
     * @hidden
     * @param renderTarget Destination renderTarget
     */
    public _shareDepth(renderTarget: RenderTargetWrapper): void {
        if (this._depthStencilTexture) {
            if (renderTarget._depthStencilTexture) {
                renderTarget._depthStencilTexture.dispose();
            }

            renderTarget._depthStencilTexture = this._depthStencilTexture;
            this._depthStencilTexture.incrementReferences();
        }
    }

    /** @hidden */
    public _swapAndDie(target: Nullable<InternalTexture>): void {
        if (target && this.texture) {
            this.texture._swapAndDie(target);
        }
        this._textures = null;
        this.dispose(true);
    }

    protected _cloneRenderTargetWrapper(): Nullable<RenderTargetWrapper> {
        let rtw: Nullable<RenderTargetWrapper> = null;

        if (this._isMulti) {
            const textureArray = this.textures;
            if (textureArray && textureArray.length > 0) {
                let generateDepthTexture = false;
                let textureCount = textureArray.length;

                const lastTextureSource = textureArray[textureArray.length - 1]._source;
                if (lastTextureSource === InternalTextureSource.Depth || lastTextureSource === InternalTextureSource.DepthStencil) {
                    generateDepthTexture = true;
                    textureCount--;
                }

                const samplingModes: number[] = [];
                const types: number[] = [];

                for (let i = 0; i < textureCount; ++i) {
                    const texture = textureArray[i];

                    samplingModes.push(texture.samplingMode);
                    types.push(texture.type);
                }

                const optionsMRT = {
                    samplingModes,
                    generateMipMaps: textureArray[0].generateMipMaps,
                    generateDepthBuffer: this._generateDepthBuffer,
                    generateStencilBuffer: this._generateStencilBuffer,
                    generateDepthTexture,
                    types,
                    textureCount,
                };
                const size = {
                    width: this.width,
                    height: this.height,
                };

                rtw = this._engine.createMultipleRenderTarget(size, optionsMRT);
            }
        } else {
            let options = new RenderTargetCreationOptions();

            options.generateDepthBuffer = this._generateDepthBuffer;
            options.generateMipMaps = this.texture?.generateMipMaps ?? false;
            options.generateStencilBuffer = this._generateStencilBuffer;
            options.samplingMode = this.texture?.samplingMode;
            options.type = this.texture?.type;
            options.format = this.texture?.format;

            if (this.isCube) {
                rtw = this._engine.createRenderTargetCubeTexture(this.width, options);
            } else {
                let size = {
                    width: this.width,
                    height: this.height,
                    layers: this.is2DArray ? this.texture?.depth : undefined,
                };

                rtw = this._engine.createRenderTargetTexture(size, options);
            }
            rtw.texture!.isReady = true;
        }

        return rtw;
    }

    protected _swapRenderTargetWrapper(target: RenderTargetWrapper): void {
        if (this._textures && target._textures) {
            for (let i = 0; i < this._textures.length; ++i) {
                this._textures[i]._swapAndDie(target._textures[i], false);
                target._textures[i].isReady = true;
            }
        }
        if (this._depthStencilTexture && target._depthStencilTexture) {
            this._depthStencilTexture._swapAndDie(target._depthStencilTexture);
            target._depthStencilTexture.isReady = true;
        }

        this._textures = null;
        this._depthStencilTexture = null;
    }

    /** @hidden */
    public _rebuild(): void {
        let rtw = this._cloneRenderTargetWrapper();
        if (!rtw) {
            return;
        }

        if (this._depthStencilTexture) {
            const samplingMode = this._depthStencilTexture.samplingMode;
            const bilinear =
                samplingMode === Constants.TEXTURE_BILINEAR_SAMPLINGMODE ||
                samplingMode === Constants.TEXTURE_TRILINEAR_SAMPLINGMODE ||
                samplingMode === Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST;
            rtw.createDepthStencilTexture(this._depthStencilTexture._comparisonFunction, bilinear, this._depthStencilTextureWithStencil, this._depthStencilTexture.samples);
        }

        if (this.samples > 1) {
            rtw.setSamples(this.samples);
        }

        rtw._swapRenderTargetWrapper(this);
        rtw.dispose();
    }

    /**
     * Releases the internal render textures
     */
    public releaseTextures(): void {
        if (this._textures) {
            for (let i = 0; i < this._textures?.length ?? 0; ++i) {
                this._textures[i].dispose();
            }
        }
        this._textures = null;
    }

    /**
     * Disposes the whole render target wrapper
     * @param disposeOnlyFramebuffers true if only the frame buffers should be released (used for the WebGL engine). If false, all the textures will also be released
     */
    public dispose(disposeOnlyFramebuffers = false): void {
        if (!disposeOnlyFramebuffers) {
            this._depthStencilTexture?.dispose();
            this._depthStencilTexture = null;
            this.releaseTextures();
        }

        this._engine._releaseRenderTargetWrapper(this);
    }
}
