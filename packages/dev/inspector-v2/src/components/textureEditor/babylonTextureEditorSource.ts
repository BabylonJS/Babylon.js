import { type BaseTexture, type CubeTexture, type ISize, type InternalTexture, type Nullable } from "core/index";
import { Constants } from "core/Engines/constants";
import { HtmlElementTexture } from "core/Materials/Textures/htmlElementTexture";
import { type Texture } from "core/Materials/Textures/texture";
import { ApplyChannelsToTextureDataAsync } from "../../misc/textureTools";
import { type ITextureEditorSource, type TextureEditorPixels } from "./textureEditorSource";

export class BabylonTextureEditorSource implements ITextureEditorSource {
    private readonly _texture: BaseTexture;
    private readonly _originalTexture: Nullable<InternalTexture>;
    private readonly _originalUrl: Nullable<string>;
    private readonly _originalForceSerialize: boolean;
    private _target: Nullable<HtmlElementTexture> = null;
    private _didEdit = false;

    public constructor(texture: BaseTexture) {
        this._texture = texture;
        this._originalTexture = texture._texture;
        this._originalUrl = (texture as Texture).url;
        this._originalForceSerialize = texture._forceSerialize;
    }

    public get name(): string {
        return this._texture.name;
    }

    public get size(): ISize {
        return this._texture.getSize();
    }

    public get isCube(): boolean {
        return this._texture.isCube;
    }

    public get hasAlpha(): boolean {
        return this._texture.textureFormat === -1 || this._texture.textureFormat === Constants.TEXTUREFORMAT_RGBA;
    }

    public get noMipmap(): boolean {
        return this._texture.noMipmap;
    }

    public get mipPreviewEnabled(): boolean {
        return !this.noMipmap && !!this._texture.getScene()?.getEngine().getCaps().textureLOD;
    }

    public get maxMipLevel(): number {
        const { width, height } = this.size;
        return this._texture.noMipmap ? 0 : Math.floor(Math.log2(Math.max(width, height)));
    }

    public get canResize(): boolean {
        return !this.isCube;
    }

    public get resizeDisabledReason(): string | undefined {
        return this.isCube ? "Cube texture resizing is not supported." : undefined;
    }

    public get uploadAccept(): string {
        return ".jpg, .png, .tga, .dds, .env, .exr";
    }

    public async readPixelsAsync(mipLevel: number, face: number, size?: ISize): Promise<TextureEditorPixels> {
        const { width, height } = size ?? {
            width: Math.max(1, Math.floor(this.size.width / 2 ** mipLevel)),
            height: Math.max(1, Math.floor(this.size.height / 2 ** mipLevel)),
        };
        const data = await ApplyChannelsToTextureDataAsync(this._texture, width, height, face, { R: true, G: true, B: true, A: true }, mipLevel);
        return { data, width, height };
    }

    public async writePixelsAsync(_pixels: Uint8Array, canvas: HTMLCanvasElement, size: ISize): Promise<void> {
        if (this.isCube) {
            return;
        }

        const texture = this._texture as Texture;
        if (!this._target) {
            this._target = new HtmlElementTexture("editor", canvas, {
                engine: texture.getScene()?.getEngine()!,
                scene: null,
                samplingMode: texture.samplingMode,
                generateMipMaps: this._originalTexture?.generateMipMaps,
            });
        } else {
            this._target.element = canvas;
        }
        this._target.update(false);
        this._target._texture?.updateSize(size.width, size.height);
        texture._texture = this._target._texture;
        texture.url = null;
        texture._forceSerialize = true;
        this._didEdit = true;
    }

    public async uploadNativeFileAsync(file: File): Promise<boolean> {
        const extension = file.name.toLowerCase().endsWith(".dds") ? ".dds" : file.name.toLowerCase().endsWith(".env") ? ".env" : undefined;
        if (!this.isCube || !extension) {
            return false;
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === "string") {
                    resolve(reader.result);
                } else {
                    reject(new Error("Could not read the selected cube texture."));
                }
            };
            reader.onerror = () => reject(reader.error ?? new Error("Could not read the selected cube texture."));
            reader.readAsDataURL(file);
        });

        await new Promise<void>((resolve, reject) => {
            (this._texture as CubeTexture).updateURL(dataUrl, extension, resolve, false, (message, error) =>
                reject(error instanceof Error ? error : new Error(message ?? String(error ?? "Could not load the selected cube texture.")))
            );
        });
        return true;
    }

    public async resetAsync(): Promise<void> {
        this._texture._texture = this._originalTexture;
        (this._texture as Texture).url = this._originalUrl;
        this._texture._forceSerialize = this._originalForceSerialize;
        this._target?.dispose();
        this._target = null;
        this._didEdit = false;
    }

    public dispose(): void {
        if (this._didEdit) {
            this._originalTexture?.dispose();
        }
    }
}
