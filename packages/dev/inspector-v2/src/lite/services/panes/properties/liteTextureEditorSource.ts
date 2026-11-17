import {
    getTextureMetadata,
    getTextureReadbackInfo,
    readTexturePixelsRGBA8,
    updateTexture2DFromPixels,
    updateTextureRegion,
    type CubeTexture,
    type EngineContext,
    type Texture2D,
    type TextureRegion,
} from "@babylonjs/lite";

import { type ISize } from "core/index";
import { type ITextureEditorSource, type TextureEditorPixels } from "../../../../components/textureEditor/textureEditorSource";

type LiteTexture = Texture2D | CubeTexture;

const CopyDestinationUsage = 0x02;

export type LiteTextureEditability =
    | Readonly<{
          canEdit: true;
          texture: Texture2D;
      }>
    | Readonly<{
          canEdit: false;
          reason: string;
      }>;

export function GetLiteTextureEditability(texture: LiteTexture): LiteTextureEditability {
    let metadata: ReturnType<typeof getTextureMetadata>;
    let readbackInfo: ReturnType<typeof getTextureReadbackInfo>;
    try {
        metadata = getTextureMetadata(texture);
        readbackInfo = getTextureReadbackInfo(texture);
    } catch {
        return { canEdit: false, reason: "This texture is no longer available." };
    }
    if (!metadata || metadata.kind !== "2d" || readbackInfo.kind !== "2d") {
        return { canEdit: false, reason: "Only 2D textures can be edited." };
    }
    if (!IsTexture2D(texture)) {
        return { canEdit: false, reason: "This texture does not expose a writable 2D allocation." };
    }
    if (metadata.format !== "rgba8unorm" && metadata.format !== "rgba8unorm-srgb") {
        return { canEdit: false, reason: "Editing is supported only for RGBA8 textures." };
    }
    if ((texture.texture.usage & CopyDestinationUsage) === 0) {
        return { canEdit: false, reason: "This texture was not created with writable GPU usage." };
    }
    return { canEdit: true, texture };
}

function IsTexture2D(texture: LiteTexture): texture is Texture2D {
    return "width" in texture && "height" in texture;
}

export class LiteTextureEditorSource implements ITextureEditorSource {
    private readonly _engine: EngineContext;
    private readonly _texture: Texture2D;
    private readonly _isAvailable: () => boolean;
    private _originalPixelsPromise: Promise<Uint8Array[]> | undefined;
    private _isDisposed = false;

    public constructor(engine: EngineContext, texture: Texture2D, isAvailable: () => boolean) {
        this._engine = engine;
        this._texture = texture;
        this._isAvailable = isAvailable;
    }

    public get name(): string {
        return getTextureMetadata(this._texture)?.name ?? "Texture";
    }

    public get size(): ISize {
        return { width: this._texture.width, height: this._texture.height };
    }

    public get isCube(): boolean {
        return false;
    }

    public get hasAlpha(): boolean {
        return true;
    }

    public get noMipmap(): boolean {
        return this.maxMipLevel === 0;
    }

    public get mipPreviewEnabled(): boolean {
        return this.maxMipLevel > 0;
    }

    public get maxMipLevel(): number {
        return Math.max(0, getTextureReadbackInfo(this._texture).mipLevelCount - 1);
    }

    public get canResize(): boolean {
        return false;
    }

    public get resizeDisabledReason(): string {
        return "Lite texture allocation cannot be resized without replacing its material bindings.";
    }

    public get uploadAccept(): string {
        return ".jpg, .jpeg, .png, .tga";
    }

    public get infoMessage(): string {
        return "Edits affect every material sharing this texture. Resizing is disabled because Lite does not expose a safe allocation-replacement API.";
    }

    public async readPixelsAsync(mipLevel: number): Promise<TextureEditorPixels> {
        // The editor's first read happens when it opens, so this is when Reset's baseline is captured.
        await this._captureOriginalPixelsAsync();
        this._assertAvailable();
        const result = await readTexturePixelsRGBA8(this._engine, this._texture, { mipLevel });
        this._assertAvailable();
        return { data: result.pixels, width: result.width, height: result.height };
    }

