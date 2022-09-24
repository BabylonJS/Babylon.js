/** @internal */
export interface IDrawContext {
    uniqueId: number;
    useInstancing: boolean;

    reset(): void;
    dispose(): void;
}
