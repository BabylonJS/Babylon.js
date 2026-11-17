import { type ISize } from "core/index";

export type TextureEditorPixels = {
    data: Uint8Array;
    width: number;
    height: number;
};

export interface ITextureEditorSource {
    readonly name: string;
    readonly size: ISize;
    readonly isCube: boolean;
    readonly hasAlpha: boolean;
    readonly noMipmap: boolean;
    readonly mipPreviewEnabled: boolean;
    readonly maxMipLevel: number;
    readonly canResize: boolean;
    readonly resizeDisabledReason?: string;
    readonly uploadAccept: string;
    readonly infoMessage?: string;
    readPixelsAsync(mipLevel: number, face: number, size?: ISize): Promise<TextureEditorPixels>;
    writePixelsAsync(pixels: Uint8Array, canvas: HTMLCanvasElement, size: ISize): Promise<void>;
    uploadNativeFileAsync(file: File): Promise<boolean>;
    resetAsync(): Promise<void>;
    dispose(): void;
}
