/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class VertexBuffer {
        constructor(mesh: Mesh, data: any[], kind: string, updatable: boolean);

        isUpdatable(): boolean;
        getData(): any[];
        getStrideSize(): number;
        update(data: any[]): void;
        dispose(): void;

        PositionKind: string;
        NormalKind: string;
        UVKind: string;
        UV2Kind: string;
        ColorKind: string;
        MatricesIndicesKind: string;
        MatricesWeightsKind: string;
    }
}