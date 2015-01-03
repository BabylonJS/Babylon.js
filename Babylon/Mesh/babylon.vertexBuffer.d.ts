declare module BABYLON {
    class VertexBuffer {
        private _mesh;
        private _engine;
        private _buffer;
        private _data;
        private _updatable;
        private _kind;
        private _strideSize;
        constructor(engine: any, data: number[], kind: string, updatable: boolean, postponeInternalCreation?: boolean, stride?: number);
        public isUpdatable(): boolean;
        public getData(): number[];
        public getBuffer(): WebGLBuffer;
        public getStrideSize(): number;
        public create(data?: number[]): void;
        public update(data: number[]): void;
        public updateDirectly(data: Float32Array, offset: number): void;
        public dispose(): void;
        private static _PositionKind;
        private static _NormalKind;
        private static _UVKind;
        private static _UV2Kind;
        private static _ColorKind;
        private static _MatricesIndicesKind;
        private static _MatricesWeightsKind;
        static PositionKind : string;
        static NormalKind : string;
        static UVKind : string;
        static UV2Kind : string;
        static ColorKind : string;
        static MatricesIndicesKind : string;
        static MatricesWeightsKind : string;
    }
}
