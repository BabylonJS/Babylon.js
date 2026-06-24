export {};

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the MSFT_lod extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["MSFT_lod"]: Partial<{
            /**
             * Maximum number of LODs to load, starting from the lowest LOD.
             */
            maxLODsToLoad: number;
        }>;
    }
}
