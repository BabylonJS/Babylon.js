import { type PrePassRenderTarget } from "../Materials/Textures/prePassRenderTarget";
import { type Nullable } from "../types";
import { type PrePassRenderer } from "./prePassRenderer";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _prePassRenderer: Nullable<PrePassRenderer>;

        /**
         * Gets or Sets the current prepass renderer associated to the scene.
         */
        prePassRenderer: Nullable<PrePassRenderer>;

        /**
         * Enables the prepass and associates it with the scene
         * @returns the PrePassRenderer
         */
        enablePrePassRenderer(): Nullable<PrePassRenderer>;

        /**
         * Disables the prepass associated with the scene
         */
        disablePrePassRenderer(): void;
    }
}
declare module "../Materials/Textures/renderTargetTexture.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface RenderTargetTexture {
        /**
         * Gets or sets a boolean indicating that the prepass renderer should not be used with this render target
         */
        noPrePassRenderer: boolean;
        /** @internal */
        _prePassRenderTarget: Nullable<PrePassRenderTarget>;
    }
}
