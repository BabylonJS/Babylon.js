export {};

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_xmp_json_ld extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_xmp_json_ld"]: {};
    }
}
