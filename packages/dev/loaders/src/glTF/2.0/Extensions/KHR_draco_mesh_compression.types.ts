export {};

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_draco_mesh_compression extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_draco_mesh_compression"]: {};
    }
}
