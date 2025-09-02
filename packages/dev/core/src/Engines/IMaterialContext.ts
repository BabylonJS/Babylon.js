/** @internal */
export interface IMaterialContext {
    uniqueId: number;
    useVertexPulling: boolean;

    reset(): void;
}
