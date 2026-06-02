export {};

// REVIEW: add a flag to effect to prevent multiple compilations of the same shader.
declare module "../Materials/effect.pure" {
    /** internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Effect {
        /** internal */
        _checkedNonFloatVertexBuffers?: boolean;
    }
}
