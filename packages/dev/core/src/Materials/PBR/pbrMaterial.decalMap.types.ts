import { type Nullable } from "core/types";
import { type DecalMapConfiguration } from "../material.decalMapConfiguration";
declare module "./pbrBaseMaterial.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface PBRBaseMaterial {
        /** @internal */
        _decalMap: Nullable<DecalMapConfiguration>;

        /**
         * Defines the decal map parameters for the material.
         */
        decalMap: Nullable<DecalMapConfiguration>;
    }
}
