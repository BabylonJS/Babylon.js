import type { Nullable } from "core/types";
import type { InternalTexture } from "../internalTexture";
import type { IInternalTextureLoader } from "./internalTextureLoader";

/**
 * Loader for .exr file format
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _ExrTextureLoader implements IInternalTextureLoader {
    /**
     * Defines whether the loader supports cascade loading the different faces.
     */
    public readonly supportCascades = false;

    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param createPolynomials will be true if polynomials have been requested
     * @param onLoad defines the callback to trigger once the texture is ready
     * @param onError defines the callback to trigger in case of error
     */
    public loadCubeData(
        data: ArrayBufferView | ArrayBufferView[],
        texture: InternalTexture,
        createPolynomials: boolean,
        onLoad: Nullable<(data?: any) => void>,
        onError: Nullable<(message?: string, exception?: any) => void>
    ): void {}

    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    public loadData(
        data: ArrayBufferView,
        texture: InternalTexture,
        callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void, failedLoading?: boolean) => void
    ): void {}
}
