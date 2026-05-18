export {};

declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /** @internal */
        _cachedStencilBuffer: boolean;
        /** @internal */
        _cachedStencilFunction: number;
        /** @internal */
        _cachedStencilMask: number;
        /** @internal */
        _cachedStencilOperationPass: number;
        /** @internal */
        _cachedStencilOperationFail: number;
        /** @internal */
        _cachedStencilOperationDepthFail: number;
        /** @internal */
        _cachedStencilReference: number;

        /**
         * Gets the current stencil operation when stencil passes
         * @returns a number defining stencil operation to use when stencil passes
         */
        getStencilOperationPass(): number;

        /**
         * Gets the current back stencil operation when stencil passes
         * @returns a number defining back stencil operation to use when stencil passes
         */
        getStencilBackOperationPass(): number;

        /**
         * Gets a boolean indicating if stencil buffer is enabled
         * @returns the current stencil buffer state
         */
        getStencilBuffer(): boolean;

        /**
         * Enable or disable the stencil buffer
         * @param enable defines if the stencil buffer must be enabled or disabled
         */
        setStencilBuffer(enable: boolean): void;

        /**
         * Gets the current stencil mask
         * @returns a number defining the new stencil mask to use
         */
        getStencilMask(): number;
        /**
         * Sets the current stencil mask
         * @param mask defines the new stencil mask to use
         */
        setStencilMask(mask: number): void;

        /**
         * Gets the current stencil function
         * @returns a number defining the stencil function to use
         */
        getStencilFunction(): number;

        /**
         * Gets the current back stencil function
         * @returns a number defining the back stencil function to use
         */
        getStencilBackFunction(): number;

        /**
         * Gets the current stencil reference value
         * @returns a number defining the stencil reference value to use
         */
        getStencilFunctionReference(): number;

        /**
         * Gets the current stencil mask
         * @returns a number defining the stencil mask to use
         */
        getStencilFunctionMask(): number;

        /**
         * Sets the current stencil function
         * @param stencilFunc defines the new stencil function to use
         */
        setStencilFunction(stencilFunc: number): void;

        /**
         * Sets the current back stencil function
         * @param stencilFunc defines the new back stencil function to use
         */
        setStencilBackFunction(stencilFunc: number): void;

        /**
         * Sets the current stencil reference
         * @param reference defines the new stencil reference to use
         */
        setStencilFunctionReference(reference: number): void;

        /**
         * Sets the current stencil mask
         * @param mask defines the new stencil mask to use
         */
        setStencilFunctionMask(mask: number): void;

        /**
         * Gets the current stencil operation when stencil fails
         * @returns a number defining stencil operation to use when stencil fails
         */
        getStencilOperationFail(): number;

        /**
         * Gets the current back stencil operation when stencil fails
         * @returns a number defining back stencil operation to use when stencil fails
         */
        getStencilBackOperationFail(): number;

        /**
         * Gets the current stencil operation when depth fails
         * @returns a number defining stencil operation to use when depth fails
         */
        getStencilOperationDepthFail(): number;

        /**
         * Gets the current back stencil operation when depth fails
         * @returns a number defining back stencil operation to use when depth fails
         */
        getStencilBackOperationDepthFail(): number;

        /**
         * Sets the stencil operation to use when stencil fails
         * @param operation defines the stencil operation to use when stencil fails
         */
        setStencilOperationFail(operation: number): void;

        /**
         * Sets the back stencil operation to use when stencil fails
         * @param operation defines the back stencil operation to use when stencil fails
         */
        setStencilBackOperationFail(operation: number): void;

        /**
         * Sets the stencil operation to use when depth fails
         * @param operation defines the stencil operation to use when depth fails
         */
        setStencilOperationDepthFail(operation: number): void;

        /**
         * Sets the back stencil operation to use when depth fails
         * @param operation defines the back stencil operation to use when depth fails
         */
        setStencilBackOperationDepthFail(operation: number): void;

        /**
         * Sets the stencil operation to use when stencil passes
         * @param operation defines the stencil operation to use when stencil passes
         */
        setStencilOperationPass(operation: number): void;

        /**
         * Sets the back stencil operation to use when stencil passes
         * @param operation defines the back stencil operation to use when stencil passes
         */
        setStencilBackOperationPass(operation: number): void;

        /**
         * Caches the state of the stencil buffer
         */
        cacheStencilState(): void;

        /**
         * Restores the state of the stencil buffer
         */
        restoreStencilState(): void;
    }
}
