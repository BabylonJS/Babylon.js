import { type Nullable } from "../types";
import { type Camera } from "../Cameras/camera";
import { type RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { type DepthRenderer } from "./depthRenderer";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _depthRenderer: { [id: string]: DepthRenderer };

        /**
         * Creates a depth renderer a given camera which contains a depth map which can be used for post processing.
         * @param camera The camera to create the depth renderer on (default: scene's active camera)
         * @param storeNonLinearDepth Defines whether the depth is stored linearly like in Babylon Shadows or directly like glFragCoord.z
         * @param force32bitsFloat Forces 32 bits float when supported (else 16 bits float is prioritized over 32 bits float if supported)
         * @param samplingMode The sampling mode to be used with the render target (Linear, Nearest...)
         * @param storeCameraSpaceZ Defines whether the depth stored is the Z coordinate in camera space. If true, storeNonLinearDepth has no effect. (Default: false)
         * @param existingRenderTargetTexture An existing render target texture to use (default: undefined). If not provided, a new render target texture will be created.
         * @returns the created depth renderer
         */
        enableDepthRenderer(
            camera?: Nullable<Camera>,
            storeNonLinearDepth?: boolean,
            force32bitsFloat?: boolean,
            samplingMode?: number,
            storeCameraSpaceZ?: boolean,
            existingRenderTargetTexture?: RenderTargetTexture
        ): DepthRenderer;

        /**
         * Disables a depth renderer for a given camera
         * @param camera The camera to disable the depth renderer on (default: scene's active camera)
         */
        disableDepthRenderer(camera?: Nullable<Camera>): void;
    }
}
