import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { InternalTextureSource } from "../Materials/Textures/internalTexture";
import type { RenderTargetCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import type { Nullable } from "../types";
import { Constants } from "./constants";
import type { ThinEngine } from "./thinEngine";
import type { IMultiRenderTargetOptions } from "../Materials/Textures/multiRenderTarget";

/**
 * An interface enforcing the renderTarget accessor to used by render target textures.
 */
export interface IRenderTargetTexture {
    /**
     * Entry point to access the wrapper on a texture.
     */
    renderTarget: Nullable<RenderTargetWrapper>;
}

/**
 * Wrapper around a render target (either single or multi textures)
 */
export class RenderTargetWrapper {
    protected _engine: ThinEngine;
    private _size: TextureSize;
    private _isCube: boolean;
    private _isMulti: boolean;
    private _textures: Nullable<InternalTexture[]> = null;
    private _faceIndices: Nullable<number[]> = null;
    private _layerIndices: Nullable<number[]> = null;
    private _depthStencilTextureLabel?: string;
    /** @internal */
    public _samples = 1;

    /** @internal */
    public _attachments: Nullable<number[]> = null;
    /** @internal */
    public _generateStencilBuffer: boolean = false;
    /** @internal */
    public _generateDepthBuffer: boolean = false;

    /** @internal */
    public _depthStencilTexture: Nullable<InternalTexture>;
    /** @internal */
    public _depthStencilTextureWithStencil: boolean = false;

    /**
     * Gets or sets the label of the render target wrapper (optional, for debugging purpose)
     */
    public label?: string;

    /**
     * Gets the depth/stencil texture (if created by a createDepthStencilTexture() call)
     */
    public get depthStencilTexture() {
        return this._depthStencilTexture;
    }

    /**
     * Indicates if the depth/stencil texture has a stencil aspect
     */
    public get depthStencilTextureWithStencil() {
        return this._depthStencilTextureWithStencil;
    }

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
     * Gets the number of layers of the render target wrapper (only used if is2DArray is true and wrapper is not a multi render target)
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
     * Gets the face indices that correspond to the list of render textures. If we are not in a multi render target, the list will be null
     */
    public get faceIndices(): Nullable<number[]> {
        return this._faceIndices;
    }

    /**
     * Gets the layer indices that correspond to the list of render textures. If we are not in a multi render target, the list will be null
     */
    public get layerIndices(): Nullable<number[]> {
        return this._layerIndices;
    }

    /**
     * Gets the sample count of the render target
     */
    public get samples(): number {
        return this._samples;
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

        const result = this._isMulti
            ? this._engine.updateMultipleRenderTargetTextureSampleCount(this, value, initializeBuffers)
            : this._engine.updateRenderTargetTextureSampleCount(this, value);
        this._samples = value;
        return result;
    }

    /**
     * Initializes the render target wrapper
     * @param isMulti true if the wrapper is a multi render target
     * @param isCube true if the wrapper should render to a cube texture
     * @param size size of the render target (width/height/layers)
     * @param engine engine used to create the render target
     * @param label defines the label to use for the wrapper (for debugging purpose only)
     */
    constructor(isMulti: boolean, isCube: boolean, size: TextureSize, engine: ThinEngine, label?: string) {
        this._isMulti = isMulti;
        this._isCube = isCube;
        this._size = size;
        this._engine = engine;
        this._depthStencilTexture = null;
        this.label = label;
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
     * @param texture The texture to set
     * @param index The index in the textures array to set
     * @param disposePrevious If this function should dispose the previous texture
     */
    public setTexture(texture: InternalTexture, index: number = 0, disposePrevious: boolean = true): void {
        if (!this._textures) {
            this._textures = [];
        }
        if (this._textures[index] === texture) {
            return;
        }

        if (this._textures[index] && disposePrevious) {
            this._textures[index].dispose();
        }

        this._textures[index] = texture;
    }

    /**
     * Sets the layer and face indices of every render target texture bound to each color attachment
     * @param layers The layers of each texture to be set
     * @param faces The faces of each texture to be set
     */
    public setLayerAndFaceIndices(layers: number[], faces: number[]) {
        this._layerIndices = layers;
        this._faceIndices = faces;
    }

    /**
     * Sets the layer and face indices of a texture in the textures array that should be bound to each color attachment
     * @param index The index of the texture in the textures array to modify
     * @param layer The layer of the texture to be set
     * @param face The face of the texture to be set
     */
    public setLayerAndFaceIndex(index: number = 0, layer?: number, face?: number): void {
        if (!this._layerIndices) {
            this._layerIndices = [];
        }
        if (!this._faceIndices) {
            this._faceIndices = [];
        }

        if (layer !== undefined && layer >= 0) {
            this._layerIndices[index] = layer;
        }
        if (face !== undefined && face >= 0) {
            this._faceIndices[index] = face;
        }
    }

    /**
     * Creates the depth/stencil texture
     * @param comparisonFunction Comparison function to use for the texture
     * @param bilinearFiltering true if bilinear filtering should be used when sampling the texture
     * @param generateStencil true if the stencil aspect should also be created
     * @param samples sample count to use when creating the texture
     * @param format format of the depth texture
     * @param label defines the label to use for the texture (for debugging purpose only)
     * @returns the depth/stencil created texture
     */
    public createDepthStencilTexture(
        comparisonFunction: number = 0,
        bilinearFiltering: boolean = true,
        generateStencil: boolean = false,
        samples: number = 1,
        format: number = Constants.TEXTUREFORMAT_DEPTH32_FLOAT,
        label?: string
    ): InternalTexture {
        this._depthStencilTexture?.dispose();

        this._depthStencilTextureWithStencil = generateStencil;
        this._depthStencilTextureLabel = label;
        this._depthStencilTexture = this._engine.createDepthStencilTexture(
            this._size,
            {
                bilinearFiltering,
                comparisonFunction,
                generateStencil,
                isCube: this._isCube,
                samples,
                depthTextureFormat: format,
                label,
            },
            this
        );

        return this._depthStencilTexture;
    }

    /**
     * Shares the depth buffer of this render target with another render target.
     * @internal
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

    /**
     * @internal
     */
    public _swapAndDie(target: InternalTexture): void {
        if (this.texture) {
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
                let depthTextureFormat = -1;

                const lastTextureSource = textureArray[textureArray.length - 1]._source;
                if (lastTextureSource === InternalTextureSource.Depth || lastTextureSource === InternalTextureSource.DepthStencil) {
                    generateDepthTexture = true;
                    depthTextureFormat = textureArray[textureArray.length - 1].format;
                    textureCount--;
                }

                const samplingModes: number[] = [];
                const types: number[] = [];
                const formats: number[] = [];
                const targetTypes: number[] = [];
                const faceIndex: number[] = [];
                const layerIndex: number[] = [];
                const layerCounts: number[] = [];
                const internalTexture2Index: { [id: number]: number } = {};

                for (let i = 0; i < textureCount; ++i) {
                    const texture = textureArray[i];

                    samplingModes.push(texture.samplingMode);
                    types.push(texture.type);
                    formats.push(texture.format);

                    const index = internalTexture2Index[texture.uniqueId];
                    if (index !== undefined) {
                        targetTypes.push(-1);
                        layerCounts.push(0);
                    } else {
                        internalTexture2Index[texture.uniqueId] = i;
                        if (texture.is2DArray) {
                            targetTypes.push(Constants.TEXTURE_2D_ARRAY);
                            layerCounts.push(texture.depth);
                        } else if (texture.isCube) {
                            targetTypes.push(Constants.TEXTURE_CUBE_MAP);
                            layerCounts.push(0);
                        } /*else if (texture.isCubeArray) {
                            targetTypes.push(Constants.TEXTURE_CUBE_MAP_ARRAY);
                            layerCounts.push(texture.depth);
                        }*/ else if (texture.is3D) {
                            targetTypes.push(Constants.TEXTURE_3D);
                            layerCounts.push(texture.depth);
                        } else {
                            targetTypes.push(Constants.TEXTURE_2D);
                            layerCounts.push(0);
                        }
                    }

                    if (this._faceIndices) {
                        faceIndex.push(this._faceIndices[i] ?? 0);
                    }
                    if (this._layerIndices) {
                        layerIndex.push(this._layerIndices[i] ?? 0);
                    }
                }

                const optionsMRT: IMultiRenderTargetOptions = {
                    samplingModes,
                    generateMipMaps: textureArray[0].generateMipMaps,
                    generateDepthBuffer: this._generateDepthBuffer,
                    generateStencilBuffer: this._generateStencilBuffer,
                    generateDepthTexture,
                    depthTextureFormat,
                    types,
                    formats,
                    textureCount,
                    targetTypes,
                    faceIndex,
                    layerIndex,
                    layerCounts,
                    label: this.label,
                };
                const size = {
                    width: this.width,
                    height: this.height,
                };

                rtw = this._engine.createMultipleRenderTarget(size, optionsMRT);

                for (let i = 0; i < textureCount; ++i) {
                    if (targetTypes[i] !== -1) {
                        continue;
                    }
                    const index = internalTexture2Index[textureArray[i].uniqueId];
                    rtw.setTexture(rtw.textures![index], i);
                }
            }
        } else {
            const options: RenderTargetCreationOptions = {};

            options.generateDepthBuffer = this._generateDepthBuffer;
            options.generateMipMaps = this.texture?.generateMipMaps ?? false;
            options.generateStencilBuffer = this._generateStencilBuffer;
            options.samplingMode = this.texture?.samplingMode;
            options.type = this.texture?.type;
            options.format = this.texture?.format;
            options.noColorAttachment = !this._textures;
            options.label = this.label;

            if (this.isCube) {
                rtw = this._engine.createRenderTargetCubeTexture(this.width, options);
            } else {
                const size = {
                    width: this.width,
                    height: this.height,
                    layers: this.is2DArray ? this.texture?.depth : undefined,
                };

                rtw = this._engine.createRenderTargetTexture(size, options);
            }
            if (rtw.texture) {
                rtw.texture!.isReady = true;
            }
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

    /** @internal */
    public _rebuild(): void {
        const rtw = this._cloneRenderTargetWrapper();
        if (!rtw) {
            return;
        }

        if (this._depthStencilTexture) {
            const samplingMode = this._depthStencilTexture.samplingMode;
            const format = this._depthStencilTexture.format;
            const bilinear =
                samplingMode === Constants.TEXTURE_BILINEAR_SAMPLINGMODE ||
                samplingMode === Constants.TEXTURE_TRILINEAR_SAMPLINGMODE ||
                samplingMode === Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST;

            rtw.createDepthStencilTexture(
                this._depthStencilTexture._comparisonFunction,
                bilinear,
                this._depthStencilTextureWithStencil,
                this._depthStencilTexture.samples,
                format,
                this._depthStencilTextureLabel
            );
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
