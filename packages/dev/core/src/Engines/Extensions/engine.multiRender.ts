import type { IMultiRenderTargetOptions } from "../../Materials/Textures/multiRenderTarget";
import type { Nullable } from "../../types";
import * as extension from "core/esm/Engines/WebGL/Extensions/multiRender/multiRender.webgl";
import { ThinEngine } from "../../Engines/thinEngine";
import { EngineExtensions, loadExtension } from "core/esm/Engines/Extensions/engine.extensions";
import type { RenderTargetWrapper } from "../renderTargetWrapper";
import type { WebGLRenderTargetWrapper } from "../WebGL/webGLRenderTargetWrapper";
import type { TextureSize } from "../../Materials/Textures/textureCreationOptions";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
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
         * Select a subsets of attachments to draw to.
         * @param attachments gl attachments
         */
        bindAttachments(attachments: number[]): void;

        /**
         * Creates a layout object to draw/clear on specific textures in a MRT
         * @param textureStatus textureStatus[i] indicates if the i-th is active
         * @returns A layout to be fed to the engine, calling `bindAttachments`.
         */
        buildTextureLayout(textureStatus: boolean[]): number[];

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

ThinEngine.prototype.restoreSingleAttachment = function (): void {
    extension.restoreSingleAttachment(this._engineState);
};

ThinEngine.prototype.restoreSingleAttachmentForRenderTarget = function (): void {
    extension.restoreSingleAttachmentForRenderTarget(this._engineState);
};

ThinEngine.prototype.buildTextureLayout = function (textureStatus: boolean[]): number[] {
    return extension.buildTextureLayout(this._engineState, textureStatus);
};

ThinEngine.prototype.bindAttachments = function (attachments: number[]): void {
    extension.bindAttachments(this._engineState, attachments);
};

ThinEngine.prototype.unBindMultiColorAttachmentFramebuffer = function (
    rtWrapper: WebGLRenderTargetWrapper,
    disableGenerateMipMaps: boolean = false,
    onBeforeUnbind?: () => void
): void {
    extension.unBindMultiColorAttachmentFramebuffer(this._engineState, rtWrapper, disableGenerateMipMaps, onBeforeUnbind);
};

ThinEngine.prototype.createMultipleRenderTarget = function (size: TextureSize, options: IMultiRenderTargetOptions, initializeBuffers: boolean = true): RenderTargetWrapper {
    return extension.createMultipleRenderTarget(this._engineState, size, options, initializeBuffers);
};

ThinEngine.prototype.updateMultipleRenderTargetTextureSampleCount = function (
    rtWrapper: Nullable<WebGLRenderTargetWrapper>,
    samples: number,
    initializeBuffers: boolean = true
): number {
    return extension.updateMultipleRenderTargetTextureSampleCount(this._engineState, rtWrapper, samples, initializeBuffers);
};

loadExtension(EngineExtensions.MULTI_RENDER, extension);
