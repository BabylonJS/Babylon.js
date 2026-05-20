import { type Nullable } from "../types";
import { type GlowLayer } from "./glowLayer.pure";
/* eslint-disable @typescript-eslint/no-unused-vars */

declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * Return the first glow layer of the scene with a given name.
         * @param name The name of the glow layer to look for.
         * @returns The glow layer if found otherwise null.
         */
        getGlowLayerByName(name: string): Nullable<GlowLayer>;
    }
}
