export {};

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_gaussian_splatting_compression_spz_2 extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_gaussian_splatting_compression_spz_2"]: {
            /**
             * URL of the Adobe spz WASM library used to decode the SPZ payload.
             * Set to undefined to use the built-in gzip decoder (SPZ V2/V3 only).
             */
            spzLibraryUrl?: string;
        };
        /**
         * Defines options for the KHR_gaussian_splatting_compression_spz extension (earlier draft name).
         */
        ["KHR_gaussian_splatting_compression_spz"]: {
            /**
             * URL of the Adobe spz WASM library used to decode the SPZ payload.
             * Set to undefined to use the built-in gzip decoder (SPZ V2/V3 only).
             */
            spzLibraryUrl?: string;
        };
    }
}
