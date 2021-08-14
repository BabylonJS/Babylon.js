import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { RenderTargetCreationOptions } from "../Materials/Textures/renderTargetCreationOptions";
import { Nullable } from "../types";
import { Constants } from "./constants";
import { RenderTargetTextureSize } from "./Extensions/engine.renderTarget";
import { ThinEngine } from "./thinEngine";

export class RenderTargetWrapper {

    protected _engine: ThinEngine;
    private _size: RenderTargetTextureSize;
    private _isCube: boolean;
    private _isMulti: boolean;
    private _textures: Nullable<InternalTexture[]> = null;

    public _attachments: Nullable<number[]> = null;
    public _generateStencilBuffer: boolean = false;
    public _generateDepthBuffer: boolean = false;

    public _depthStencilTexture: Nullable<InternalTexture>;
    public _depthStencilTextureWithStencil: boolean = false;

    public get isCube(): boolean {
        return this._isCube;
    }

    public get isMulti(): boolean {
        return this._isMulti;
    }

    public get is2DArray(): boolean {
        return !!(<{ width: number, height: number, layers?: number }>this._size).layers ?? false;
    }

    public get size(): number {
        return this.width;
    }

    public get width(): number {
        return ((<{ width: number, height: number }>this._size).width) || <number>this._size;
    }

    public get height(): number {
        return ((<{ width: number, height: number }>this._size).height) || <number>this._size;
    }

    public get layers(): number {
        return ((<{ width: number, height: number, layers?: number }>this._size).layers) || 0;
    }

    public get texture(): Nullable<InternalTexture> {
        return this._textures?.[0] ?? null;
    }

    public get textures(): Nullable<InternalTexture[]> {
        return this._isMulti ? this._textures : null;
    }

    public get samples(): number {
        return this.texture?.samples ?? 1;
    }

    public setSamples(value: number, initializeBuffers = true, force = false): number {
        if (this.samples === value && !force) {
            return value;
        }

        return this._isMulti ? this._engine.updateMultipleRenderTargetTextureSampleCount(this, value, initializeBuffers) : this._engine.updateRenderTargetTextureSampleCount(this, value);
    }

    constructor(isMulti: boolean, isCube: boolean, size: RenderTargetTextureSize, engine: ThinEngine) {
        this._isMulti = isMulti;
        this._isCube = isCube;
        this._size = size;
        this._engine = engine;
        this._depthStencilTexture = null;
    }

    public setTextures(textures: Nullable<InternalTexture> | Nullable<InternalTexture[]>): void {
        if (Array.isArray(textures)) {
            this._textures = textures;
        } else if (textures) {
            this._textures = [textures];
        } else {
            this._textures = null;
        }
    }

    public createDepthStencilTexture(comparisonFunction: number = 0, bilinearFiltering: boolean = true, generateStencil: boolean = false, samples: number = 1): InternalTexture {
        this._depthStencilTexture?.dispose();

        this._depthStencilTextureWithStencil = generateStencil;
        this._depthStencilTexture = this._engine.createDepthStencilTexture(this._size, {
            bilinearFiltering,
            comparisonFunction,
            generateStencil,
            isCube: this._isCube,
            samples
        }, this);

        return this._depthStencilTexture;
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
                    layers: this.is2DArray ? this.texture?.depth : undefined
                };

                rtw = this._engine.createRenderTargetTexture(size, options);
            }
            rtw.texture!.isReady = true;
        }

        return rtw;
    }

    protected _swapRenderTargetWrapper(target: RenderTargetWrapper): void {
        target._textures = this._textures;
        target._depthStencilTexture = this._depthStencilTexture;

        this._textures = null;
        this._depthStencilTexture = null;
        
        this.dispose();
    }

    /** @hidden */
    public _rebuild(): void {
        let rtw = this._cloneRenderTargetWrapper();
        if (!rtw) {
            return;
        }

        if (this._depthStencilTexture) {
            const samplingMode = this.texture?.samplingMode;
            const bilinear = (samplingMode === Constants.TEXTURE_BILINEAR_SAMPLINGMODE) || (samplingMode === Constants.TEXTURE_TRILINEAR_SAMPLINGMODE) || (samplingMode === Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST);
            rtw.createDepthStencilTexture(this.texture?._comparisonFunction, bilinear, this._depthStencilTextureWithStencil, this.samples);
            rtw._depthStencilTexture!.isReady = true;
        }

        if (this.samples > 1) {
            rtw.setSamples(this.samples);
        }

        rtw._swapRenderTargetWrapper(this);
    }

    public releaseTextures(): void {
        if (this._textures) {
            for (let i = 0; i < this._textures?.length ?? 0; ++i) {
                this._textures[i].dispose();
            }
        }
        this._textures = null;
    }

    public dispose(disposeOnlyFramebuffers = false): void {
        if (!disposeOnlyFramebuffers) {
            this._depthStencilTexture?.dispose();
            this._depthStencilTexture = null;
            this.releaseTextures();
        }

        this._engine._releaseRenderTargetWrapper(this);
    }
}
