export {};

import { type BaseTexture } from "core/Materials/Textures/baseTexture";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the EXT_lights_image_based extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["EXT_lights_image_based"]: {};
    }
}

declare module "babylonjs-gltf2interface" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface IEXTLightsImageBased_LightImageBased {
        _babylonTexture?: BaseTexture;
        _loaded?: Promise<void>;
    }
}
