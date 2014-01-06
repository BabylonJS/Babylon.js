/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class VertexBuffer {
        constructor(mesh: Mesh, data: any[], kind: string, updatable: boolean);

        isUpdatable(): boolean;
        getData(): any[];
        getStrideSize(): number;
        update(data: any[]): void;
        dispose(): void;

        static PositionKind: string;
        static NormalKind: string;
        static UVKind: string;
        static UV2Kind: string;
        static ColorKind: string;
        static MatricesIndicesKind: string;
        static MatricesWeightsKind: string;
    }
}