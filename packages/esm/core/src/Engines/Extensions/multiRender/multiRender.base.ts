import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper.js";
import type { IMultiRenderTargetOptions } from "core/Materials/Textures/multiRenderTarget.js";
import type { TextureSize } from "core/Materials/Textures/textureCreationOptions.js";
import type { Nullable } from "core/types.js";
import type { IBaseEnginePublic } from "../../engine.base.js";

export interface IMultiRenderEngineExtension {
    /**
     * Unbind a list of render target textures from the webGL context
     * This is used only when drawBuffer extension or webGL2 are active
     * @param rtWrapper defines the render target wrapper to unbind
     * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
     * @param onBeforeUnbind defines a function which will be called before the effective unbind
     */
    unBindMultiColorAttachmentFramebuffer(engineState: IBaseEnginePublic, rtWrapper: RenderTargetWrapper, disableGenerateMipMaps: boolean, onBeforeUnbind?: () => void): void;

    /**
     * Create a multi render target texture
     * @see https://doc.babylonjs.com/setup/support/webGL2#multiple-render-target
     * @param size defines the size of the texture
     * @param options defines the creation options
     * @param initializeBuffers if set to true, the engine will make an initializing call of drawBuffers
     * @returns a new render target wrapper ready to render textures
     */
    createMultipleRenderTarget(engineState: IBaseEnginePublic, size: TextureSize, options: IMultiRenderTargetOptions, initializeBuffers?: boolean): RenderTargetWrapper;

    /**
     * Update the sample count for a given multiple render target texture
     * @see https://doc.babylonjs.com/setup/support/webGL2#multisample-render-targets
     * @param rtWrapper defines the render target wrapper to update
     * @param samples defines the sample count to set
     * @param initializeBuffers if set to true, the engine will make an initializing call of drawBuffers
     * @returns the effective sample count (could be 0 if multisample render targets are not supported)
     */
    updateMultipleRenderTargetTextureSampleCount(engineState: IBaseEnginePublic, rtWrapper: Nullable<RenderTargetWrapper>, samples: number, initializeBuffers?: boolean): number;

    /**
     * Select a subsets of attachments to draw to.
     * @param attachments gl attachments
     */
    bindAttachments(engineState: IBaseEnginePublic, attachments: number[]): void;

    /**
     * Creates a layout object to draw/clear on specific textures in a MRT
     * @param textureStatus textureStatus[i] indicates if the i-th is active
     * @returns A layout to be fed to the engine, calling `bindAttachments`.
     */
    buildTextureLayout(engineState: IBaseEnginePublic, textureStatus: boolean[]): number[];

    /**
     * Restores the webgl state to only draw on the main color attachment
     * when the frame buffer associated is the canvas frame buffer
     */
    restoreSingleAttachment(engineState: IBaseEnginePublic): void;

    /**
     * Restores the webgl state to only draw on the main color attachment
     * when the frame buffer associated is not the canvas frame buffer
     */
    restoreSingleAttachmentForRenderTarget(engineState: IBaseEnginePublic): void;
}
