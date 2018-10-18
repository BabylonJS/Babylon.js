module BABYLON {
    /** Alias type for value that can be null */
    export type Nullable<T> = T | null;
    /**
     * Alias type for number that are floats
     * @ignorenaming
     */
    export type float = number;
    /**
     * Alias type for number that are doubles.
     * @ignorenaming
     */
    export type double = number;
    /**
     * Alias type for number that are integer
     * @ignorenaming
     */
    export type int = number;

    /** Alias type for number array or Float32Array */
    export type FloatArray = number[] | Float32Array;
    /** Alias type for number array or Float32Array or Int32Array or Uint32Array or Uint16Array */
    export type IndicesArray = number[] | Int32Array | Uint32Array | Uint16Array;

    /**
     * Alias for types that can be used by a Buffer or VertexBuffer.
     */
    export type DataArray = number[] | ArrayBuffer | ArrayBufferView;
}
