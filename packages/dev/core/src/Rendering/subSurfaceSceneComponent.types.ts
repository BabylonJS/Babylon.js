import { type Nullable } from "../types";
import { type SubSurfaceConfiguration } from "./subSurfaceConfiguration";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _subSurfaceConfiguration: Nullable<SubSurfaceConfiguration>;

        /**
         * Gets or Sets the current prepass renderer associated to the scene.
         */
        subSurfaceConfiguration: Nullable<SubSurfaceConfiguration>;

        /**
         * Enables the subsurface effect for prepass
         * @returns the SubSurfaceConfiguration
         */
        enableSubSurfaceForPrePass(): Nullable<SubSurfaceConfiguration>;

        /**
         * Disables the subsurface effect for prepass
         */
        disableSubSurfaceForPrePass(): void;
    }
}
