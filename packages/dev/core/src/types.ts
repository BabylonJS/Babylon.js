/* eslint-disable @typescript-eslint/naming-convention */
/** Alias type for value that can be null */
export type Nullable<T> = T | null;
/**
 * Alias type for number that are floats
 */
export type float = number;
/**
 * Alias type for number that are doubles.
 */
export type double = number;
/**
 * Alias type for number that are integer
 */
export type int = number;

// Tuple manipulation
/**
 * Empty
 */
export type Empty = [];

/**
 * Removes the first element of T and shifts
 */
export type Shift<T> = T extends unknown[] ? (((...x: T) => void) extends (h: any, ...t: infer I) => void ? I : []) : unknown;

/**
 * Gets the first element of T
 */
export type First<T> = T extends unknown[] ? (((...x: T) => void) extends (h: infer I, ...t: any) => void ? I : []) : never;

/**
 * Inserts A into T at the start of T
 */
export type Unshift<T, A> = T extends unknown[] ? (((h: A, ...t: T) => void) extends (...i: infer I) => void ? I : unknown) : never;

/**
 * Removes the last element of T
 */
export type Pop<T> = T extends unknown[] ? (((...x: T) => void) extends (...i: [...infer I, any]) => void ? I : unknown) : never;

/**
 * Gets the last element of T
 */
export type Last<T> = T extends unknown[] ? (((...x: T) => void) extends (...i: [...infer H, infer I]) => void ? I : unknown) : never;

/**
 * Appends A to T
 */
export type Push<T, A> = T extends unknown[] ? (((...a: [...T, A]) => void) extends (...i: infer I) => void ? I : unknown) : never;

/**
 * Concats A and B
 */
export type Concat<A, B> = { 0: A; 1: Concat<Unshift<A, 0>, Shift<B>> }[Empty extends B ? 0 : 1];

/**
 * Extracts from A what is not B
 *
 * @remarks
 * It does not remove duplicates (so Remove\<[0, 0, 0], [0, 0]\> yields [0]). This is intended and necessary behavior.
 */
export type Remove<A, B> = { 0: A; 1: Remove<Shift<A>, Shift<B>> }[Empty extends B ? 0 : 1];

/**
 * The length of T
 */
export type Length<T> = T extends { length: number } ? T["length"] : never;

type _FromLength<N extends number, R = Empty> = { 0: R; 1: _FromLength<N, Unshift<R, 0>> }[Length<R> extends N ? 0 : 1];

/**
 * Creates a tuple of length N
 */
export type FromLength<N extends number> = _FromLength<N>;

// compile-time math

/**
 * Increments N
 */
export type Increment<N extends number> = Length<Unshift<_FromLength<N>, 0>>;

/**
 * Decrements N
 */
export type Decrement<N extends number> = Length<Shift<_FromLength<N>>>;

/**
 * Gets the sum of A and B
 */
export type Add<A extends number, B extends number> = Length<Concat<_FromLength<A>, _FromLength<B>>>;

/**
 * Subtracts B from A
 */
export type Subtract<A extends number, B extends number> = Length<Remove<_FromLength<A>, _FromLength<B>>>;

/**
 * Gets the type of an array's members
 */
export type Member<T, D = null> = D extends 0 ? T : T extends (infer U)[] ? Member<U, D extends number ? Decrement<D> : null> : T;

/**
 * Flattens an array
 */
export type FlattenArray<A extends unknown[], D = null> = A extends (infer U)[] ? Member<Exclude<U, A>, D>[] : A extends unknown[] ? { [K in keyof A]: Member<A[K], D> } : A;

/**
 * Whether T is a tuple
 */
export type IsTuple<T> = T extends [] ? false : T extends [infer Head, ...infer Rest] ? true : false;

/**
 * Flattens a tuple
 */
export type FlattenTuple<A extends unknown[]> = A extends [infer U, ...infer Rest] ? (U extends unknown[] ? [...U, ...FlattenTuple<Rest>] : [U, ...FlattenTuple<Rest>]) : [];

/**
 * Flattens an array or tuple
 */
export type Flatten<A extends unknown[]> = IsTuple<A> extends true ? FlattenTuple<A> : FlattenArray<A>;

type _Tuple<T, N extends number, R extends unknown[] = Empty> = R["length"] extends N ? R : _Tuple<T, N, [T, ...R]>;

/**
 * Creates a tuple of T with length N
 */
export type Tuple<T, N extends number> = _Tuple<T, N>;

/** Alias type for number array or Float32Array */
export type FloatArray = number[] | Float32Array;
/** Alias type for number array or Float32Array or Int32Array or Uint32Array or Uint16Array */
export type IndicesArray = number[] | Int32Array | Uint32Array | Uint16Array;

/**
 * Alias type for all TypedArrays
 */
export type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array;

/**
 * Alias for types that can be used by a Buffer or VertexBuffer.
 */
export type DataArray = number[] | ArrayBufferLike | ArrayBufferView;

/**
 * Alias type for primitive types
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type Primitive = undefined | null | boolean | string | number | Function | Element;

/**
 * Type modifier to make all the properties of an object Readonly
 */
export type Immutable<T> = T extends Primitive
    ? T
    : T extends Array<infer U>
      ? ReadonlyArray<U>
      : /* T extends Map<infer K, infer V> ? ReadonlyMap<K, V> : // es2015+ only */
        DeepImmutable<T>;

/**
 * Type modifier to make all the properties of an object Readonly recursively
 */
export type DeepImmutable<T> = T extends Primitive
    ? T
    : T extends Array<infer U>
      ? DeepImmutableArray<U>
      : /* T extends Map<infer K, infer V> ? DeepImmutableMap<K, V> : // es2015+ only */
        DeepImmutableObject<T>;

/**
 * Type modifier to make all the properties of an object NonNullable
 */
export type NonNullableFields<T> = { [P in keyof T]: NonNullable<T[P]> };

/**
 * Type modifier to make all the properties of an object Writable (remove "readonly")
 */
export type WritableObject<T> = { -readonly [P in keyof T]: T[P] };

/**
 * Type modifier to make object properties readonly.
 */
export type DeepImmutableObject<T> = { readonly [K in keyof T]: DeepImmutable<T[K]> };

/** @internal */
interface DeepImmutableArray<T> extends ReadonlyArray<DeepImmutable<T>> {}
/** @internal */
/* interface DeepImmutableMap<K, V> extends ReadonlyMap<DeepImmutable<K>, DeepImmutable<V>> {} // es2015+ only */

export type Constructor<C extends new (...args: any[]) => any, I extends InstanceType<C> = InstanceType<C>> = {
    new (...args: ConstructorParameters<C>): I;
};

/**
 * Alias type for image sources
 */
export type ImageSource = ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas;

/**
 * Type for typed array like objects
 */
export interface TypedArrayLike extends ArrayBufferView {
    /**
     * The size in bytes of the array.
     */
    readonly length: number;
    [n: number]: number;
}

/**
 * Interface for a constructor of a TypedArray.
 */
export interface TypedArrayConstructor<T extends TypedArray = TypedArray> {
    new (length: number): T;
    new (elements: Iterable<number>): T;
    new (buffer: ArrayBufferLike, byteOffset?: number, length?: number): T;
    /**
     * The size in bytes of each element in the array.
     */
    readonly BYTES_PER_ELEMENT: number;
}
