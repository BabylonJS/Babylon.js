export {};

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_diffuse_roughness extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_diffuse_roughness"]: {};
    }
}
