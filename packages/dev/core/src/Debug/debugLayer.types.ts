import { type DebugLayer } from "./debugLayer.pure";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * @internal
         * Backing field
         */
        _debugLayer?: DebugLayer;

        /**
         * Gets the debug layer (aka Inspector) associated with the scene
         * @see https://doc.babylonjs.com/toolsAndResources/inspector
         */
        debugLayer: DebugLayer;
    }
}
