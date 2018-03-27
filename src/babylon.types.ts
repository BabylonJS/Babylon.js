module BABYLON {
    export type Nullable<T> = T | null;
    export type float = number;
    export type double = number;
    export type int = number;

    export type FloatArray = number[] | Float32Array;
    export type IndicesArray = number[] | Int32Array | Uint32Array | Uint16Array;

    /**
     * Alias for types that can be used by a Buffer or VertexBuffer.
     */
    export type DataArray = number[] | ArrayBuffer | ArrayBufferView;
}
