import { InternalTexture } from "../Materials/Textures/internalTexture";
import { Nullable } from "../types";
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
