import { type Nullable } from "core/types";
import { type FluidRenderer } from "./fluidRenderer.pure";
declare module "../../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _fluidRenderer: Nullable<FluidRenderer>;

        /**
         * Gets or Sets the fluid renderer associated to the scene.
         */
        fluidRenderer: Nullable<FluidRenderer>;

        /**
         * Enables the fluid renderer and associates it with the scene
         * @returns the FluidRenderer
         */
        enableFluidRenderer(): Nullable<FluidRenderer>;

        /**
         * Disables the fluid renderer associated with the scene
         */
        disableFluidRenderer(): void;
    }
}
