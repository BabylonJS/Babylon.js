export {};

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_interactivity extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_interactivity"]: {
            /**
             * Whether the selected default graph starts automatically after import.
             * Defaults to true.
             */
            autoStart?: boolean;
            /**
             * Whether to retain only the canonical source model and executable
             * FlowGraph serialization without constructing runtime graphs.
             * Defaults to false.
             */
            parseOnly?: boolean;
            /**
             * Whether to enforce the ratified graph validation rules.
             * Defaults to true. Set to false only for pre-ratification assets.
             */
            strictValidation?: boolean;
        };
    }
}
