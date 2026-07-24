import type {} from "../../thinWebGPUEngine";

declare module "../../thinWebGPUEngine" {
    /** Adds alpha-to-coverage support to ThinWebGPUEngine. */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface ThinWebGPUEngine {
        /**
         * Gets a boolean indicating if alpha-to-coverage is enabled.
         * @returns true if alpha-to-coverage is enabled
         */
        getAlphaToCoverage(): boolean;

        /**
         * Enable or disable alpha-to-coverage.
         * @param enable defines the state to set
         */
        setAlphaToCoverage(enable: boolean): void;
    }
}