    public async writePixelsAsync(pixels: Uint8Array, canvas: HTMLCanvasElement, size: ISize): Promise<void> {
        this._assertAvailable();
        if (size.width !== this._texture.width || size.height !== this._texture.height) {
            throw new Error("The uploaded image must match the texture dimensions.");
        }
        await this._captureOriginalPixelsAsync();
        this._assertAvailable();
        updateTexture2DFromPixels(this._engine, this._texture, pixels);
        this._updateMipLevels(canvas, size);
    }

    public async uploadNativeFileAsync(_file: File): Promise<boolean> {
        return false;
    }

    public async resetAsync(): Promise<void> {
        this._assertAvailable();
        const originalMipPixels = await this._captureOriginalPixelsAsync();
        this._assertAvailable();
        const basePixels = originalMipPixels[0];
        if (!basePixels) {
            throw new Error("The original texture pixels are not available for reset.");
        }
        updateTexture2DFromPixels(this._engine, this._texture, basePixels);
        for (let mipLevel = 1; mipLevel < originalMipPixels.length; mipLevel++) {
            const region: TextureRegion = {
                width: Math.max(1, this._texture.width >> mipLevel),
                height: Math.max(1, this._texture.height >> mipLevel),
                mipLevel,
                bytesPerRow: Math.max(1, this._texture.width >> mipLevel) * 4,
            };
            updateTextureRegion(this._engine, this._texture, originalMipPixels[mipLevel], region);
        }
    }

    public dispose(): void {
        this._isDisposed = true;
        this._originalPixelsPromise = undefined;
    }

    private async _captureOriginalPixelsAsync(): Promise<Uint8Array[]> {
        this._assertAvailable();
        this._originalPixelsPromise ??= (async () => {
            const mipCount = getTextureReadbackInfo(this._texture).mipLevelCount;
            const result: Uint8Array[] = [];
            for (let mipLevel = 0; mipLevel < mipCount; mipLevel++) {
                this._assertAvailable();
                // Read mips serially to keep each readback's lifetime bounded.
                // eslint-disable-next-line no-await-in-loop
                const { pixels } = await readTexturePixelsRGBA8(this._engine, this._texture, { mipLevel });
                result.push(pixels.slice());
            }
            return result;
        })();
        return await this._originalPixelsPromise;
    }

    private _updateMipLevels(canvas: HTMLCanvasElement, size: ISize): void {
        const mipLevelCount = getTextureReadbackInfo(this._texture).mipLevelCount;
        if (mipLevelCount <= 1) {
            return;
        }

        const sourceCanvases = [canvas, canvas.ownerDocument.createElement("canvas"), canvas.ownerDocument.createElement("canvas")];
        let sourceCanvas = canvas;
        let sourceWidth = size.width;
        let sourceHeight = size.height;
        for (let mipLevel = 1; mipLevel < mipLevelCount; mipLevel++) {
            const width = Math.max(1, this._texture.width >> mipLevel);
            const height = Math.max(1, this._texture.height >> mipLevel);
            const targetCanvas = sourceCanvases[1 + ((mipLevel - 1) % 2)];
            targetCanvas.width = width;
            targetCanvas.height = height;
            const context = targetCanvas.getContext("2d");
            if (!context) {
                throw new Error("Could not regenerate the texture mip levels.");
            }
            context.imageSmoothingEnabled = true;
            context.drawImage(sourceCanvas, 0, 0, sourceWidth, sourceHeight, 0, 0, width, height);
            const pixels = context.getImageData(0, 0, width, height).data;
            updateTextureRegion(this._engine, this._texture, pixels, {
                width,
                height,
                mipLevel,
                bytesPerRow: width * 4,
            });
            sourceCanvas = targetCanvas;
            sourceWidth = width;
            sourceHeight = height;
        }
    }

    private _assertAvailable(): void {
        if (this._isDisposed || !this._isAvailable()) {
            throw new Error("The texture is no longer available for editing.");
        }
    }
}
