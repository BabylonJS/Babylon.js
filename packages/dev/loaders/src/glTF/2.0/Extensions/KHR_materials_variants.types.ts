export {};

declare module "../../glTFFileLoader" {
    // Define options related types here so they can be referenced in the options,
    // but export the types at the module level. This ensures the types are in the
    // correct namespace for UMD.
    // eslint-disable-next-line @typescript-eslint/naming-convention, jsdoc/require-jsdoc
    export type MaterialVariantsController = {
        /**
         * The list of available variant names for this asset.
         */
        readonly variants: readonly string[];

        /**
         * Gets or sets the selected variant.
         */
        selectedVariant: string;
    };

    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_variants extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_variants"]: Partial<{
            /**
             * Specifies the name of the variant that should be selected by default.
             */
            defaultVariant: string;

            /**
             * Defines a callback that will be called if material variants are loaded.
             * @experimental
             */
            onLoaded: (controller: MaterialVariantsController) => void;
        }>;
    }
}
