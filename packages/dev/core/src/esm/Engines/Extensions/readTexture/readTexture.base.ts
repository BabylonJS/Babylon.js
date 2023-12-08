import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import type { Nullable } from "core/types";
import type { IBaseEnginePublic } from "../../engine.base";

export interface IReadTextureEngineExtension {
    /** @internal */
    _readTexturePixels(
        engineState: IBaseEnginePublic,
        texture: InternalTexture,
        width: number,
        height: number,
        faceIndex?: number,
        level?: number,
        buffer?: Nullable<ArrayBufferView>,
        flushRenderer?: boolean,
        noDataConversion?: boolean,
        x?: number,
        y?: number
    ): Promise<ArrayBufferView>;

    /** @internal */
    _readTexturePixelsSync(
        engineState: IBaseEnginePublic,
        texture: InternalTexture,
        width: number,
        height: number,
        faceIndex?: number,
        level?: number,
        buffer?: Nullable<ArrayBufferView>,
        flushRenderer?: boolean,
        noDataConversion?: boolean,
        x?: number,
        y?: number
    ): ArrayBufferView;
}
