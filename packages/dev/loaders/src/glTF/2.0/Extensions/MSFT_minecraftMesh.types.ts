export {};

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the MSFT_minecraftMesh extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["MSFT_minecraftMesh"]: {};
    }
}
