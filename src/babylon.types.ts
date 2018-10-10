namespace BABYLON {
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

  type Primitive = undefined | null | boolean | string | number | Function;

  export type Immutable<T> = T extends Primitive
    ? T
    : T extends Array<infer U>
      ? ReadonlyArray<U>
      : /* T extends Map<infer K, infer V> ? ReadonlyMap<K, V> : // es2015+ only */
        Readonly<T>;

  export type DeepImmutable<T> = T extends Primitive
    ? T
    : T extends Array<infer U>
      ? DeepImmutableArray<U>
      : /* T extends Map<infer K, infer V> ? DeepImmutableMap<K, V> : // es2015+ only */
        DeepImmutableObject<T>;

  interface DeepImmutableArray<T> extends ReadonlyArray<DeepImmutable<T>> {}
  /* interface DeepImmutableMap<K, V> extends ReadonlyMap<DeepImmutable<K>, DeepImmutable<V>> {} // es2015+ only */
  type DeepImmutableObject<T> = { readonly [K in keyof T]: DeepImmutable<T[K]> };
}
