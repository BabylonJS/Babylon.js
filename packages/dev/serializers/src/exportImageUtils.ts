import { ImageMimeType } from "babylonjs-gltf2interface";
import { NullEngine } from "core/Engines/nullEngine";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { type Texture } from "core/Materials/Textures/texture";
import { GetMimeType } from "core/Misc/fileTools";
import { Tools } from "core/Misc/tools";
import { type Nullable } from "core/types";

export function GetFileExtensionFromMimeType(mimeType: ImageMimeType): string {
    switch (mimeType) {
        case ImageMimeType.JPEG:
            return ".jpg";
        case ImageMimeType.PNG:
            return ".png";
        case ImageMimeType.WEBP:
            return ".webp";
        case ImageMimeType.AVIF:
            return ".avif";
        case ImageMimeType.KTX2:
            return ".ktx2";
    }
}

/**
 * Gets cached image data from a texture's internal buffer, if available.
 * @param babylonTexture texture to check for cached image data
 * @returns image data and mime type if found; null otherwise
 */
export async function GetCachedImageAsync(babylonTexture: BaseTexture): Promise<Nullable<{ data: ArrayBuffer; mimeType: string }>> {
    const internalTexture = babylonTexture.getInternalTexture();
    if (!internalTexture || internalTexture.source !== InternalTextureSource.Url) {
        return null;
    }
    if (internalTexture.invertY) {
        // On a real engine, the GPU has the texture stored flipped (UNPACK_FLIP_Y_WEBGL),
        // while the glTF loader uploads with invertY=false. Falling back to GPU readback
        // produces bytes that round-trip correctly. NullEngine has no GPU readback path,
        // so the cached URL bytes are the only option.
        const engine = babylonTexture.getScene()?.getEngine();
        if (!(engine instanceof NullEngine)) {
            return null;
        }
    }

    const buffer = internalTexture._buffer;

    let data;
    let mimeType = (babylonTexture as Texture).mimeType;

    try {
        if (!buffer) {
            data = await Tools.LoadFileAsync(internalTexture.url);
            mimeType = GetMimeType(internalTexture.url) || mimeType;
        } else if (ArrayBuffer.isView(buffer)) {
            data = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
        } else if (buffer instanceof ArrayBuffer) {
            data = buffer;
        } else if (buffer instanceof Blob) {
            data = await buffer.arrayBuffer();
            mimeType = buffer.type || mimeType;
        } else if (typeof buffer === "string") {
            data = await Tools.LoadFileAsync(buffer);
            mimeType = GetMimeType(buffer) || mimeType;
        } else if (typeof HTMLImageElement !== "undefined" && buffer instanceof HTMLImageElement) {
            data = await Tools.LoadFileAsync(buffer.src);
            mimeType = GetMimeType(buffer.src) || mimeType;
        }
    } catch {
        return null;
    }

    if (data && !mimeType && internalTexture.url) {
        const dataUriMatch = internalTexture.url.match(/^data:([^;,]+)/);
        mimeType = dataUriMatch ? dataUriMatch[1] : GetMimeType(internalTexture.url);
    }

    if (data && mimeType) {
        return { data, mimeType };
    }

    return null;
}
