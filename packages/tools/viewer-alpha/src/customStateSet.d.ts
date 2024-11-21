/**
 * TODO: remove this file when we upgrade to TypeScript 5.5
 */

interface CustomStateSet {
    readonly size: number;
    add(state: string): void;
    clear(): void;
    delete(state: string): void;
    has(state: string): boolean;
}

interface ElementInternals {
    readonly states?: CustomStateSet;
}
