module BABYLON {
    /**
     * Internal interface used to track {BABYLON.InternalTexture} already bound to the GL context
     */
    export interface IInternalTextureTracker {
        /**
         * Gets or set the previous tracker in the list
         */
        previous: Nullable<IInternalTextureTracker>;
        /**
         * Gets or set the next tracker in the list
         */
        next: Nullable<IInternalTextureTracker>;
    }

    /**
     * Internal class used by the engine to get list of {BABYLON.InternalTexture} already bound to the GL context
     */
    export class DummyInternalTextureTracker {
        /**
         * Gets or set the previous tracker in the list
         */
        public previous: Nullable<IInternalTextureTracker> = null;
        /**
         * Gets or set the next tracker in the list
         */
        public next: Nullable<IInternalTextureTracker> = null;
    }
}