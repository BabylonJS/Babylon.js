export {};

// REVIEW: add a flag to effect to prevent multiple compilations of the same shader.
declare module "../Materials/effect.pure" {
    /** internal */
    export interface Effect {
        /** internal */
        _checkedNonFloatVertexBuffers?: boolean;
    }
}
