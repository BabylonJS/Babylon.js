import { type IMultiRenderTargetOptions } from "../../Materials/Textures/multiRenderTarget";
import { type Nullable } from "../../types";
import { type RenderTargetWrapper } from "../renderTargetWrapper";
import { type TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { type IColor4Like } from "../../Maths/math.like";
declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Unbind a list of render target textures from the webGL context
         * This is used only when drawBuffer extension or webGL2 are active
         * @param rtWrapper defines the render target wrapper to unbind
         * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
         * @param onBeforeUnbind defines a function which will be called before the effective unbind
         */
        unBindMultiColorAttachmentFramebuffer(rtWrapper: RenderTargetWrapper, disableGenerateMipMaps: boolean, onBeforeUnbind?: () => void): void;

        /**
         * Create a multi render target texture
         * @see https://doc.babylonjs.com/setup/support/webGL2#multiple-render-target
         * @param size defines the size of the texture
         * @param options defines the creation options
         * @param initializeBuffers if set to true, the engine will make an initializing call of drawBuffers
         * @returns a new render target wrapper ready to render textures
         */
        createMultipleRenderTarget(size: TextureSize, options: IMultiRenderTargetOptions, initializeBuffers?: boolean): RenderTargetWrapper;

        /**
         * Update the sample count for a given multiple render target texture
         * @see https://doc.babylonjs.com/setup/support/webGL2#multisample-render-targets
         * @param rtWrapper defines the render target wrapper to update
         * @param samples defines the sample count to set
         * @param initializeBuffers if set to true, the engine will make an initializing call of drawBuffers
         * @returns the effective sample count (could be 0 if multisample render targets are not supported)
         */
        updateMultipleRenderTargetTextureSampleCount(rtWrapper: Nullable<RenderTargetWrapper>, samples: number, initializeBuffers?: boolean): number;

        /**
         * Generates mipmaps for the texture of the (multi) render target
         * @param texture The render target containing the textures to generate the mipmaps for
         */
        generateMipMapsMultiFramebuffer(texture: RenderTargetWrapper): void;

        /**
         * Resolves the MSAA textures of the (multi) render target into their non-MSAA version.
         * Note that if "texture" is not a MSAA render target, no resolve is performed.
         * @param texture The render target texture containing the MSAA textures to resolve
         */
        resolveMultiFramebuffer(texture: RenderTargetWrapper): void;

        /**
         * Select a subsets of attachments to draw to.
         * @param attachments gl attachments
         */
        bindAttachments(attachments: number[]): void;

        /**
         * Clears selected color attachments and optionally the depth/stencil attachments.
         * Attachment formats are handled by the active rendering backend.
         * @param color Clear color
         * @param attachments Attachment layout created by buildTextureLayout
         * @param clearColor Whether color attachments should be cleared
         * @param clearDepth Whether the depth attachment should be cleared
         * @param clearStencil Whether the stencil attachment should be cleared
         * @param stencilClearValue Stencil clear value
         * @internal
         */
        clearAttachments(color: Nullable<IColor4Like>, attachments: number[], clearColor: boolean, clearDepth: boolean, clearStencil?: boolean, stencilClearValue?: number): void;

        /**
         * Creates a layout object to draw/clear on specific textures in a MRT
         * @param textureStatus textureStatus[i] indicates if the i-th is active
         * @param backBufferLayout if true, the layout will be built to account for the back buffer only, and textureStatus won't be used
         * @returns A layout to be fed to the engine, calling `bindAttachments`.
         */
        buildTextureLayout(textureStatus: boolean[], backBufferLayout?: boolean): number[];

        /**
         * Restores the webgl state to only draw on the main color attachment
         * when the frame buffer associated is the canvas frame buffer
         */
        restoreSingleAttachment(): void;

        /**
         * Restores the webgl state to only draw on the main color attachment
         * when the frame buffer associated is not the canvas frame buffer
         */
        restoreSingleAttachmentForRenderTarget(): void;
    }
}
