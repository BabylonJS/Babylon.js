import { type Nullable } from "core/types";
import { type DecalMapConfiguration } from "./material.decalMapConfiguration";
declare module "./standardMaterial.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface StandardMaterial {
        /** @internal */
        _decalMap: Nullable<DecalMapConfiguration>;

        /**
         * Defines the decal map parameters for the material.
         */
        decalMap: Nullable<DecalMapConfiguration>;
    }
}
