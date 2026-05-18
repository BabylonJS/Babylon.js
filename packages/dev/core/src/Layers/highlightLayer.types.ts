import { type Nullable } from "../types";
import { type HighlightLayer } from "./highlightLayer.pure";
/* eslint-disable @typescript-eslint/no-unused-vars */

declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * Return a the first highlight layer of the scene with a given name.
         * @param name The name of the highlight layer to look for.
         * @returns The highlight layer if found otherwise null.
         */
        getHighlightLayerByName(name: string): Nullable<HighlightLayer>;
    }
}
